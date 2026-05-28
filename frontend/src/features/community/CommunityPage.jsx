import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createCommunityPost, fetchCommunityFeed, reactToPost } from "./services/communityApi";

const topics = ["All", "Exams", "Relationships", "Loneliness", "Career", "Family", "General"];
const moods = ["calm", "neutral", "stressed", "hopeful"];

export function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [topic, setTopic] = useState("All");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("neutral");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadFeed = async (currentTopic) => {
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
  };

  useEffect(() => {
    loadFeed(topic);
  }, [topic]);

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
        setNotice("Your post is live and ready for support.");
      }
      setContent("");
      loadFeed(topic);
    } catch (postError) {
      setError(postError.message || "Unable to share your post.");
    }
  };

  const handleReaction = async (postId, reaction) => {
    setError("");
    try {
      const updated = await reactToPost(postId, reaction);
      setPosts((current) => current.map((post) => (post.id === updated.id ? updated : post)));
    } catch (reactionError) {
      setError(reactionError.message || "Unable to send support.");
    }
  };

  const visiblePosts = useMemo(() => posts.filter((post) => post.visibility === "public"), [posts]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Anonymous Peer Support</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Community of care</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Share what you are going through, support others with kind reactions, and keep everything anonymous.
        </p>
      </header>

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
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
          >
            {topics.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm text-ink/70">Mood</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {moods.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setMood(label)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  mood === label ? "border-reef bg-reef/10 text-ink" : "border-ink/10 bg-white text-ink/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="mt-4 block text-sm text-ink/70">Your post</label>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write what you want to share with the community"
            className="mt-2 min-h-[160px] w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-reef/60"
          />

          <button
            type="submit"
            className="mt-4 w-full rounded-full bg-reef px-5 py-3 text-sm font-semibold text-ink transition hover:brightness-105"
          >
            Post anonymously
          </button>

          {notice ? <p className="mt-3 text-sm text-ink/70">{notice}</p> : null}
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
                    topic === label ? "border-ink bg-ink text-cream" : "border-ink/10 bg-white text-ink/70"
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
                <div key={item} className="h-40 rounded-3xl border border-ink/10 bg-white" />
              ))}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {visiblePosts.map((post) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-ink/10 bg-white p-4 shadow-lg shadow-ink/10"
                >
                  <div className="flex items-center justify-between text-xs text-ink/60">
                    <span>{post.anonName}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-3 text-sm text-ink/80">{post.content}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-ink/10 bg-foam px-3 py-1 text-xs text-ink/70">
                      {post.topic}
                    </span>
                    <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs text-ink/60">
                      {post.mood}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    {["heart", "hug", "strength"].map((reaction) => (
                      <button
                        key={reaction}
                        type="button"
                        onClick={() => handleReaction(post.id, reaction)}
                        className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink/70"
                      >
                        {reaction} {post.reactions[reaction] || 0}
                      </button>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
