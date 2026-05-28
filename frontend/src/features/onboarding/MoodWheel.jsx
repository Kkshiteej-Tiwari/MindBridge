import React, { useState } from "react";
import { motion } from "framer-motion";

const MOODS = [
  { id: "calm", label: "Calm", color: "#6C63FF" },
  { id: "content", label: "Content", color: "#00D4AA" },
  { id: "happy", label: "Happy", color: "#F0EEFF" },
  { id: "excited", label: "Excited", color: "#FFD166" },
  { id: "stressed", label: "Stressed", color: "#FF6B6B" },
  { id: "anxious", label: "Anxious", color: "#F25C54" },
  { id: "sad", label: "Sad", color: "#8AA4FF" },
  { id: "angry", label: "Angry", color: "#F77171" },
];

export function MoodWheel({ value, onChange, size = 320 }) {
  const radius = size / 2;
  const slice = (Math.PI * 2) / MOODS.length;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.08" />
        </filter>
      </defs>
      <g transform={`translate(${radius}, ${radius})`} filter="url(#soft)">
        {MOODS.map((m, i) => {
          const a1 = i * slice - Math.PI / 2;
          const a2 = a1 + slice;
          const x1 = Math.cos(a1) * radius;
          const y1 = Math.sin(a1) * radius;
          const x2 = Math.cos(a2) * radius;
          const y2 = Math.sin(a2) * radius;
          const large = slice > Math.PI ? 1 : 0;
          const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`;
          const selected = value === m.id;

          return (
            <motion.path
              key={m.id}
              d={path}
              fill={m.color}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={2}
              onClick={() => onChange && onChange(m.id)}
              whileHover={{ scale: 1.02 }}
              style={{ cursor: "pointer", transformOrigin: "center" }}
              opacity={selected ? 1 : 0.95}
            />
          );
        })}

        <circle r={radius * 0.38} fill="#ffffff" opacity={0.98} />
        <text x="0" y="6" textAnchor="middle" fontSize="18" fill="#0f172a" fontWeight={700}>
          {value ? MOODS.find((m) => m.id === value).label : "How are you?"}
        </text>
      </g>
    </svg>
  );
}

export default MoodWheel;
