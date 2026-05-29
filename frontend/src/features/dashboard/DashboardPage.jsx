import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { WellnessOrb } from "./components/WellnessOrb";
import { fetchDashboardSnapshot } from "./services/dashboardApi";
import { HistoryChart } from "../journal/components/HistoryChart";

const orbitCards = [
  { to: "/", label: "Journal" },
  { to: "/coach", label: "Coach" },
  { to: "/community", label: "Community" },
  { to: "/challenges", label: "Challenges" },
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

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Wellness Universe</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Your MindBridge dashboard</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Your mood, streaks, and support tools in one place.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Wellness orb</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">Current balance</h3>
            </div>
            <span className="rounded-full border border-ink/10 bg-foam px-3 py-1 text-xs font-semibold text-ink/70">
              Score: {Math.round(wellnessScore * 100)}%
            </span>
          </div>
          <div className="mt-4">
            <WellnessOrb score={wellnessScore} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-ink/70">
            {orbitCards.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-center font-semibold text-ink/70 transition hover:border-reef/60"
              >
                {card.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Weekly wave</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Mood trend</h3>
          <div className="mt-4">
            {loading ? (
              <div className="h-[260px] rounded-3xl border border-ink/10 bg-white" />
            ) : (
              <HistoryChart data={history} />
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Streak</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Wellness momentum</h3>
          <p className="mt-3 text-sm text-ink/70">
            {progress ? `${progress.streak} day streak and ${progress.xp} XP earned.` : "Keep showing up."}
          </p>
          <div className="mt-4 rounded-3xl border border-ink/10 bg-foam px-4 py-4 text-sm text-ink/70">
            Tip: Schedule one calming routine before your next busy day.
          </div>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Daily prompt</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Reflection cue</h3>
          <p className="mt-3 text-sm text-ink/70">
            What is one thing you want to protect in your schedule this week?
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/" className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream">
              Journal now
            </Link>
            <Link to="/coach" className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-ink/70">
              Talk to coach
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
