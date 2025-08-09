"use client";
import React from "react";

export default function MiniBar({ data }: { data: number[] }) {
  const w = 220,
    h = 40,
    pad = 6,
    max = Math.max(1, ...data),
    bw = (w - pad * 2) / data.length;
  return (
    <svg width={w} height={h} className="mt-2">
      {data.map((v, i) => {
        const bh = (v / max) * (h - pad * 2);
        return (
          <rect
            key={i}
            x={pad + i * bw}
            y={h - pad - bh}
            width={bw - 4}
            height={bh}
            rx={3}
            className="fill-green-600"
          />
        );
      })}
    </svg>
  );
}
