import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import WellnessOrb from "../dashboard/WellnessOrb";
import { useJournalFeature } from "./hooks/useJournalFeature";
import { JournalEditor } from "./components/JournalEditor";
import { JournalAnalysisCard } from "./components/JournalAnalysisCard";
import { HistoryChart } from "./components/HistoryChart";

export function JournalPage({ voiceMode = false }) {
  const { activeEntry, activeId, createDraft, error, history, loading, saveEntry, saving, selectEntry, entries } =
    useJournalFeature();
  const [microActions, setMicroActions] = useState([]);

  const handleMicroAction = (label) => {
    setMicroActions((c) => [label, ...c].slice(0, 5));
  };
  const editorAnchorRef = useRef(null);

  useEffect(() => {
    if (voiceMode && editorAnchorRef.current) {
      editorAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [voiceMode]);

  return (
    <section className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10 backdrop-blur-md md:p-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="md:flex md:items-center md:gap-6">
            <div className="hidden md:block">
              <WellnessOrb />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-ink/50">MindBridge</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-ink md:text-5xl">Your Mood Journal</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70 md:text-base">
                Write daily reflections, let the journal reflect on your mood in real time, and track emotional trends over time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-ink/10 bg-white/80 px-5 py-3 text-sm text-ink/70">
              {entries.length} journal entry{entries.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p> : null}
      </motion.header>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="min-h-[520px] rounded-3xl border border-ink/10 bg-white/70 p-6" />
          <div className="min-h-[520px] rounded-3xl border border-ink/10 bg-white/70 p-6" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div ref={editorAnchorRef}>
            <JournalEditor entry={activeEntry} onSave={saveEntry} saving={saving} onRegisterEntry={createDraft} />
          </div>
          <JournalAnalysisCard analysis={activeEntry?.analysis} />
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6 -mt-40">
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Quick actions</p>
            <h4 className="mt-2 font-display text-lg font-semibold text-ink">Micro-actions</h4>
            <p className="mt-2 text-sm text-ink/70">Small, 1–5 minute activities that can help shift your mood.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => handleMicroAction('2‑min breathing')} className="rounded-full border border-ink/10 bg-foam px-3 py-2 text-sm font-semibold text-ink">2‑min breathing</button>
              <button type="button" onClick={() => handleMicroAction('Short stretch')} className="rounded-full border border-ink/10 bg-foam px-3 py-2 text-sm font-semibold text-ink">Short stretch</button>
              <button type="button" onClick={() => handleMicroAction('Drink water')} className="rounded-full border border-ink/10 bg-foam px-3 py-2 text-sm font-semibold text-ink">Drink water</button>
            </div>
            {microActions.length ? (
              <ul className="mt-3 space-y-2 text-sm text-ink/70">
                {microActions.map((m, i) => (
                  <li key={`${m}-${i}`} className="rounded-2xl border border-ink/10 bg-foam px-3 py-2">{m}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink/60">No actions yet — try a quick exercise above.</p>
            )}
          </div>

          <HistoryChart data={history} />
        </div>

        <aside className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10 backdrop-blur-md md:p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Entry switcher</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink">Recent drafts</h3>
          <div className="mt-5 max-h-64 overflow-auto space-y-3 pr-2">
            {entries.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => selectEntry(entry.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  entry.id === activeId
                    ? "border-reef/60 bg-reef/10"
                    : "border-ink/10 bg-white/80 hover:border-ink/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{entry.analysis.subject}</p>
                    <p className="mt-1 text-xs text-ink/60">{new Date(entry.updatedAt).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: entry.analysis.color, color: "#0b1020" }}>
                    {entry.analysis.mood}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
