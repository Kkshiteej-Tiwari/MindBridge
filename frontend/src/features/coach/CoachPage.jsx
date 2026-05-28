import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { sendCoachMessage, sendCoachMessageStream } from "./services/coachApi";

const starterMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I am here with you. Tell me what feels most important today.",
  tags: ["Welcome"],
  createdAt: new Date().toISOString(),
};

const quickActions = [
  { label: "I need to breathe", message: "I need to breathe and reset." },
  { label: "I feel overwhelmed", message: "I feel overwhelmed and stuck." },
  { label: "Help me focus", message: "I am struggling to focus on my tasks." },
  { label: "I feel lonely", message: "I feel lonely and disconnected." },
];

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function CoachPage() {
  const [messages, setMessages] = useState([starterMessage]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [riskLevel, setRiskLevel] = useState("neutral");
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");
  const [streamingMessageId, setStreamingMessageId] = useState(null);

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
    if (!trimmed || loading) {
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
    setStreamingMessageId(assistantId);
    setMessages((current) => [
      ...current,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        tags: [],
        createdAt: new Date().toISOString(),
      },
    ]);

    try {
      const response = await sendCoachMessageStream({
        message: trimmed,
        sessionId,
        history: historyPayload,
        onDelta: (chunk) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId ? { ...message, content: `${message.content}${chunk}` } : message,
            ),
          );
        },
      });
      setSessionId(response.sessionId);
      setRiskLevel(response.riskLevel);
      setSuggestedActions(response.suggestedActions || []);
      setResources(response.resources || []);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: response.reply, tags: response.tags || [] }
            : message,
        ),
      );
    } catch (sendError) {
      try {
        const response = await sendCoachMessage({
          message: trimmed,
          sessionId,
          history: historyPayload,
        });

        setSessionId(response.sessionId);
        setRiskLevel(response.riskLevel);
        setSuggestedActions(response.suggestedActions || []);
        setResources(response.resources || []);
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: response.reply,
                  tags: response.tags || [],
                }
              : message,
          ),
        );
      } catch (fallbackError) {
        setMessages((current) => current.filter((message) => message.id !== assistantId));
        setError(fallbackError.message || sendError.message || "Unable to reach the wellness coach.");
      }
    } finally {
      setLoading(false);
      setStreamingMessageId(null);
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10 backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Wellness Coach</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Talk it out, one step at a time</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Share what is going on. MindBridge responds with grounded, student friendly support and practical next steps.
        </p>
      </header>

      {riskLevel === "crisis" && resources.length ? (
        <div className="rounded-3xl border border-coral/30 bg-coral/10 p-5 text-sm text-ink">
          <p className="font-semibold text-coral">You deserve immediate support.</p>
          <p className="mt-2 text-ink/70">
            If you are in danger or feel unable to stay safe, reach out to a trusted person or contact a helpline now.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {resources.map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-coral/20 bg-white/80 p-4">
                <p className="text-sm font-semibold text-ink">{resource.title}</p>
                <p className="mt-1 text-xs text-ink/70">{resource.description}</p>
                <p className="mt-2 text-sm text-coral">{resource.phone}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Conversation</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">Safe space chat</h3>
            </div>
            <span className="rounded-full border border-ink/10 bg-foam px-3 py-1 text-xs font-semibold text-ink/70">
              Risk level: {riskLevel}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-md ${
                    message.role === "user"
                      ? "bg-ink text-cream"
                      : "bg-white text-ink border border-ink/10"
                  }`}
                >
                  <p>{message.content || (message.id === streamingMessageId ? "Thinking..." : "")}</p>
                  {message.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-ink/10 bg-foam px-2 py-1 text-[11px] font-semibold text-ink/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ))}
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
              className="flex-1 rounded-full border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-reef/60"
            />
            <button
              type="submit"
              className="rounded-full bg-reef px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-105"
              disabled={loading}
            >
              {loading ? "Thinking..." : "Send"}
            </button>
          </form>
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
                  onClick={() => handleSend(action.message)}
                  className="rounded-2xl border border-ink/10 bg-foam px-4 py-3 text-left text-sm font-semibold text-ink/80 transition hover:border-reef/60"
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
            <div className="mt-4 flex items-center gap-3">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex-1 rounded-2xl border border-ink/10 bg-foam py-4 text-center text-xs font-semibold text-ink/70">
                  {step}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
