import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function JournalEditor({ entry, onSave, saving }) {
  const [content, setContent] = useState(entry?.content ?? "");
  const [localSaving, setLocalSaving] = useState(false);
  const debounceRef = useRef(null);
  const hydratedEntryIdRef = useRef(entry?.id ?? null);

  useEffect(() => {
    setContent(entry?.content ?? "");
    hydratedEntryIdRef.current = entry?.id ?? null;
  }, [entry?.id, entry?.content]);

  useEffect(() => {
    if (!entry?.id) {
      return undefined;
    }

    if (hydratedEntryIdRef.current !== entry.id) {
      hydratedEntryIdRef.current = entry.id;
      return undefined;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      if (content === (entry?.content ?? "")) {
        return;
      }

      setLocalSaving(true);
      try {
        await onSave(entry.id, content);
      } finally {
        setLocalSaving(false);
      }
    }, 900);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [content, entry?.content, entry?.id, onSave]);

  if (!entry) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10 backdrop-blur-md md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Your Safe Space</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink md:text-3xl">Mood journal</h3>
        </div>
        <div className="rounded-full border border-reef/30 bg-reef/15 px-4 py-2 text-sm text-reef">
          {localSaving || saving ? "Saving..." : `Last updated ${formatTimestamp(entry.updatedAt)}`}
        </div>
      </div>

      <label className="mb-3 block text-sm text-ink/70">Write about your day</label>
      <motion.textarea
        animate={{ boxShadow: localSaving || saving ? "0 0 0 1px rgba(46,196,182,0.45)" : "0 0 0 1px rgba(16,18,26,0.08)" }}
        transition={{ duration: 0.25 }}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="What happened today? What stood out?"
        className="min-h-[360px] w-full rounded-2xl border border-ink/10 bg-white/80 p-5 text-lg leading-8 text-ink outline-none placeholder:text-ink/30 focus:border-reef/50"
      />

      <div className="mt-3 flex items-center justify-between text-sm text-ink/60">
        <span>{content.trim().length} characters</span>
        <span>Autosave every 900ms</span>
      </div>
    </section>
  );
}
