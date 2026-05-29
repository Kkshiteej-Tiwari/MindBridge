import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { routeSOS } from "./services/sosApi";

const countries = ["Global", "India", "US", "UK"];
const riskLevels = [
  { value: "crisis", label: "Crisis" },
  { value: "distressed", label: "Distressed" },
  { value: "elevated", label: "Elevated" },
  { value: "neutral", label: "Neutral" },
];

const quickNotes = [
  "Stay with one trusted person if possible.",
  "Keep the next step small and immediate.",
  "Use a phone call if typing feels too hard.",
];

export function SOSPage() {
  const [country, setCountry] = useState("India");
  const [riskLevel, setRiskLevel] = useState("crisis");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildRoute = async (nextCountry = country, nextRisk = riskLevel) => {
    setLoading(true);
    setError("");
    try {
      const response = await routeSOS({ country: nextCountry, risk_level: nextRisk });
      setRoute(response);
    } catch (routeError) {
      setError(routeError.message || "Unable to build SOS route.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buildRoute();
  }, []);

  const primaryTone = route?.primary_action?.tone ?? "calm";
  const toneClasses = useMemo(
    () => ({
      urgent: "border-coral/20 bg-coral/10 text-coral",
      warning: "border-amber-300/40 bg-amber-100 text-amber-700",
      calm: "border-reef/20 bg-reef/10 text-ink",
    }),
    [],
  );

  const handleBuild = () => buildRoute(country, riskLevel);

  return (
    <section className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-coral/20 bg-[linear-gradient(135deg,rgba(255,122,106,0.18),rgba(255,255,255,0.9))] p-6 shadow-xl shadow-ink/10"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-coral">SOS Hub</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink md:text-5xl">Crisis routing, fast and visible</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink/70 md:text-base">
          Pick a region and risk level to get an immediate support route, including the best first action and the right help contacts.
        </p>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
        <aside className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10 backdrop-blur-md md:p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Route builder</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink">Choose your route</h3>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            This screen is meant to get you to the right support path without making you search around.
          </p>

          <div className="mt-5 space-y-3">
            <label className="block text-xs uppercase tracking-[0.25em] text-ink/50">Region</label>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-coral/50"
            >
              {countries.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs uppercase tracking-[0.25em] text-ink/50">Risk level</label>
            <div className="grid gap-2">
              {riskLevels.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRiskLevel(item.value)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    riskLevel === item.value ? "border-ink bg-ink text-cream" : "border-ink/10 bg-white text-ink/70"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleBuild}
              className="mt-2 w-full rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Build SOS route
            </button>

            <div className="rounded-2xl border border-ink/10 bg-ink/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Quick reminders</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
                {quickNotes.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-ink/10 bg-white/80 p-5 shadow-xl shadow-ink/10 md:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Route result</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-ink">{route?.title || "SOS route ready"}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
                  {route?.summary || "Load a route to see the fastest next step and support contacts."}
                </p>
              </div>

              <div className={`rounded-full border px-4 py-2 text-sm font-semibold ${toneClasses[primaryTone]}`}>
                {loading ? "Updating..." : route?.primary_action?.label || "Ready"}
              </div>
            </div>

            {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}

            {route ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className={`rounded-3xl border p-5 ${toneClasses[primaryTone]}`}>
                  <p className="text-xs uppercase tracking-[0.3em] opacity-70">Primary action</p>
                  <h4 className="mt-2 font-display text-xl font-semibold text-ink">{route.primary_action.label}</h4>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{route.primary_action.description}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={route.primary_action.href}
                      className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream"
                    >
                      Open action
                    </a>
                    <button
                      type="button"
                      onClick={handleBuild}
                      className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
                    >
                      Refresh route
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-ink/10 bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-ink/50">What to do next</p>
                  <div className="mt-4 space-y-4">
                    {route.steps.map((step, index) => (
                      <div key={step.title} className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-reef/15 text-xs font-semibold text-ink">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{step.title}</p>
                          <p className="mt-1 text-sm leading-6 text-ink/70">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </motion.section>

          <section className="rounded-3xl border border-ink/10 bg-white/75 p-5 shadow-xl shadow-ink/10 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Regional contacts</p>
                <h3 className="mt-2 font-display text-xl font-semibold text-ink">SOS resources for {route?.country || country}</h3>
              </div>
              <div className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-ink/60">
                {route?.risk_level || riskLevel}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {(route?.resources || []).map((resource) => (
                <article key={resource.id} className="rounded-3xl border border-ink/10 bg-white p-4">
                  <p className="text-sm font-semibold text-ink">{resource.title}</p>
                  <p className="mt-2 text-xs leading-6 text-ink/70">{resource.description}</p>
                  {resource.phone ? <p className="mt-3 text-sm font-semibold text-coral">{resource.phone}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resource.url ? (
                      <a href={resource.url} target="_blank" rel="noreferrer" className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink/70">
                        Website
                      </a>
                    ) : null}
                    {resource.phone ? (
                      <a href={`tel:${resource.phone.replace(/[^0-9+]/g, "")}`} className="rounded-full bg-coral px-3 py-1 text-xs font-semibold text-white">
                        Call now
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
