import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { forecastStress } from "./services/stressApi";

const types = ["exam", "assignment", "presentation", "project"];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function StressPage() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("exam");
  const [forecast, setForecast] = useState([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadForecast = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const response = await forecastStress(payload);
      setForecast(response.data || []);
      setSummary(response.summary || "");
    } catch (forecastError) {
      setError(forecastError.message || "Unable to load stress forecast.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast({ events: [] });
  }, []);

  const handleAddEvent = () => {
    if (!title || !date) {
      return;
    }
    setEvents((current) => [...current, { title, date, type, weight: 1 }]);
    setTitle("");
    setDate("");
  };

  const handleGenerate = () => {
    loadForecast({ events });
  };

  const forecastSummary = useMemo(() => summary || "Stress forecast ready.", [summary]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Smart Stress Predictor</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Plan around your peaks</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Add upcoming academic milestones and see a two week stress forecast to plan breaks ahead of time.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Upcoming events</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Add your calendar</h3>
          <div className="mt-4 space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Event title"
              className="w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
            />
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
            />
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
            >
              {types.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddEvent}
              className="w-full rounded-full bg-reef px-4 py-2 text-sm font-semibold text-ink"
            >
              Add event
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {events.length ? (
              events.map((event, index) => (
                <div key={`${event.title}-${index}`} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink/70">
                  <p className="font-semibold text-ink">{event.title}</p>
                  <p className="text-xs text-ink/60">
                    {event.type} on {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink/60">Add events to personalize your forecast.</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="mt-5 w-full rounded-full border border-ink/10 bg-ink px-4 py-3 text-sm font-semibold text-cream"
          >
            Generate forecast
          </button>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Next 14 days</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">Stress timeline</h3>
            </div>
            {loading ? <span className="text-xs text-ink/60">Updating...</span> : null}
          </div>
          <p className="mt-2 text-sm text-ink/70">{forecastSummary}</p>
          {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}

          <div className="mt-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(16,18,26,0.08)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "rgba(16,18,26,0.5)", fontSize: 12 }} />
                <YAxis domain={[0, 1]} tick={{ fill: "rgba(16,18,26,0.5)", fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }
                    const point = payload[0].payload;
                    return (
                      <div className="rounded-2xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink">
                        <p>{new Date(label).toLocaleDateString()}</p>
                        <p className="font-semibold">{point.label}</p>
                        <p>Score: {point.score}</p>
                      </div>
                    );
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="#2EC4B6" fill="rgba(46,196,182,0.25)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
