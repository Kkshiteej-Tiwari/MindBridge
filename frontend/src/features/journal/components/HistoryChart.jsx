import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink shadow-lg shadow-ink/10">
      <p className="text-ink/60">{new Date(label).toLocaleString()}</p>
      <p className="mt-1 text-base font-semibold capitalize text-ink">{point.mood}</p>
      <p className="text-ink/80">Sentiment: {point.sentimentScore}</p>
    </div>
  );
}

export function HistoryChart({ data }) {
  if (!data.length) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-ink/20 bg-white/70 p-6 text-center text-ink/70">
        Start journaling to see your mood line chart.
      </div>
    );
  }

  return (
    <div className="h-[320px] rounded-3xl border border-ink/10 bg-white/70 p-4 shadow-xl shadow-ink/10 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink/50">Mood trend</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-ink">Sentiment history</h3>
        </div>
        <div className="rounded-full border border-ink/10 bg-white/80 px-3 py-1 text-xs text-ink/70">
          {data.length} entries
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(16,18,26,0.08)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="createdAt"
            tickFormatter={formatDate}
            stroke="rgba(16,18,26,0.45)"
            tick={{ fill: "rgba(16,18,26,0.55)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[-10, 10]}
            stroke="rgba(16,18,26,0.45)"
            tick={{ fill: "rgba(16,18,26,0.55)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="sentimentScore"
            stroke="#2EC4B6"
            strokeWidth={3}
            dot={{ r: 4, fill: "#FF7A6A", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#F9B26B" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
