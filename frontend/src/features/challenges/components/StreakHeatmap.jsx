import { useMemo } from "react";

const DAYS_OF_WEEK = ["M", "T", "W", "T", "F", "S", "S"];

function buildHeatmap(streak) {
  const days = 28;
  const values = [];
  for (let i = 0; i < days; i += 1) {
    // Days within streak get higher intensity, with recent days being brighter
    const daysAgo = days - 1 - i;
    const isInStreak = daysAgo < streak;
    const intensity = isInStreak
      ? Math.min(1, 0.4 + (1 - daysAgo / Math.max(streak, 1)) * 0.6)
      : 0;
    values.push(intensity);
  }
  return values;
}

export function StreakHeatmap({ streak = 0 }) {
  const values = useMemo(() => buildHeatmap(streak), [streak]);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 27);

  return (
    <div>
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DAYS_OF_WEEK.map((day, i) => (
          <span key={i} className="text-center text-[9px] text-ink/40 font-semibold">
            {day}
          </span>
        ))}
      </div>
      {/* Heatmap grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {values.map((value, index) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + index);
          const isToday = date.toDateString() === today.toDateString();

          return (
            <div
              key={`heat-${index}`}
              className={`aspect-square w-full rounded-md transition-colors ${
                isToday ? "ring-2 ring-reef/50 ring-offset-1" : ""
              }`}
              style={{
                backgroundColor:
                  value > 0
                    ? `rgba(46,196,182,${0.15 + value * 0.75})`
                    : "rgba(11,16,32,0.05)",
              }}
              title={`${date.toLocaleDateString()} — ${value > 0 ? "Active" : "Missed"}`}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1.5 text-[9px] text-ink/40">
        <span>Less</span>
        {[0.05, 0.25, 0.5, 0.75, 0.95].map((v, i) => (
          <div
            key={i}
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: `rgba(46,196,182,${0.15 + v * 0.75})` }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
