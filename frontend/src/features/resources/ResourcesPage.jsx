import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { fetchCrisisResources, fetchResources } from "./services/resourcesApi";

const topics = ["all", "grounding", "academic", "sleep", "support", "conversation"];

export function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [crisisResources, setCrisisResources] = useState([]);
  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const [items, crisis] = await Promise.all([fetchResources(), fetchCrisisResources()]);
        setResources(items || []);
        setCrisisResources(crisis || []);
      } catch (loadError) {
        setError(loadError.message || "Unable to load resources.");
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return resources.filter((resource) => {
      const matchesTopic = topic === "all" || resource.topic === topic;
      const matchesQuery = resource.title.toLowerCase().includes(query.toLowerCase());
      return matchesTopic && matchesQuery;
    });
  }, [query, resources, topic]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-ink/10 bg-white/70 p-6 shadow-xl shadow-ink/10">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Resource Hub</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Support when you need it</h2>
        <p className="mt-3 max-w-3xl text-sm text-ink/70 md:text-base">
          Explore trusted tools, grounding exercises, and academic wellness tips curated for students.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-coral/30 bg-coral/10 p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-coral">Crisis support</p>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">Immediate help</h3>
            <div className="mt-4 space-y-3">
              {crisisResources.map((resource) => (
                <div key={resource.id} className="rounded-2xl border border-coral/20 bg-white/80 p-4">
                  <p className="text-sm font-semibold text-ink">{resource.title}</p>
                  <p className="mt-1 text-xs text-ink/70">{resource.description}</p>
                  <p className="mt-2 text-sm text-coral">{resource.phone}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Search</p>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resources"
              className="mt-3 w-full rounded-full border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-reef/60"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTopic(label)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    topic === label ? "border-ink bg-ink text-cream" : "border-ink/10 bg-white text-ink/70"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Curated tools</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">Guided resources</h3>
            </div>
          </div>
          {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {filtered.map((resource) => (
              <motion.article
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-ink/10 bg-white p-4"
              >
                <p className="text-sm font-semibold text-ink">{resource.title}</p>
                <p className="mt-2 text-xs text-ink/70">{resource.description}</p>
                {resource.url ? (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-xs font-semibold text-reef"
                  >
                    Open resource
                  </a>
                ) : null}
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
