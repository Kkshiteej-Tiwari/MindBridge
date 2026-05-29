import { useMemo } from "react";

function buildHeatmap(streak) {
  const days = 28;
  const values = [];
  for (let i = 0; i < days; i += 1) {
    const intensity = Math.max(0, Math.min(1, (streak - (days - i)) / days));
    values.push(intensity);
  }
  return values;
}

export function StreakHeatmap({ streak = 0 }) {
  const values = useMemo(() => buildHeatmap(streak), [streak]);

  return (
    <div className="grid grid-cols-7 gap-2">
      {values.map((value, index) => (
        <div
          key={`heat-${index}`}
          className="h-4 w-full rounded"
          style={{ backgroundColor: `rgba(46,196,182,${0.2 + value * 0.7})` }}
        />
      ))}
    </div>
  );
}
