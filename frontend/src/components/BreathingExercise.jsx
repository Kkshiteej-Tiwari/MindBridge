import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PHASES = [
  { label: "Breathe in", duration: 4000, scale: 1 },
  { label: "Hold", duration: 4000, scale: 1 },
  { label: "Breathe out", duration: 4000, scale: 0.6 },
  { label: "Hold", duration: 4000, scale: 0.6 },
];

export function BreathingExercise({ onClose }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const timerRef = useRef(null);

  const phase = PHASES[phaseIndex];

  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setTimeout(() => {
      const nextIndex = (phaseIndex + 1) % PHASES.length;
      setPhaseIndex(nextIndex);
      if (nextIndex === 0) {
        setRounds((r) => r + 1);
      }
    }, phase.duration);

    return () => clearTimeout(timerRef.current);
  }, [phaseIndex, isRunning, phase.duration]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background:
            "radial-gradient(circle at center, rgba(46,196,182,0.15), transparent 60%), linear-gradient(180deg, rgba(11,16,32,0.85) 0%, rgba(11,16,32,0.95) 100%)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex flex-col items-center gap-8">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-md transition hover:bg-white/20"
          >
            ✕ Close
          </button>

          {/* Title */}
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase tracking-[0.4em] text-white/50"
          >
            Box Breathing
          </motion.p>

          {/* Breathing circle */}
          <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
            {/* Outer glow ring */}
            <motion.div
              animate={{
                scale: phase.scale,
                boxShadow:
                  phaseIndex === 0 || phaseIndex === 2
                    ? "0 0 80px rgba(46,196,182,0.4), 0 0 160px rgba(46,196,182,0.15)"
                    : "0 0 40px rgba(46,196,182,0.2), 0 0 80px rgba(46,196,182,0.08)",
              }}
              transition={{
                scale: { duration: phase.duration / 1000, ease: "easeInOut" },
                boxShadow: { duration: phase.duration / 1000, ease: "easeInOut" },
              }}
              className="absolute rounded-full"
              style={{
                width: 260,
                height: 260,
                border: "2px solid rgba(46,196,182,0.3)",
              }}
            />

            {/* Main breathing circle */}
            <motion.div
              animate={{ scale: phase.scale }}
              transition={{ duration: phase.duration / 1000, ease: "easeInOut" }}
              className="rounded-full"
              style={{
                width: 220,
                height: 220,
                background:
                  "radial-gradient(circle at 40% 35%, rgba(46,196,182,0.35), rgba(46,196,182,0.08))",
                border: "1px solid rgba(46,196,182,0.25)",
                backdropFilter: "blur(10px)",
              }}
            />

            {/* Center text */}
            <motion.div
              key={phaseIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute flex flex-col items-center"
            >
              <span className="text-2xl font-semibold text-white/90">{phase.label}</span>
              <span className="mt-2 text-sm text-white/40">
                {Math.ceil(phase.duration / 1000)}s
              </span>
            </motion.div>
          </div>

          {/* Round counter */}
          <div className="flex items-center gap-4">
            <p className="text-sm text-white/50">
              Round <span className="font-semibold text-white/80">{rounds + 1}</span>
            </p>
            <div className="flex gap-1.5">
              {PHASES.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 w-6 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor:
                      i === phaseIndex ? "rgba(46,196,182,0.8)" : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-md transition hover:bg-white/20"
            >
              {isRunning ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPhaseIndex(0);
                setRounds(0);
                setIsRunning(true);
              }}
              className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white/80 backdrop-blur-md transition hover:bg-white/20"
            >
              Restart
            </button>
          </div>

          <p className="max-w-xs text-center text-xs text-white/30">
            Follow the circle. Breathe in as it grows, breathe out as it shrinks. Four rounds
            recommended.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
