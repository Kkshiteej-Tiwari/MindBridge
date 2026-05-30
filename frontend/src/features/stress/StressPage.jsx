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
  const [checkIns, setCheckIns] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sampleFestivals = [
    { id: "fest-1", title: "Summer Solstice Fair", date: "2026-06-21", desc: "Outdoor music & crafts — perfect for a mindful walk." },
    { id: "fest-2", title: "City Lantern Night", date: "2026-07-04", desc: "Evening lights and gentle community stalls." },
    { id: "fest-3", title: "Harvest & Wellness Market", date: "2026-09-12", desc: "Local foods, slow-breathing sessions, and mini workshops." },
  ];

  const addFestivalToEvents = (fest) => {
    setEvents((current) => [...current, { title: fest.title, date: fest.date, type: "festival", weight: 1 }]);
  };

  const loadForecast = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const response = await forecastStress(payload);
      setForecast(response.data || []);
      setSummary(response.summary || "");
      setCheckIns(response.check_ins || response.checkIns || []);
      setRecommendations(response.recommendations || []);
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

          <div className="mt-6 rounded-3xl border border-ink/10 bg-white px-4 py-4 text-sm text-ink/70">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Upcoming festivals</p>
            <h4 className="mt-2 font-display text-lg font-semibold text-ink">Local highlights</h4>
            <p className="mt-2 text-sm text-ink/70">A few nearby events you might enjoy — tap to add to your calendar.</p>
            <ul className="mt-3 space-y-3">
              {sampleFestivals.map((fest) => (
                <li key={fest.id} className="flex items-start justify-between gap-3 rounded-2xl border border-ink/10 bg-foam p-3">
                  <div>
                    <p className="font-semibold text-ink">{fest.title}</p>
                    <p className="text-xs text-ink/60">{new Date(fest.date).toLocaleDateString()} · {fest.desc}</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => addFestivalToEvents(fest)}
                      className="rounded-full bg-reef px-3 py-1 text-sm font-semibold text-cream"
                    >
                      Add
                    </button>
                  </div>
                </li>
              ))}
            </ul>
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

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-ink/10 bg-white px-4 py-4 text-sm text-ink/70">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Check-ins</p>
              <ul className="mt-3 space-y-2">
                {checkIns.length ? (
                  checkIns.map((item) => (
                    <li key={item} className="rounded-2xl border border-ink/10 bg-foam px-3 py-2">
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-ink/60">No high-stress check-ins yet.</li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-ink/10 bg-white px-4 py-4 text-sm text-ink/70">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Recommendations</p>
              <ul className="mt-3 space-y-2">
                {recommendations.length ? (
                  recommendations.map((item) => (
                    <li key={item} className="rounded-2xl border border-ink/10 bg-foam px-3 py-2">
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-ink/60">Keep your routine light and steady.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
