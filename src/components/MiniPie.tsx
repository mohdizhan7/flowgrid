"use client";
import React from "react";

export default function MiniPie({ values, labels }: { values: number[]; labels: string[] }) {
  const total = Math.max(1, values.reduce((a, b) => a + b, 0));
  const colors = ["#9CA3AF", "#60A5FA", "#F59E0B", "#A78BFA", "#34D399"];
  let a = 0;
  const r = 34,
    cx = 40,
    cy = 40;
  return (
    <div className="flex items-center gap-4">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {values.map((v, i) => {
          const frac = v / total,
            angle = frac * Math.PI * 2;
          const x1 = cx + r * Math.cos(a),
            y1 = cy + r * Math.sin(a);
          const x2 = cx + r * Math.cos(a + angle),
            y2 = cy + r * Math.sin(a + angle);
          const large = angle > Math.PI ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
          a += angle;
          return <path key={i} d={d} fill={colors[i % colors.length]} />;
        })}
      </svg>
      <div className="grid gap-1">
        {labels.map((l, i) => (
          <div key={l} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: colors[i % colors.length] }}
            />
            <span className="w-28">{l}</span>
            <span className="font-medium">{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
