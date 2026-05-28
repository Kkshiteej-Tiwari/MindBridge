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
    <div className="rounded-2xl border border-white/10 bg-[#11162a] px-4 py-3 text-sm text-lavender shadow-2xl shadow-black/40 backdrop-blur-md">
      <p className="text-lavender/60">{new Date(label).toLocaleString()}</p>
      <p className="mt-1 text-base font-semibold capitalize text-white">{point.mood}</p>
      <p className="text-lavender/80">Sentiment: {point.sentimentScore}</p>
    </div>
  );
}

export function HistoryChart({ data }) {
  if (!data.length) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-lavender/70">
        Start journaling to see your mood line chart.
      </div>
    );
  }

  return (
    <div className="h-[320px] rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-lavender/60">Mood trend</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Sentiment history</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-[#13172d] px-3 py-1 text-xs text-lavender/70">
          {data.length} entries
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="createdAt"
            tickFormatter={formatDate}
            stroke="rgba(240,238,255,0.45)"
            tick={{ fill: "rgba(240,238,255,0.55)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[-10, 10]}
            stroke="rgba(240,238,255,0.45)"
            tick={{ fill: "rgba(240,238,255,0.55)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="sentimentScore"
            stroke="#6C63FF"
            strokeWidth={3}
            dot={{ r: 4, fill: "#00D4AA", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#F7B731" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
