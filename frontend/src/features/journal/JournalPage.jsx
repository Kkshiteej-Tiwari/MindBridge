import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import WellnessOrb from "../dashboard/WellnessOrb";
import { useJournalFeature } from "./hooks/useJournalFeature";
import { JournalEditor } from "./components/JournalEditor";
import { JournalAnalysisCard } from "./components/JournalAnalysisCard";
import { HistoryChart } from "./components/HistoryChart";

export function JournalPage({ voiceMode = false }) {
  const {
    activeEntry,
    activeId,
    createDraft,
    error,
    history,
    loading,
    saveEntry,
    saving,
    selectEntry,
    removeEntry,
    entries,
  } = useJournalFeature();

  const [microActions, setMicroActions] = useState([]);
  const [editContent, setEditContent] = useState(null); // null = view mode, string = edit mode
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const editorAnchorRef = useRef(null);

  const handleMicroAction = (label) => {
    setMicroActions((c) => [label, ...c].slice(0, 5));
  };

  useEffect(() => {
    if (voiceMode && editorAnchorRef.current) {
      editorAnchorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [voiceMode]);

  // Reset edit content when active entry changes
  useEffect(() => {
    setEditContent(null);
    setSubmitSuccess(false);
  }, [activeId]);

  const handleSubmitJournal = async () => {
    if (!activeEntry) return;
    const content = editContent !== null ? editContent : activeEntry.content;
    await saveEntry(activeEntry.id, content);
    setEditContent(null);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 2500);
  };

  const handleDeleteEntry = async (entryId) => {
    if (deleteConfirmId === entryId) {
      await removeEntry(entryId);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(entryId);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const handleNewJournal = async () => {
    setEditContent(null);
    await createDraft();
  };

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
            <button
              type="button"
              onClick={handleNewJournal}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-reef px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105 disabled:opacity-50"
            >
              <span>＋</span> New Journal
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p> : null}
      </motion.header>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="min-h-[520px] rounded-3xl border border-ink/10 bg-white/70 p-6 animate-pulse" />
          <div className="min-h-[520px] rounded-3xl border border-ink/10 bg-white/70 p-6 animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div ref={editorAnchorRef} className="flex flex-col gap-4">
            {/* Action buttons toolbar */}
            {activeEntry && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 shadow-md">
                <span className="text-sm font-semibold text-ink/60">Entry actions:</span>

                {editContent === null ? (
                  <button
                    type="button"
                    onClick={() => setEditContent(activeEntry.content)}
                    className="flex items-center gap-1.5 rounded-full border border-ink/20 bg-foam px-4 py-2 text-sm font-semibold text-ink transition hover:border-reef/50 hover:bg-reef/10"
                  >
                    ✏️ Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditContent(null)}
                    className="flex items-center gap-1.5 rounded-full border border-ink/20 bg-foam px-4 py-2 text-sm font-semibold text-ink/60 transition hover:border-ink/30"
                  >
                    ✖ Cancel Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSubmitJournal}
                  disabled={saving}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${
                    submitSuccess ? "bg-green-500" : "bg-reef hover:brightness-105"
                  }`}
                >
                  {saving ? "Saving…" : submitSuccess ? "✓ Saved!" : "💾 Submit Journal"}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteEntry(activeEntry.id)}
                  disabled={saving}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                    deleteConfirmId === activeEntry.id
                      ? "border-coral/60 bg-coral/20 text-coral"
                      : "border-coral/30 bg-coral/10 text-coral hover:bg-coral/20"
                  }`}
                >
                  🗑️ {deleteConfirmId === activeEntry.id ? "Confirm Delete?" : "Delete"}
                </button>
              </div>
            )}

            {editContent !== null ? (
              /* Inline edit textarea when Edit is active */
              <div className="rounded-3xl border border-reef/40 bg-white/80 p-5 shadow-xl shadow-ink/10 backdrop-blur-md md:p-6">
                <p className="mb-3 text-xs uppercase tracking-[0.3em] text-reef">Editing entry</p>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[320px] w-full rounded-2xl border border-reef/30 bg-foam p-4 text-lg leading-8 text-ink outline-none placeholder:text-ink/30 focus:border-reef/60"
                  placeholder="Edit your journal entry…"
                />
                <div className="mt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditContent(null)}
                    className="rounded-full border border-ink/20 px-5 py-2 text-sm font-semibold text-ink/60 hover:bg-foam"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitJournal}
                    disabled={saving}
                    className="rounded-full bg-reef px-5 py-2 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "💾 Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <JournalEditor entry={activeEntry} onSave={saveEntry} saving={saving} onRegisterEntry={createDraft} />
            )}
          </div>
          <JournalAnalysisCard analysis={activeEntry?.analysis} />
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Entry switcher</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">Recent drafts</h3>
            </div>
            <button
              type="button"
              onClick={handleNewJournal}
              disabled={saving}
              className="flex items-center gap-1 rounded-full bg-reef/10 border border-reef/30 px-4 py-2 text-sm font-semibold text-reef transition hover:bg-reef/20 disabled:opacity-50"
            >
              ＋ New
            </button>
          </div>
          <div className="mt-5 max-h-64 overflow-auto space-y-3 pr-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`group w-full rounded-2xl border transition ${
                  entry.id === activeId
                    ? "border-reef/60 bg-reef/10"
                    : "border-ink/10 bg-white/80 hover:border-ink/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectEntry(entry.id)}
                  className="w-full px-4 py-3 text-left"
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
                <div className="flex gap-1 border-t border-ink/5 px-4 py-2">
                  <button
                    type="button"
                    onClick={() => { selectEntry(entry.id); setEditContent(entry.content); }}
                    className="rounded-lg px-3 py-1 text-xs font-semibold text-ink/50 hover:bg-reef/10 hover:text-reef"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEntry(entry.id)}
                    disabled={saving}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                      deleteConfirmId === entry.id ? "bg-coral/20 text-coral" : "text-ink/50 hover:bg-coral/10 hover:text-coral"
                    }`}
                  >
                    🗑️ {deleteConfirmId === entry.id ? "Confirm?" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
