import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { WellnessOrb } from "./components/WellnessOrb";
import { fetchDashboardSnapshot } from "./services/dashboardApi";
import { HistoryChart } from "../journal/components/HistoryChart";

const orbitCards = [
  { to: "/", label: "Journal", icon: "", color: "bg-reef/10 border-reef/30 text-reef" },
  { to: "/coach", label: "Coach", icon: "", color: "bg-violet/10 border-violet/30 text-violet" },
  { to: "/community", label: "Community", icon: "", color: "bg-sky/10 border-sky/30 text-sky" },
  { to: "/challenges", label: "Challenges", icon: "", color: "bg-gold/10 border-gold/30 text-gold" },
];

const dailyPrompts = [
  "What is one thing you want to protect in your schedule this week?",
  "Name one moment today that brought you a small sense of peace.",
  "What would make tomorrow 1% better than today?",
  "Who is one person you could reach out to this week?",
  "What is something you did well today that you can be proud of?",
];

export function DashboardPage() {
  const [history, setHistory] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const snapshot = await fetchDashboardSnapshot();
        setHistory(snapshot.history || []);
        setProgress(snapshot.progress || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const wellnessScore = useMemo(() => {
    if (!history.length) {
      return 0.5;
    }
    const last = history.slice(-7);
    const avg = last.reduce((sum, item) => sum + (item.sentimentScore || 0), 0) / last.length;
    const normalized = Math.min(1, Math.max(0, (avg + 10) / 20));
    return normalized;
  }, [history]);

  const scorePercent = Math.round(wellnessScore * 100);
  const scoreLabel = scorePercent >= 70 ? "Thriving" : scorePercent >= 40 ? "Steady" : "Needs care";
  const dailyPrompt = dailyPrompts[new Date().getDay() % dailyPrompts.length];

  return (
    <section className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Wellness Universe</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Your MindBridge dashboard</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Your mood, streaks, and support tools in one place.
        </p>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Wellness orb</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">Current balance</h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: scorePercent >= 70 ? "#2EC4B6" : scorePercent >= 40 ? "#F7B731" : "#FF7A6A",
                }}
              />
              <span className="rounded-full border border-ink/10 bg-foam px-3 py-1 text-xs font-semibold text-ink/70">
                {scorePercent}% — {scoreLabel}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <WellnessOrb score={wellnessScore} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink/70">
            {orbitCards.map((card, i) => (
              <Link
                key={card.to}
                to={card.to}
                className={`orbit-card rounded-2xl border px-4 py-3 text-center font-semibold transition hover:shadow-lg ${card.color}`}
                style={{ animationDelay: `${i * 0.4}s` }}
              >
                <span className="mr-1">{card.icon}</span> {card.label}
              </Link>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Weekly wave</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Mood trend</h3>
          <div className="mt-4">
            {loading ? (
              <div className="h-[260px] rounded-3xl skeleton-shimmer" />
            ) : (
              <HistoryChart data={history} />
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Streak</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Wellness momentum</h3>
          {progress ? (
            <div className="mt-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-foam px-4 py-2">
                <span className="text-sm font-semibold text-ink">{progress.streak} day streak</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-reef/10 px-4 py-2">
                <span className="text-sm font-semibold text-reef">{progress.xp} XP</span>
              </div>
            </div>
              {progress.badges?.length ? (
                <div className="flex flex-wrap gap-2">
                  {progress.badges.map((badge) => (
                    <span
                      key={badge}
                      className="badge-earned rounded-full border border-reef/30 bg-reef/10 px-3 py-1 text-xs font-semibold text-reef"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/60">Keep showing up. Your streak starts today.</p>
          )}
          <div className="mt-4 rounded-2xl border border-ink/10 bg-foam px-4 py-3 text-sm text-ink/70">
            Tip: Schedule one calming routine before your next busy day.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Daily prompt</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Reflection cue</h3>
          <p className="mt-3 text-sm text-ink/70 leading-6">
            {dailyPrompt}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/" className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-cream transition hover:brightness-110">
              Journal now
            </Link>
            <Link to="/coach" className="rounded-full border border-ink/10 bg-white px-5 py-2.5 text-xs font-semibold text-ink/70 transition hover:bg-foam">
              Talk to coach
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
