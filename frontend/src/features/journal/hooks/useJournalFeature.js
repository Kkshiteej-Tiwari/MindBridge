import { useCallback, useEffect, useMemo, useState } from "react";
import { createEntry, fetchEntries, fetchHistory, updateEntry } from "../services/journalApi";

export function useJournalFeature() {
  const [entries, setEntries] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [journalEntries, historyPoints] = await Promise.all([fetchEntries(), fetchHistory()]);
      setEntries(journalEntries);
      setHistory(historyPoints);

      if (journalEntries.length === 0) {
        const draft = await createEntry();
        const refreshedEntries = await fetchEntries();
        const refreshedHistory = await fetchHistory();
        setEntries(refreshedEntries);
        setHistory(refreshedHistory);
        setActiveId(draft.id);
        return;
      }

      setActiveId((currentActiveId) => currentActiveId || journalEntries[0].id);
    } catch (refreshError) {
      setError(refreshError.message || "Unable to load journal data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeEntry = useMemo(
    () => entries.find((entry) => entry.id === activeId) || entries[0] || null,
    [activeId, entries],
  );

  const selectEntry = useCallback((entryId) => {
    setActiveId(entryId);
  }, []);

  const createDraft = useCallback(async () => {
    setSaving(true);
    setError("");

    try {
      const draft = await createEntry();
      const refreshedEntries = await fetchEntries();
      const refreshedHistory = await fetchHistory();
      setEntries(refreshedEntries);
      setHistory(refreshedHistory);
      setActiveId(draft.id);
      return draft;
    } catch (createError) {
      setError(createError.message || "Unable to create a new entry.");
      throw createError;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveEntry = useCallback(async (entryId, content) => {
    setSaving(true);
    setError("");

    try {
      const updated = await updateEntry(entryId, content);
      setEntries((currentEntries) =>
        currentEntries.map((entry) => (entry.id === entryId ? updated : entry)),
      );
      setHistory(await fetchHistory());
      return updated;
    } catch (saveError) {
      setError(saveError.message || "Unable to save the journal entry.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    activeEntry,
    activeId,
    createDraft,
    error,
    entries,
    history,
    loading,
    refresh,
    saveEntry,
    saving,
    selectEntry,
    setEntries,
  };
}
