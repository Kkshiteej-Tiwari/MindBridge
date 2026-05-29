import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { sendCoachMessage, sendCoachMessageStream } from "./services/coachApi";
import { BreathingExercise } from "../../components/BreathingExercise";

const starterMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I am here with you. Tell me what feels most important today.",
  tags: ["Welcome"],
  createdAt: new Date().toISOString(),
};

const quickActions = [
  { label: "🫁 I need to breathe", message: "I need to breathe and reset.", isBreathing: true },
  { label: "😰 I feel overwhelmed", message: "I feel overwhelmed and stuck." },
  { label: "🎯 Help me focus", message: "I am struggling to focus on my tasks." },
  { label: "💜 I feel lonely", message: "I feel lonely and disconnected." },
  { label: "🗣️ Talk to someone", message: "I want to talk to someone." },
  { label: "✅ I am okay now", message: "I am okay now." },
];

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 rounded-full bg-ink/50 animate-bounce" />
      <span className="h-2 w-2 rounded-full bg-ink/50 animate-bounce" style={{ animationDelay: "0.12s" }} />
      <span className="h-2 w-2 rounded-full bg-ink/50 animate-bounce" style={{ animationDelay: "0.24s" }} />
    </div>
  );
}

export function CoachPage() {
  const [messages, setMessages] = useState([starterMessage]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [riskLevel, setRiskLevel] = useState("neutral");
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [showBreathing, setShowBreathing] = useState(false);
  const streamTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamTimeoutRef.current) {
        window.clearTimeout(streamTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const historyPayload = useMemo(
    () =>
      messages.slice(-6).map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
    [messages],
  );

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading || streamingId) {
      return;
    }

    setError("");
    setLoading(true);

    const userMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");

    const assistantId = createId();

    // Try SSE streaming first, fall back to regular API
    try {
      const assistantMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        tags: [],
        isStreaming: true,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, assistantMessage]);
      setStreamingId(assistantId);

      try {
        // Attempt SSE streaming
        const finalPayload = await sendCoachMessageStream({
          message: trimmed,
          sessionId,
          history: historyPayload,
          onDelta: (deltaText) => {
            setMessages((current) =>
              current.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + deltaText }
                  : msg,
              ),
            );
          },
        });

        // Update with final payload
        setSessionId(finalPayload.sessionId);
        setRiskLevel(finalPayload.riskLevel);
        setSuggestedActions(finalPayload.suggestedActions || []);
        setResources(finalPayload.resources || []);
        setMessages((current) =>
          current.map((msg) =>
            msg.id === assistantId
              ? { ...msg, isStreaming: false, tags: finalPayload.tags || [] }
              : msg,
          ),
        );
      } catch {
        // Fall back to regular API call
        const response = await sendCoachMessage({
          message: trimmed,
          sessionId,
          history: historyPayload,
        });

        setSessionId(response.sessionId);
        setRiskLevel(response.riskLevel);
        setSuggestedActions(response.suggestedActions || []);
        setResources(response.resources || []);

        // Animate the response text character by character
        const fullText = response.reply || "";
        let index = 0;
        const stepSize = Math.max(1, Math.ceil(fullText.length / 80));

        const step = () => {
          index = Math.min(fullText.length, index + stepSize);
          setMessages((current) =>
            current.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: fullText.slice(0, index) }
                : msg,
            ),
          );

          if (index < fullText.length) {
            streamTimeoutRef.current = window.setTimeout(step, 18);
          } else {
            setMessages((current) =>
              current.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, isStreaming: false, tags: response.tags || [] }
                  : msg,
              ),
            );
          }
        };
        step();
      }
    } catch (sendError) {
      setError(sendError.message || "Unable to reach the wellness coach.");
      // Remove the empty assistant message on error
      setMessages((current) => current.filter((msg) => msg.id !== assistantId));
    } finally {
      setLoading(false);
      setStreamingId(null);
    }
  };

  const handleQuickAction = (action) => {
    if (action.isBreathing) {
      setShowBreathing(true);
    } else {
      handleSend(action.message);
    }
  };

  const showTyping = loading && !streamingId;
  const isBusy = loading || Boolean(streamingId);
  const crisisActive = riskLevel === "crisis";

  return (
    <section className="relative space-y-6">
      {crisisActive ? (
        <div className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-coral/40 bg-coral/10 crisis-active" />
      ) : null}

      <header className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">AI Wellness Coach</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Talk it out, one step at a time</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Share what is going on. MindBridge responds with grounded, student friendly support and practical next steps.
        </p>
      </header>

      {riskLevel === "crisis" && resources.length ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border-2 border-coral/30 bg-coral/10 p-5 text-sm text-ink crisis-active"
        >
          <p className="font-semibold text-coral">⚠️ You deserve immediate support.</p>
          <p className="mt-2 text-ink/70">
            If you are in danger or feel unable to stay safe, reach out to a trusted person or contact a helpline now.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {resources.map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-coral/20 bg-white/80 p-4">
                <p className="text-sm font-semibold text-ink">{resource.title}</p>
                <p className="mt-1 text-xs text-ink/70">{resource.description}</p>
                <p className="mt-2 text-sm font-semibold text-coral">{resource.phone}</p>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="relative rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Conversation</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">Safe space chat</h3>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                crisisActive
                  ? "border-coral/40 bg-coral/10 text-coral"
                  : riskLevel === "distressed"
                  ? "border-amber-300/40 bg-amber-50 text-amber-600"
                  : "border-ink/10 bg-foam text-ink/70"
              }`}
            >
              {crisisActive ? "⚠️ " : ""}Risk: {riskLevel}
            </span>
          </div>

          <div className="mt-6 max-h-[480px] space-y-4 overflow-y-auto pr-2">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-md ${
                    message.role === "user"
                      ? "bg-ink text-cream"
                      : "glass text-ink"
                  }`}
                >
                  <p>
                    {message.content}
                    {message.isStreaming ? (
                      <span className="inline-flex items-center pl-2 align-middle">
                        <span className="inline-block h-3 w-0.5 animate-pulse bg-reef rounded-full" />
                      </span>
                    ) : null}
                  </p>
                  {message.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-reef/30 bg-reef/10 px-2 py-0.5 text-[10px] font-semibold text-reef"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
            {showTyping ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex justify-start"
              >
                <div className="rounded-2xl glass px-4 py-3 shadow-md">
                  <TypingDots />
                </div>
              </motion.div>
            ) : null}
            <div ref={chatEndRef} />
          </div>

          {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Share what is on your mind"
              className="flex-1 rounded-full border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-reef/60 focus:shadow-lg focus:shadow-reef/10"
            />
            <button
              type="submit"
              className="rounded-full bg-reef px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-50"
              disabled={isBusy}
            >
              {loading ? "Thinking..." : streamingId ? "Streaming..." : "Send"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => window.location.assign("/sos")}
            className={`absolute -bottom-5 right-6 rounded-full px-4 py-2 text-xs font-semibold text-cream shadow-lg transition ${
              crisisActive
                ? "bg-coral shadow-coral/40 sos-pulse"
                : "bg-coral/80 shadow-coral/20 hover:bg-coral"
            }`}
          >
            🆘 SOS resources
          </button>
        </div>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Quick actions</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">Start the conversation</h3>
            <div className="mt-4 grid gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => handleQuickAction(action)}
                  disabled={isBusy}
                  className="rounded-2xl border border-ink/10 bg-foam px-4 py-3 text-left text-sm font-semibold text-ink/80 transition hover:border-reef/60 hover:bg-reef/5 disabled:opacity-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Suggested next steps</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">Gentle moves</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink/70">
              {suggestedActions.length ? (
                suggestedActions.map((action) => (
                  <li key={action} className="rounded-2xl border border-ink/10 bg-white px-4 py-3">
                    {action}
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-ink/10 bg-white px-4 py-3">
                  Keep sharing and I will tailor steps for you.
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Grounding</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">Two minute reset</h3>
            <p className="mt-3 text-sm text-ink/70">
              Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat four rounds.
            </p>
            <button
              type="button"
              onClick={() => setShowBreathing(true)}
              className="mt-4 w-full rounded-2xl bg-reef/10 border border-reef/30 px-4 py-3 text-sm font-semibold text-reef transition hover:bg-reef/20"
            >
              🫁 Start breathing exercise
            </button>
          </div>
        </aside>
      </div>

      {showBreathing ? <BreathingExercise onClose={() => setShowBreathing(false)} /> : null}
    </section>
  );
}
