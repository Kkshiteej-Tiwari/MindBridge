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
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-md md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-lavender/60">Your Safe Space</p>
          <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Mood journal</h2>
        </div>
        <div className="rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm text-teal">
          {localSaving || saving ? "Saving..." : `Last updated ${formatTimestamp(entry.updatedAt)}`}
        </div>
      </div>

      <label className="mb-3 block text-sm text-lavender/70">Write about your day</label>
      <motion.textarea
        animate={{ boxShadow: localSaving || saving ? "0 0 0 1px rgba(0,212,170,0.45)" : "0 0 0 1px rgba(240,238,255,0.08)" }}
        transition={{ duration: 0.25 }}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="What happened today? What stood out?"
        className="min-h-[360px] w-full rounded-2xl border border-white/10 bg-[#13172d] p-5 text-lg leading-8 text-lavender outline-none placeholder:text-lavender/30 focus:border-teal/50"
      />

      <div className="mt-3 flex items-center justify-between text-sm text-lavender/60">
        <span>{content.trim().length} characters</span>
        <span>Autosave every 900ms</span>
      </div>
    </section>
  );
}
