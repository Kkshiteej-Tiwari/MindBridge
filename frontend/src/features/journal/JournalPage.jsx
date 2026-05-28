import { motion } from "framer-motion";
import { useJournalFeature } from "./hooks/useJournalFeature";
import { JournalEditor } from "./components/JournalEditor";
import { JournalAnalysisCard } from "./components/JournalAnalysisCard";
import { HistoryChart } from "./components/HistoryChart";

export function JournalPage() {
  const { activeEntry, activeId, createDraft, error, history, loading, saveEntry, saving, selectEntry, entries } =
    useJournalFeature();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(108,99,255,0.25),_transparent_35%),linear-gradient(135deg,_#1A1A2E_0%,_#111827_55%,_#0f172a_100%)] px-4 py-6 text-lavender md:px-8 md:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-md md:p-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-lavender/60">MindBridge AI</p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-5xl">AI Mood Journal</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-lavender/80 md:text-base">
                Write daily reflections, let the AI analyze your mood in real time, and track your emotional trend over time.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={createDraft}
                className="rounded-full bg-teal px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
              >
                New entry
              </button>
              <div className="rounded-full border border-white/10 bg-[#13172d] px-5 py-3 text-sm text-lavender/70">
                {entries.length} journal entry{entries.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          {error ? <p className="mt-4 rounded-2xl border border-crisis/30 bg-crisis/10 px-4 py-3 text-sm text-crisis">{error}</p> : null}
        </motion.header>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="min-h-[520px] rounded-3xl border border-white/10 bg-white/5 p-6" />
            <div className="min-h-[520px] rounded-3xl border border-white/10 bg-white/5 p-6" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <JournalEditor entry={activeEntry} onSave={saveEntry} saving={saving} />
            <JournalAnalysisCard analysis={activeEntry?.analysis} />
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <HistoryChart data={history} />

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-md md:p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-lavender/60">Entry switcher</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Recent drafts</h2>
            <div className="mt-5 space-y-3">
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => selectEntry(entry.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    entry.id === activeId
                      ? "border-teal/60 bg-teal/10"
                      : "border-white/10 bg-[#101427] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{entry.analysis.subject}</p>
                      <p className="mt-1 text-xs text-lavender/60">{new Date(entry.updatedAt).toLocaleString()}</p>
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
      </div>
    </main>
  );
}
