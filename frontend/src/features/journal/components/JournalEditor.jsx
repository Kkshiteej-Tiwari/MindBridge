import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { VoiceWave } from "./VoiceWave";

function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function JournalEditor({ entry, onSave, saving }) {
  const [content, setContent] = useState(entry?.content ?? "");
  const [localSaving, setLocalSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [supportsVoice, setSupportsVoice] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const debounceRef = useRef(null);
  const hydratedEntryIdRef = useRef(entry?.id ?? null);

  useEffect(() => {
    setContent(entry?.content ?? "");
    hydratedEntryIdRef.current = entry?.id ?? null;
  }, [entry?.id, entry?.content]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return undefined;
    }

    setSupportsVoice(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += `${transcript.trim()} `;
        } else {
          interim += transcript;
        }
      }

      finalTranscriptRef.current = finalText;
      setContent((current) => `${finalText}${interim}`.trimStart());
    };

    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceError("");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      setVoiceError(event?.error || "Microphone access blocked.");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

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

  if (!entry) {
    return null;
  }

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setVoiceError("Voice journaling needs a browser that supports speech recognition.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      return;
    }
    finalTranscriptRef.current = content ? `${content.trim()} ` : "";
    try {
      recognitionRef.current.start();
      setVoiceError("");
    } catch (error) {
      setVoiceError("Unable to start voice capture. Please allow microphone access.");
      setIsRecording(false);
    }
  };

  return (
    <section className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10 backdrop-blur-md md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Your Safe Space</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink md:text-3xl">Mood journal</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleRecording}
            disabled={!supportsVoice}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              isRecording
                ? "border-coral/40 bg-coral/15 text-coral"
                : "border-reef/40 bg-reef/10 text-reef"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <VoiceWave active={isRecording} />
            {isRecording ? "Recording" : "Voice note"}
          </button>
          <div className="rounded-full border border-reef/30 bg-reef/15 px-4 py-2 text-sm text-reef">
            {localSaving || saving ? "Saving..." : `Last updated ${formatTimestamp(entry.updatedAt)}`}
          </div>
        </div>
      </div>

      {!supportsVoice ? (
        <p className="mb-3 text-xs text-ink/60">Voice journaling works best in Chrome or Edge with microphone permission.</p>
      ) : null}
      {voiceError ? <p className="mb-3 text-xs text-coral">{voiceError}</p> : null}

      <label className="mb-3 block text-sm text-ink/70">Write about your day</label>
      <motion.textarea
        animate={{ boxShadow: localSaving || saving ? "0 0 0 1px rgba(46,196,182,0.45)" : "0 0 0 1px rgba(16,18,26,0.08)" }}
        transition={{ duration: 0.25 }}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="What happened today? What stood out?"
        className="min-h-[360px] w-full rounded-2xl border border-ink/10 bg-white/80 p-5 text-lg leading-8 text-ink outline-none placeholder:text-ink/30 focus:border-reef/50"
      />

      <div className="mt-3 flex items-center justify-between text-sm text-ink/60">
        <span>{content.trim().length} characters</span>
        <span>Autosave every 900ms</span>
      </div>
    </section>
  );
}
