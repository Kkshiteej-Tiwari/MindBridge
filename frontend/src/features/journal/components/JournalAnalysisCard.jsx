const moodLabels = {
  positive: "Hopeful",
  neutral: "Balanced",
  distressed: "Stressed",
  crisis: "Crisis",
};

export function JournalAnalysisCard({ analysis }) {
  if (!analysis) {
    return null;
  }

  const metrics = [
    { label: "Mood", value: moodLabels[analysis.mood] || analysis.mood },
    { label: "Subject", value: analysis.subject },
    { label: "Summary", value: analysis.summary },
    { label: "Sentiment", value: analysis.sentimentScore },
    { label: "Negative", value: analysis.negative ? "Yes" : "No" },
  ];

  return (
    <aside className="rounded-3xl border border-ink/10 bg-white/70 p-5 shadow-xl shadow-ink/10 backdrop-blur-md md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Mood reflection</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-ink">Detected mood</h3>
        </div>
        <div
          className="h-12 w-12 rounded-2xl border border-ink/10 shadow-lg shadow-ink/10"
          style={{ backgroundColor: analysis.color }}
          title={analysis.color}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-ink/10 bg-white/80 p-4">
        <p className="text-sm text-ink/50">Mood label</p>
        <p className="mt-2 text-2xl font-bold capitalize text-ink">{analysis.mood}</p>
        <p className="mt-1 text-sm text-ink/70">Sentiment score: {analysis.sentimentScore}</p>
      </div>

      <ul className="mt-5 space-y-4">
        {metrics.map((metric) => (
          <li key={metric.label} className="rounded-2xl border border-ink/10 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/45">{metric.label}</p>
            <p className="mt-2 text-base leading-6 text-ink/90">{metric.value}</p>
          </li>
        ))}
      </ul>

      {analysis.reflectionPrompt ? (
        <div className="mt-5 rounded-2xl border border-reef/30 bg-reef/10 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-ink/50">Reflection prompt</p>
          <p className="mt-2 text-sm text-ink/80">{analysis.reflectionPrompt}</p>
        </div>
      ) : null}
    </aside>
  );
}
