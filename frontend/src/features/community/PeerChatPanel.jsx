import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchPeerThread, fetchPeerThreads, sendPeerMessage } from "./services/peerChatApi";

export function PeerChatPanel() {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const data = await fetchPeerThreads();
      setThreads(data);
      if (data.length) {
        const thread = await fetchPeerThread(data[0].id);
        setActiveThread(thread);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }
    const response = await sendPeerMessage({
      message: message.trim(),
      threadId: activeThread?.id,
      topic: "General",
    });
    setActiveThread(response);
    setMessage("");
    loadThreads();
  };

  return (
    <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Peer chat</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">1:1 anonymous support</h3>
        </div>
        <span className="rounded-full border border-ink/10 bg-foam px-3 py-1 text-xs text-ink/70">
          {loading ? "Loading" : `${threads.length || 0} threads`}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {activeThread?.messages?.slice(-6).map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-xs shadow-md ${
                msg.role === "user" ? "bg-ink text-cream" : "bg-white border border-ink/10 text-ink"
              }`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {!activeThread && !loading ? (
          <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-xs text-ink/60">
            Start a chat and a peer mentor will respond.
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Type a short check-in"
          className="flex-1 rounded-full border border-ink/10 bg-white px-3 py-2 text-xs text-ink"
        />
        <button
          type="button"
          onClick={handleSend}
          className="rounded-full bg-reef px-4 py-2 text-xs font-semibold text-ink"
        >
          Send
        </button>
      </div>
    </div>
  );
}
