import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoodWheel } from "./MoodWheel";

export function OnboardingPage({ onComplete }) {
  const [mood, setMood] = useState(() => localStorage.getItem("mindbridgeMood") || "");

  const helperText = useMemo(() => {
    if (!mood) {
      return "Drag toward the color that feels closest to you.";
    }
    return "Great. This helps MindBridge personalize your journey.";
  }, [mood]);

  const handleContinue = () => {
    if (mood) {
      localStorage.setItem("mindbridgeMood", mood);
    }
    localStorage.setItem("mindbridgeOnboarded", "true");
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,196,182,0.25),_transparent_40%),radial-gradient(circle_at_70%_20%,_rgba(255,122,106,0.25),_transparent_40%),linear-gradient(180deg,_#f7f4ef_0%,_#f3f1ea_55%,_#e9f3ef_100%)] px-4 py-10 text-ink">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 rounded-[32px] border border-white/60 bg-white/70 p-6 shadow-2xl shadow-ink/10 backdrop-blur-md md:p-10">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs uppercase tracking-[0.35em] text-ink/50">MindBridge AI</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">Welcome to your mood space</h1>
          <p className="mt-3 max-w-2xl text-sm text-ink/70 md:text-base">
            Before we begin, choose the mood that feels closest to you. This sets the tone for your wellness journey.
          </p>
        </motion.header>

        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <MoodWheel value={mood} onChange={setMood} />
          </motion.div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-ink/10 bg-white px-5 py-4 text-sm text-ink/70">
              {helperText}
            </div>
            <div className="rounded-3xl border border-ink/10 bg-foam px-5 py-4 text-sm text-ink/70">
              Your mood stays private and helps MindBridge suggest the right prompts and support.
            </div>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-cream transition hover:brightness-105"
            >
              Continue to dashboard
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink/70"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
