import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { completeChallenge, fetchDailyChallenges } from "./services/challengesApi";

export function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadChallenges = async () => {
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
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleComplete = async (challengeId) => {
    setError("");
    try {
      const response = await completeChallenge(challengeId);
      setChallenges(response.data || []);
      setProgress(response.progress || null);
    } catch (completeError) {
      setError(completeError.message || "Unable to complete challenge.");
    }
  };

  const xpProgress = useMemo(() => {
    if (!progress) {
      return 0;
    }
    return progress.xp % 100;
  }, [progress]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Gamified Wellness</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Daily challenges</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Complete gentle tasks, build streaks, and collect badges for your well-being journey.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Your progress</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Streak and XP</h3>
          {progress ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-ink/10 bg-foam px-4 py-3 text-sm text-ink/70">
                <span className="font-semibold text-ink">{progress.streak}</span> day streak
              </div>
              <div>
                <div className="flex items-center justify-between text-sm text-ink/70">
                  <span>Level {progress.level}</span>
                  <span>{progress.xp} XP</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-ink/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-3 rounded-full bg-reef"
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Badges</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {progress.badges.length ? (
                    progress.badges.map((badge) => (
                      <span key={badge} className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs text-ink/70">
                        {badge}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-ink/60">Complete streaks to unlock badges.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/60">Loading progress...</p>
          )}
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Today</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">Daily quests</h3>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-3xl border border-ink/10 bg-white" />
              ))}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {challenges.map((challenge) => (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-ink/10 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-ink">{challenge.title}</p>
                      <p className="mt-1 text-xs text-ink/60">{challenge.description}</p>
                      <span className="mt-3 inline-flex rounded-full border border-ink/10 bg-foam px-3 py-1 text-xs text-ink/70">
                        {challenge.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleComplete(challenge.id)}
                      disabled={challenge.completed}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        challenge.completed
                          ? "border border-ink/10 bg-ink/10 text-ink/50"
                          : "bg-reef text-ink hover:brightness-105"
                      }`}
                    >
                      {challenge.completed ? "Completed" : `Earn ${challenge.xp} XP`}
                    </button>
                  </div>
                </motion.div>
              ))}
              {error ? <p className="text-sm text-coral">{error}</p> : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
