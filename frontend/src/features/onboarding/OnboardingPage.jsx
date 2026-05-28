import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MoodWheel from "./MoodWheel";

export function OnboardingPage() {
  const [mood, setMood] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const onboarded = localStorage.getItem("mb_onboarded");
      const savedMood = localStorage.getItem("mb_mood");
      if (savedMood) {
        setMood(savedMood);
      }
      setIsOnboarded(Boolean(onboarded));
    } catch (e) {
      // ignore
    }
  }, []);

  function handleContinue() {
    if (!mood) return;
    try {
      localStorage.setItem("mb_mood", mood);
      localStorage.setItem("mb_onboarded", "1");
    } catch (e) {
      // ignore
    }
    setIsOnboarded(true);
    navigate("/");
  }

  function handleReset() {
    try {
      localStorage.removeItem("mb_mood");
      localStorage.removeItem("mb_onboarded");
    } catch (e) {
      // ignore
    }
    setMood(null);
    setIsOnboarded(false);
  }

  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-ink/10 bg-white/80 shadow-xl shadow-ink/10">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">First run setup</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Welcome to MindBridge</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink/70 md:text-base">
            Start by selecting how you're feeling right now. Your choice helps personalize the journal, coach, and daily guidance.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center">
            <MoodWheel value={mood} onChange={setMood} size={280} />
          </div>
        </div>

        <div className="border-t border-ink/10 bg-foam/30 p-6 md:p-8 lg:border-t-0 lg:border-l">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Current profile</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink">Set your starting mood</h3>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            Choose the mood that fits best today. You can always return here and update it later.
          </p>

          <div className="mt-6 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink/70">
            Selected: <span className="font-semibold text-ink">{mood || "None"}</span>
          </div>

          {isOnboarded ? (
            <p className="mt-3 text-sm text-reef-700">Your setup is already saved. You can update it below or continue to the app.</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleContinue}
              className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cream disabled:opacity-50"
              disabled={!mood}
            >
              Continue
            </button>
            <button
              onClick={handleReset}
              type="button"
              className="rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink/70"
            >
              Reset setup
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default OnboardingPage;
