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
import { forecastStress, importCalendarFeed } from "./services/stressApi";

const types = ["exam", "assignment", "presentation", "project"];
const CALENDAR_STORAGE_KEY = "mb_stress_calendar_url";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function StressPage() {
  const [events, setEvents] = useState([]);
  const [syncedEvents, setSyncedEvents] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("exam");
  const [calendarUrl, setCalendarUrl] = useState("");
  const [activeCalendarUrl, setActiveCalendarUrl] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const [forecast, setForecast] = useState([]);
  const [summary, setSummary] = useState("");
  const [peaks, setPeaks] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    try {
      const savedCalendarUrl = localStorage.getItem(CALENDAR_STORAGE_KEY);
      if (savedCalendarUrl) {
        setCalendarUrl(savedCalendarUrl);
        setActiveCalendarUrl(savedCalendarUrl);
        void syncCalendarFeed(savedCalendarUrl);
      }
    } catch (storageError) {
      // ignore storage failures
    }
  }, []);

  const loadForecast = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const response = await forecastStress(payload);
      setForecast(response.data || []);
      setSummary(response.summary || "");
      setPeaks(response.peaks || []);
      setCheckIns(response.check_ins || []);
    } catch (forecastError) {
      setError(forecastError.message || "Unable to load stress forecast.");
    } finally {
      setLoading(false);
    }
  };

  const mergedEvents = useMemo(() => {
    const seen = new Map();
    [...events, ...syncedEvents].forEach((event) => {
      const key = `${event.title}|${event.date}|${event.type}`;
      if (!seen.has(key)) {
        seen.set(key, event);
      }
    });

    return Array.from(seen.values()).sort((left, right) => new Date(left.date) - new Date(right.date));
  }, [events, syncedEvents]);

  useEffect(() => {
    loadForecast({ events: mergedEvents });
  }, [mergedEvents]);

  const handleAddEvent = () => {
    if (!title || !date) {
      return;
    }
    setEvents((current) => [...current, { title, date, type, weight: 1 }]);
    setTitle("");
    setDate("");
  };

  const handleGenerate = () => {
    loadForecast({ events: mergedEvents });
  };

  const syncCalendarFeed = async (calendarFeedUrl) => {
    const trimmedUrl = calendarFeedUrl.trim();
    if (!trimmedUrl) {
      setSyncError("Paste a public .ics calendar URL to sync.");
      return;
    }

    setSyncing(true);
    setSyncError("");
    try {
      const response = await importCalendarFeed(trimmedUrl);
      setSyncedEvents(response.data || []);
      setLastSyncedAt(response.imported_at || new Date().toISOString());
      setActiveCalendarUrl(trimmedUrl);
      try {
        localStorage.setItem(CALENDAR_STORAGE_KEY, trimmedUrl);
      } catch (storageError) {
        // ignore storage failures
      }
    } catch (syncingError) {
      setSyncError(syncingError.message || "Unable to sync calendar.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!activeCalendarUrl) {
      return undefined;
    }

    const refreshTimer = window.setInterval(() => {
      void syncCalendarFeed(activeCalendarUrl);
    }, 30 * 60 * 1000);

    return () => window.clearInterval(refreshTimer);
  }, [activeCalendarUrl]);

  const handleSyncCalendar = () => {
    void syncCalendarFeed(calendarUrl);
  };

  const handleClearCalendar = () => {
    setCalendarUrl("");
    setSyncedEvents([]);
    setActiveCalendarUrl("");
    setLastSyncedAt("");
    setSyncError("");
    try {
      localStorage.removeItem(CALENDAR_STORAGE_KEY);
    } catch (storageError) {
      // ignore storage failures
    }
  };

  const forecastSummary = useMemo(() => summary || "Stress forecast ready.", [summary]);
  const nextCheckIn = checkIns[0] || null;

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Smart Stress Predictor</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Plan around your peaks</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Add upcoming academic milestones and sync a public calendar feed to see a two week stress forecast ahead of time.
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

          <div className="mt-6 rounded-3xl border border-ink/10 bg-foam/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Calendar sync</p>
            <h4 className="mt-2 font-display text-lg font-semibold text-ink">Automatic academic calendar import</h4>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Paste a public Google Calendar <span className="font-semibold">.ics export URL</span> or school feed URL.
              MindBridge will import future events and keep your forecast updated.
            </p>
            <input
              value={calendarUrl}
              onChange={(event) => setCalendarUrl(event.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/.../public/basic.ics"
              className="mt-3 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-reef/60"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSyncCalendar}
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream"
                disabled={syncing}
              >
                {syncing ? "Syncing..." : "Sync calendar"}
              </button>
              <button
                type="button"
                onClick={handleClearCalendar}
                className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/70"
              >
                Clear sync
              </button>
            </div>
            {syncError ? <p className="mt-3 text-sm text-coral">{syncError}</p> : null}
            {lastSyncedAt ? <p className="mt-2 text-xs text-ink/60">Last synced {new Date(lastSyncedAt).toLocaleString()}</p> : null}
            <p className="mt-2 text-xs text-ink/60">Synced events: {syncedEvents.length}</p>
          </div>

          <div className="mt-5 space-y-3">
            {mergedEvents.length ? (
              mergedEvents.map((event, index) => (
                <div key={`${event.title}-${index}`} className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink/70">
                  <p className="font-semibold text-ink">{event.title}</p>
                  <p className="text-xs text-ink/60">
                    {event.type} on {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink/60">Add events or sync a calendar to personalize your forecast.</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="mt-5 w-full rounded-full border border-ink/10 bg-ink px-4 py-3 text-sm font-semibold text-cream"
          >
            Generate forecast
          </button>

          {nextCheckIn ? (
            <div className="mt-5 rounded-2xl border border-reef/30 bg-reef/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Proactive check-in</p>
              <h4 className="mt-2 font-display text-lg font-semibold text-ink">{nextCheckIn.title}</h4>
              <p className="mt-2 text-sm leading-6 text-ink/70">{nextCheckIn.message}</p>
              <p className="mt-3 text-sm font-semibold text-ink">Try: {nextCheckIn.action}</p>
            </div>
          ) : null}
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

          {peaks.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {peaks.slice(0, 3).map((peak) => (
                <span
                  key={`${peak.date}-${peak.label}`}
                  className="rounded-full border border-coral/20 bg-coral/10 px-3 py-1 text-xs font-semibold text-coral"
                >
                  {new Date(peak.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}: {peak.label}
                </span>
              ))}
            </div>
          ) : null}

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

          {checkIns.length ? (
            <div className="mt-5 rounded-2xl border border-ink/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Check-ins</p>
              <div className="mt-3 space-y-3">
                {checkIns.slice(0, 3).map((checkIn) => (
                  <div key={`${checkIn.date}-${checkIn.title}`} className="rounded-2xl border border-ink/10 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{checkIn.title}</p>
                      <span className="rounded-full bg-ink/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">
                        {checkIn.priority}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink/70">{checkIn.message}</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{checkIn.action}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
