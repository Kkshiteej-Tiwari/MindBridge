import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoodWheel } from "./MoodWheel";

const moodColors = {
  calm: "rgba(46,196,182,0.25)",
  hopeful: "rgba(167,199,255,0.25)",
  focused: "rgba(249,178,107,0.25)",
  neutral: "rgba(247,183,49,0.25)",
  stressed: "rgba(255,122,106,0.25)",
  overwhelmed: "rgba(255,107,107,0.25)",
  lonely: "rgba(108,99,255,0.25)",
  energized: "rgba(0,212,170,0.25)",
};

const particles = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  size: 4 + Math.random() * 8,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 5,
  duration: 5 + Math.random() * 5,
}));

export function OnboardingPage({ onComplete }) {
  const [mood, setMood] = useState(() => localStorage.getItem("mindbridgeMood") || "");

  const helperText = useMemo(() => {
    if (!mood) {
      return "Click the color that feels closest to you right now.";
    }
    return "Great choice. This helps MindBridge personalize your journey.";
  }, [mood]);

  const handleContinue = () => {
    if (mood) {
      localStorage.setItem("mindbridgeMood", mood);
    }
    localStorage.setItem("mindbridgeOnboarded", "true");
    onComplete();
  };

  const bgGlow = mood ? moodColors[mood] || "rgba(46,196,182,0.2)" : "rgba(46,196,182,0.2)";

  return (
    <div
      className="relative min-h-screen overflow-hidden px-4 py-10 text-ink transition-colors duration-1000"
      style={{
        background: `radial-gradient(circle at center, ${bgGlow}, transparent 50%), radial-gradient(circle at 70% 20%, rgba(255,122,106,0.15), transparent 40%), linear-gradient(180deg, #f7f4ef 0%, #f3f1ea 55%, #e9f3ef 100%)`,
      }}
    >
      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            background: mood ? bgGlow : "rgba(46,196,182,0.15)",
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative mx-auto flex max-w-4xl flex-col gap-10 rounded-[32px] border border-white/60 bg-white p-6 shadow-2xl shadow-ink/10 backdrop-blur-md md:p-10">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs uppercase tracking-[0.35em] text-ink/50"
          >
            MindBridge AI
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl"
          >
            Welcome to your{" "}
            <span className="bg-gradient-to-r from-reef to-teal-400 bg-clip-text text-transparent">
              mood space
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 max-w-2xl text-sm text-ink/70 md:text-base"
          >
            Before we begin, choose the mood that feels closest to you. This sets the tone for your wellness journey.
          </motion.p>
        </motion.header>

        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
          >
            <MoodWheel value={mood} onChange={setMood} />
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="rounded-3xl border border-ink/10 bg-white px-5 py-4 text-sm text-ink/70">
              {helperText}
            </div>
            <div className="rounded-3xl border border-ink/10 bg-foam px-5 py-4 text-sm text-ink/70">
              Your mood stays private and helps MindBridge suggest the right prompts and support.
            </div>
            <motion.button
              type="button"
              onClick={handleContinue}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-cream shadow-lg shadow-ink/20 transition hover:brightness-110"
            >
              Continue to dashboard
            </motion.button>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink/70 transition hover:bg-foam"
            >
              Skip for now
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
