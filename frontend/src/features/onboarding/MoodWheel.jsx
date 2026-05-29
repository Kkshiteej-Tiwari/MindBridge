import { useMemo } from "react";
import * as d3 from "d3";

const moods = [
  { id: "calm", label: "Calm", color: "#2EC4B6" },
  { id: "hopeful", label: "Hopeful", color: "#A7C7FF" },
  { id: "focused", label: "Focused", color: "#F9B26B" },
  { id: "neutral", label: "Balanced", color: "#F7B731" },
  { id: "stressed", label: "Stressed", color: "#FF7A6A" },
  { id: "overwhelmed", label: "Overwhelmed", color: "#FF6B6B" },
  { id: "lonely", label: "Lonely", color: "#6C63FF" },
  { id: "energized", label: "Energized", color: "#00D4AA" },
];

export function MoodWheel({ value, onChange }) {
  const arcs = useMemo(() => {
    const pie = d3.pie().value(1);
    const arc = d3.arc().innerRadius(70).outerRadius(140);
    return pie(moods).map((segment, index) => ({
      ...segment,
      path: arc(segment),
      mood: moods[index],
    }));
  }, []);

  return (
    <svg width="320" height="320" viewBox="0 0 320 320" className="mx-auto">
      <g transform="translate(160,160)">
        {arcs.map((segment) => (
          <path
            key={segment.mood.id}
            d={segment.path}
            fill={segment.mood.color}
            opacity={value === segment.mood.id ? 0.95 : 0.6}
            stroke="#ffffff"
            strokeWidth="3"
            onClick={() => onChange(segment.mood.id)}
            className="cursor-pointer transition-opacity"
          />
        ))}
        <circle r="58" fill="#ffffff" opacity="0.9" />
        <text textAnchor="middle" className="fill-ink text-sm font-semibold">
          <tspan x="0" y="-2">
            {value ? moods.find((item) => item.id === value)?.label : "Pick your mood"}
          </tspan>
          <tspan x="0" y="18" className="text-[10px] fill-ink/60">
            Tap a color
          </tspan>
        </text>
      </g>
    </svg>
  );
}
