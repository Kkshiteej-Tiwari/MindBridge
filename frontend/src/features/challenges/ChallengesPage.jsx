import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { completeChallenge, fetchDailyChallenges } from "./services/challengesApi";
import { StreakHeatmap } from "./components/StreakHeatmap";

const challengeIcons = {
  journal: "J",
  breathing: "B",
  gratitude: "G",
  movement: "M",
};

function ConfettiBurst({ show }) {
  if (!show) return null;

  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: -(Math.random() * 200 + 50),
    rotation: Math.random() * 720,
    color: ["#2EC4B6", "#FF7A6A", "#F7B731", "#6C63FF", "#A7C7FF", "#00D4AA"][i % 6],
    size: 6 + Math.random() * 6,
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotation, opacity: 0 }}
          transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: p.size > 9 ? "50%" : "2px",
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

export function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedId, setCompletedId] = useState(null);

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchDailyChallenges();
      setChallenges(response.data || []);
      setProgress(response.progress || null);
    } catch (loadError) {
      setError(loadError.message || "Unable to load challenges.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const handleComplete = async (challengeId) => {
    setError("");
    try {
      const response = await completeChallenge(challengeId);
      setChallenges(response.data || []);
      setProgress(response.progress || null);
      setCompletedId(challengeId);

      // Trigger confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setTimeout(() => setCompletedId(null), 1500);
    } catch (completeError) {
      setError(completeError.message || "Unable to complete challenge.");
    }
  };

  const xpProgress = useMemo(() => {
    if (!progress) return 0;
    return progress.xp % 100;
  }, [progress]);

  const completedCount = challenges.filter((c) => c.completed).length;
  const totalCount = challenges.length;

  return (
    <section className="space-y-6">
      <ConfettiBurst show={showConfetti} />

      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Gamified Wellness</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Daily challenges</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Complete gentle tasks, build streaks, and collect badges for your well-being journey.
        </p>

        {/* Global XP bar */}
        {progress ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-ink/60">
              <span>Level {progress.level} — {completedCount}/{totalCount} today</span>
              <span className="font-semibold text-reef">{progress.xp} XP</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-ink/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #2EC4B6, #00D4AA)",
                }}
              />
            </div>
          </div>
        ) : null}
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Your progress</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Streak and XP</h3>
          {progress ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-foam px-4 py-2.5">
                  <span className="text-sm font-bold text-ink">{progress.streak}</span>
                  <span className="text-xs text-ink/60">day streak</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-reef/30 bg-reef/10 px-4 py-2.5">
                  <span className="text-sm font-bold text-reef">Lv.{progress.level}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-ink">Badges</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {progress.badges.length ? (
                    progress.badges.map((badge) => (
                      <span
                        key={badge}
                        className="badge-earned rounded-full border border-reef/30 bg-reef/10 px-3 py-1.5 text-xs font-semibold text-reef"
                      >
                        {badge}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-ink/60">Complete streaks to unlock badges.</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-ink">Streak heatmap</p>
                <div className="mt-2 rounded-2xl border border-ink/10 bg-white p-3">
                  <StreakHeatmap streak={progress.streak} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="skeleton-shimmer h-10 w-40 rounded-full" />
              <div className="skeleton-shimmer h-24 rounded-2xl" />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Today</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">Daily quests</h3>
            </div>
            {totalCount > 0 && (
              <span className="rounded-full border border-ink/10 bg-foam px-3 py-1 text-xs font-semibold text-ink/70">
                {completedCount}/{totalCount} done
              </span>
            )}
          </div>

          {loading ? (
            <div className="mt-5 space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-20 rounded-3xl skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <AnimatePresence>
                {challenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`rounded-3xl border p-4 transition ${
                      challenge.completed
                        ? "border-reef/30 bg-reef/5"
                        : completedId === challenge.id
                        ? "border-gold/40 bg-gold/10 ring-2 ring-gold/20"
                        : "border-ink/10 bg-white hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-xl">
                          {challengeIcons[challenge.category] || ""}
                        </span>
                        <div>
                          <p className={`text-sm font-semibold ${challenge.completed ? "text-reef line-through" : "text-ink"}`}>
                            {challenge.title}
                          </p>
                          <p className="mt-1 text-xs text-ink/60">{challenge.description}</p>
                          <span className="mt-2 inline-flex rounded-full border border-ink/10 bg-foam px-2.5 py-0.5 text-[10px] font-semibold text-ink/60">
                            {challenge.category}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleComplete(challenge.id)}
                        disabled={challenge.completed}
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                          challenge.completed
                            ? "border border-reef/30 bg-reef/10 text-reef"
                            : "bg-reef text-ink hover:brightness-105 hover:shadow-lg hover:shadow-reef/20"
                        }`}
                      >
                        {challenge.completed ? "✓ Done" : `+${challenge.xp} XP`}
                      </button>
                    </div>

                    {/* Progress bar for the challenge */}
                    {!challenge.completed && (
                      <div className="mt-3 h-1.5 rounded-full bg-ink/5 overflow-hidden">
                        <div className="h-full w-0 rounded-full bg-reef/40" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {error ? <p className="text-sm text-coral">{error}</p> : null}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
