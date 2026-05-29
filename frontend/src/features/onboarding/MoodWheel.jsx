import { useMemo, useState } from "react";
import * as d3 from "d3";

const moods = [
  { id: "calm", label: "Calm", color: "#2EC4B6", glow: "rgba(46,196,182,0.4)" },
  { id: "hopeful", label: "Hopeful", color: "#A7C7FF", glow: "rgba(167,199,255,0.4)" },
  { id: "focused", label: "Focused", color: "#F9B26B", glow: "rgba(249,178,107,0.4)" },
  { id: "neutral", label: "Balanced", color: "#F7B731", glow: "rgba(247,183,49,0.4)" },
  { id: "stressed", label: "Stressed", color: "#FF7A6A", glow: "rgba(255,122,106,0.4)" },
  { id: "overwhelmed", label: "Overwhelmed", color: "#FF6B6B", glow: "rgba(255,107,107,0.4)" },
  { id: "lonely", label: "Lonely", color: "#6C63FF", glow: "rgba(108,99,255,0.4)" },
  { id: "energized", label: "Energized", color: "#00D4AA", glow: "rgba(0,212,170,0.4)" },
];

export function MoodWheel({ value, onChange }) {
  const [hoveredId, setHoveredId] = useState(null);

  const arcs = useMemo(() => {
    const pie = d3.pie().value(1).sort(null);
    const arc = d3.arc().innerRadius(70).outerRadius(140).padAngle(0.02);
    const hoverArc = d3.arc().innerRadius(65).outerRadius(150).padAngle(0.02);
    return pie(moods).map((segment, index) => ({
      ...segment,
      path: arc(segment),
      hoverPath: hoverArc(segment),
      mood: moods[index],
    }));
  }, []);

  const selectedMood = moods.find((m) => m.id === value);
  const hoveredMood = moods.find((m) => m.id === hoveredId);
  const displayMood = hoveredMood || selectedMood;

  return (
    <svg width="320" height="320" viewBox="0 0 320 320" className="mx-auto select-none">
      <defs>
        {moods.map((m) => (
          <radialGradient key={`grad-${m.id}`} id={`grad-${m.id}`}>
            <stop offset="0%" stopColor={m.color} stopOpacity="1" />
            <stop offset="100%" stopColor={m.color} stopOpacity="0.7" />
          </radialGradient>
        ))}
        <filter id="wheel-glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="inner-shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feOffset dx="0" dy="1" result="offsetBlur" />
          <feComposite in="SourceGraphic" in2="offsetBlur" operator="over" />
        </filter>
      </defs>

      <g transform="translate(160,160)">
        {/* Outer glow ring when mood selected */}
        {selectedMood && (
          <circle
            r="152"
            fill="none"
            stroke={selectedMood.color}
            strokeWidth="2"
            opacity="0.3"
            style={{
              filter: "url(#wheel-glow)",
              transition: "all 0.5s ease",
            }}
          />
        )}

        {/* Wheel segments */}
        {arcs.map((segment) => {
          const isActive = value === segment.mood.id;
          const isHovered = hoveredId === segment.mood.id;
          return (
            <g key={segment.mood.id}>
              {/* Glow behind active segment */}
              {isActive && (
                <path
                  d={segment.hoverPath}
                  fill={segment.mood.glow}
                  style={{ filter: "url(#wheel-glow)" }}
                />
              )}
              <path
                d={isActive || isHovered ? segment.hoverPath : segment.path}
                fill={`url(#grad-${segment.mood.id})`}
                opacity={isActive ? 1 : isHovered ? 0.85 : value ? 0.45 : 0.65}
                stroke="#ffffff"
                strokeWidth={isActive ? 3 : 2}
                onClick={() => onChange(segment.mood.id)}
                onMouseEnter={() => setHoveredId(segment.mood.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="cursor-pointer"
                style={{
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: isActive ? "url(#wheel-glow)" : "none",
                }}
              />
              {/* Mood label on arc */}
              {(isActive || isHovered) && (
                <text
                  x={d3.arc().innerRadius(108).outerRadius(108).centroid(segment)[0]}
                  y={d3.arc().innerRadius(108).outerRadius(108).centroid(segment)[1]}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-white text-[9px] font-bold pointer-events-none"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                >
                  {segment.mood.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Center circle with glass effect */}
        <circle r="62" fill="white" opacity="0.95" filter="url(#inner-shadow)" />
        <circle
          r="62"
          fill="none"
          stroke={displayMood ? displayMood.color : "#e5e5e5"}
          strokeWidth="2"
          opacity="0.5"
          style={{ transition: "stroke 0.3s ease" }}
        />

        {/* Center text */}
        <text textAnchor="middle" className="pointer-events-none">
          {displayMood ? (
            <>
              <tspan
                x="0"
                y="-8"
                className="text-base font-bold"
                fill={displayMood.color}
                style={{ transition: "fill 0.3s ease" }}
              >
                {displayMood.label}
              </tspan>
              <tspan x="0" y="14" className="text-[10px]" fill="#0b1020" opacity="0.5">
                {value === displayMood.id ? "✓ Selected" : "Click to select"}
              </tspan>
            </>
          ) : (
            <>
              <tspan x="0" y="-5" className="text-sm font-semibold" fill="#0b1020">
                How do you feel?
              </tspan>
              <tspan x="0" y="15" className="text-[10px]" fill="#0b1020" opacity="0.5">
                Click a segment
              </tspan>
            </>
          )}
        </text>
      </g>
    </svg>
  );
}
