import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createCommunityPost, fetchCommunityFeed, reactToPost } from "./services/communityApi";
import { PeerChatPanel } from "./PeerChatPanel";

const topics = ["All", "Exams", "Relationships", "Loneliness", "Career", "Family", "General"];
const moods = [
  { id: "calm", label: "😌 Calm", color: "border-teal-300 bg-teal-50" },
  { id: "neutral", label: "😐 Neutral", color: "border-ink/10 bg-foam" },
  { id: "stressed", label: "😰 Stressed", color: "border-coral/30 bg-coral/10" },
  { id: "hopeful", label: "🌟 Hopeful", color: "border-gold/30 bg-gold/10" },
];

const reactionIcons = {
  heart: "❤️",
  hug: "🤗",
  strength: "💪",
};

export function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [topic, setTopic] = useState("All");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("neutral");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [floatingReactions, setFloatingReactions] = useState([]);
  const observerRef = useRef(null);

  const loadFeed = useCallback(async (currentTopic) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCommunityFeed(currentTopic);
      setPosts(data);
    } catch (feedError) {
      setError(feedError.message || "Unable to load community feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(topic);
  }, [topic, loadFeed]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    setNotice("");
    setError("");

    try {
      const postTopic = topic === "All" ? "General" : topic;
      const post = await createCommunityPost({ content: trimmed, topic: postTopic, mood });
      if (post.flagged) {
        setNotice("Thanks for sharing. Your post is being reviewed for safety.");
      } else {
        setNotice("Your post is live and ready for support. 💚");
      }
      setContent("");
      loadFeed(topic);
    } catch (postError) {
      setError(postError.message || "Unable to share your post.");
    }
  };

  const handleReaction = async (postId, reaction) => {
    setError("");
    
    // Add floating reaction animation
    const id = `${postId}-${reaction}-${Date.now()}`;
    setFloatingReactions((prev) => [...prev, { id, postId, icon: reactionIcons[reaction] }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 900);

    try {
      const updated = await reactToPost(postId, reaction);
      setPosts((current) => current.map((post) => (post.id === updated.id ? updated : post)));
    } catch (reactionError) {
      setError(reactionError.message || "Unable to send support.");
    }
  };

  const visiblePosts = useMemo(() => posts.filter((post) => post.visibility === "public"), [posts]);

  const getPostGlow = (post) => {
    const totalReactions = Object.values(post.reactions || {}).reduce((sum, v) => sum + v, 0);
    if (totalReactions >= 5) return "gold-glow border-gold/30";
    return "border-ink/10";
  };

  return (
    <section className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Anonymous Peer Support</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Community of care</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Share what you are going through, support others with kind reactions, and keep everything anonymous. 💚
        </p>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Share your story</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Anonymous post</h3>

          <label className="mt-4 block text-sm text-ink/70">Topic</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {topics.filter((t) => t !== "All").map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTopic(label)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  topic === label ? "border-ink bg-ink text-cream" : "border-ink/10 bg-white text-ink/70 hover:bg-foam"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm text-ink/70">How are you feeling?</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {moods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  mood === m.id ? m.color + " ring-2 ring-reef/30" : "border-ink/10 bg-white text-ink/70"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm text-ink/70">Your post</label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write what you want to share with the community..."
            className="mt-2 min-h-[160px] w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-reef/60 focus:shadow-lg focus:shadow-reef/10"
          />

          <button
            type="submit"
            disabled={!content.trim()}
            className="mt-4 w-full rounded-full bg-reef px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-105 disabled:opacity-50"
          >
            Post anonymously
          </button>

          {notice ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm text-ink/70">
              {notice}
            </motion.p>
          ) : null}
          {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
        </motion.form>

        <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Support wall</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">Stories from peers</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {topics.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTopic(label)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    topic === label ? "border-ink bg-ink text-cream" : "border-ink/10 bg-white text-ink/70 hover:bg-foam"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-40 rounded-3xl skeleton-shimmer" />
              ))}
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-4xl">💬</p>
              <p className="mt-3 text-sm text-ink/50">No posts yet. Be the first to share your story.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {visiblePosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative rounded-3xl border bg-white p-4 shadow-lg shadow-ink/10 transition hover:shadow-xl ${getPostGlow(post)}`}
                >
                  <div className="flex items-center justify-between text-xs text-ink/60">
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, hsl(${(post.anonName || "").charCodeAt(0) * 7 % 360}, 60%, 65%), hsl(${(post.anonName || "").charCodeAt(1) * 11 % 360}, 50%, 55%))`,
                        }}
                      >
                        {(post.anonName || "A").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold">{post.anonName}</span>
                    </div>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-3 text-sm text-ink/80 leading-6">{post.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-ink/10 bg-foam px-3 py-0.5 text-[10px] font-semibold text-ink/60">
                      {post.topic}
                    </span>
                    <span className="rounded-full border border-ink/10 bg-white px-3 py-0.5 text-[10px] text-ink/50">
                      {post.mood}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {["heart", "hug", "strength"].map((reaction) => (
                      <button
                        key={reaction}
                        type="button"
                        onClick={() => handleReaction(post.id, reaction)}
                        className="relative rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-reef/40 hover:bg-reef/5"
                      >
                        {reactionIcons[reaction]} {post.reactions[reaction] || 0}
                      </button>
                    ))}
                  </div>

                  {/* Floating reaction animations */}
                  <AnimatePresence>
                    {floatingReactions
                      .filter((r) => r.postId === post.id)
                      .map((r) => (
                        <motion.span
                          key={r.id}
                          initial={{ opacity: 1, y: 0, scale: 1 }}
                          animate={{ opacity: 0, y: -40, scale: 1.4 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="pointer-events-none absolute bottom-8 left-1/2 text-2xl"
                        >
                          {r.icon}
                        </motion.span>
                      ))}
                  </AnimatePresence>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>

      <PeerChatPanel />
    </section>
  );
}
