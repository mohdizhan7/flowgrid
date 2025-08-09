"use client";
import React from "react";

export default function MiniLine({ data }: { data: number[] }) {
  const w = 220,
    h = 48,
    pad = 6,
    max = Math.max(1, ...data);
  const denom = Math.max(data.length - 1, 1);
  const points = data
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / denom;
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="mt-2">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        className="text-green-600"
        strokeWidth="2"
      />
      {data.map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / denom;
        const y = h - pad - (v / max) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r={2} className="fill-green-600" />;
      })}
    </svg>
  );
}
