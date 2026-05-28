import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { analyzeSentiment } from "../services/sentimentApi";

function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function JournalEditor({ entry, onSave, saving, onRegisterEntry }) {
  const [content, setContent] = useState(entry?.content ?? "");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [localSaving, setLocalSaving] = useState(false);
  const [sentiment, setSentiment] = useState({
    sentiment: "neutral",
    confidence: 0.5,
    mood_score: 50,
    intensity: "low",
    gradient: { from: "#F7B731", to: "#F7B731" },
  });
  const debounceRef = useRef(null);
  const sentimentDebounceRef = useRef(null);
  const sentimentAbortRef = useRef(null);
  const sentimentCacheRef = useRef(new Map());
  const requestIdRef = useRef(0);
  const recognitionRef = useRef(null);
  const hydratedEntryIdRef = useRef(entry?.id ?? null);

  useEffect(() => {
    setContent(entry?.content ?? "");
    setTranscript("");
    setVoiceError("");
    hydratedEntryIdRef.current = entry?.id ?? null;
  }, [entry?.id, entry?.content]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcriptText = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalText += transcriptText;
        } else {
          interim += transcriptText;
        }
      }

      const combined = `${finalText} ${interim}`.trim();
      if (combined) {
        setTranscript(combined);
      }
      if (finalText.trim()) {
        setContent((current) => {
          const separator = current.trim() ? "\n" : "";
          return `${current}${separator}${finalText.trim()}`;
        });
      }
    };

    recognition.onerror = (event) => {
      setVoiceError(event.error === "not-allowed" ? "Microphone access was denied." : "Voice capture failed.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  const toggleVoice = () => {
    setVoiceError("");
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError("Voice transcription is only available in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        setVoiceError("Voice transcription could not start.");
      }
    }
  };

  useEffect(() => {
    if (!entry?.id) {
      return undefined;
    }

    if (hydratedEntryIdRef.current !== entry.id) {
      hydratedEntryIdRef.current = entry.id;
      return undefined;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      if (content === (entry?.content ?? "")) {
        return;
      }

      setLocalSaving(true);
      try {
        await onSave(entry.id, content);
      } finally {
        setLocalSaving(false);
      }
    }, 900);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [content, entry?.content, entry?.id, onSave]);

  // sentiment debounce & async analysis
  useEffect(() => {
    if (sentimentDebounceRef.current) {
      window.clearTimeout(sentimentDebounceRef.current);
    }

    // don't analyze empty content
    if (!content || content.trim().length === 0) {
      setSentiment((s) => ({ ...s, sentiment: "neutral", mood_score: 50 }));
      return;
    }

    sentimentDebounceRef.current = window.setTimeout(async () => {
      const text = content.trim();
      const cached = sentimentCacheRef.current.get(text);
      if (cached) {
        setSentiment(cached);
        return;
      }

      // abort previous
      if (sentimentAbortRef.current) {
        sentimentAbortRef.current.abort();
      }

      const controller = new AbortController();
      sentimentAbortRef.current = controller;
      const myRequestId = ++requestIdRef.current;

      try {
        const result = await analyzeSentiment(text, { signal: controller.signal });
        // ignore out-of-order responses
        if (myRequestId !== requestIdRef.current) return;
        sentimentCacheRef.current.set(text, result);
        setSentiment(result);
      } catch (err) {
        // keep previous sentiment on error
        // console.debug('sentiment failed', err)
      } finally {
        if (sentimentAbortRef.current === controller) {
          sentimentAbortRef.current = null;
        }
      }
    }, 400);

    return () => {
      if (sentimentDebounceRef.current) {
        window.clearTimeout(sentimentDebounceRef.current);
      }
    };
  }, [content]);

  if (!entry) {
    return null;
  }

  const gradientStyle = {
    background: `linear-gradient(135deg, ${sentiment.gradient.from}, ${sentiment.gradient.to})`,
    transition: "background 400ms ease",
  };

  return (
    <motion.section
      className="rounded-3xl border border-ink/10 p-5 shadow-xl shadow-ink/10 backdrop-blur-md md:p-6"
      style={gradientStyle}
      animate={{ boxShadow: localSaving || saving ? "0 8px 30px rgba(0,0,0,0.08)" : "0 4px 14px rgba(0,0,0,0.04)" }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Your Safe Space</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink md:text-3xl">Mood journal</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRegisterEntry}
            className="rounded-full bg-reef px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-105"
          >
            Register entry
          </button>
          <div className="rounded-full border border-reef/30 bg-reef/15 px-4 py-2 text-sm text-reef">
            {localSaving || saving ? "Saving..." : `Last updated ${formatTimestamp(entry.updatedAt)}`}
          </div>
        </div>
      </div>

      <label className="mb-3 block text-sm text-ink/70">Write about your day</label>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleVoice}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
            isListening ? "border-coral bg-coral/10 text-coral" : "border-reef/40 bg-reef/10 text-ink"
          }`}
        >
          {isListening ? "Stop voice note" : "Start voice note"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!transcript) return;
            setContent((current) => `${current}${current.trim() ? "\n" : ""}${transcript}`);
            setTranscript("");
          }}
          disabled={!transcript}
          className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add transcript
        </button>
        {transcript ? <span className="text-xs text-ink/60">Live transcript is updating.</span> : null}
      </div>
      {voiceError ? <p className="mb-3 text-sm text-coral">{voiceError}</p> : null}
      <motion.textarea
        animate={{ boxShadow: localSaving || saving ? "0 0 0 1px rgba(16,18,26,0.25)" : "0 0 0 1px rgba(16,18,26,0.08)" }}
        transition={{ duration: 0.25 }}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="What happened today? What stood out?"
        className="min-h-[360px] w-full rounded-2xl border border-ink/10 bg-white/80 p-5 text-lg leading-8 text-ink outline-none placeholder:text-ink/30 focus:border-reef/50"
      />

      <div className="mt-3 flex items-center justify-between text-sm text-ink/60">
        <span>{content.trim().length} characters</span>
        <div className="flex items-center gap-3">
          <div className="w-40">
            <div className="h-2 w-full rounded-full bg-white/40">
              <div
                className="h-2 rounded-full"
                style={{ width: `${sentiment.mood_score}%`, background: "rgba(255,255,255,0.9)", transition: "width 300ms ease" }}
              />
            </div>
          </div>
          <span className="whitespace-nowrap">Mood: {sentiment.mood_score}</span>
        </div>
      </div>
      {transcript ? (
        <div className="mt-3 rounded-2xl border border-ink/10 bg-white/70 p-3 text-sm text-ink/70">
          <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Voice transcript</p>
          <p className="mt-2 leading-6 text-ink/80">{transcript}</p>
        </div>
      ) : null}
    </motion.section>
  );
}
