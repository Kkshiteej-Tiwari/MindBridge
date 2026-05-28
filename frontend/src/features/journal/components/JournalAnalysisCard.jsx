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
    <aside className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur-md md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-lavender/60">AI Analysis</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Detected mood</h3>
        </div>
        <div
          className="h-12 w-12 rounded-2xl border border-white/10 shadow-lg shadow-black/20"
          style={{ backgroundColor: analysis.color }}
          title={analysis.color}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-[#13172d] p-4">
        <p className="text-sm text-lavender/50">Mood label</p>
        <p className="mt-2 text-2xl font-bold capitalize text-white">{analysis.mood}</p>
        <p className="mt-1 text-sm text-lavender/70">Sentiment score: {analysis.sentimentScore}</p>
      </div>

      <ul className="mt-5 space-y-4">
        {metrics.map((metric) => (
          <li key={metric.label} className="rounded-2xl border border-white/10 bg-[#101427] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-lavender/45">{metric.label}</p>
            <p className="mt-2 text-base leading-6 text-lavender/90">{metric.value}</p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
