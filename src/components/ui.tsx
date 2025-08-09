"use client";
import React from "react";

export const TOK = {
  bg: "bg-neutral-50",
  text: "text-neutral-900",
  card: "bg-white border border-neutral-200 rounded-2xl shadow-lg",
  label: "text-xs text-neutral-600",
  select:
    "px-3 py-2 pr-9 rounded-xl border border-neutral-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-black/10",
  input:
    "px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-black/10",
  btn:
    "px-3 py-2 rounded-xl shadow hover:opacity-90 active:scale-[.99] bg-black text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/10",
  badge: "text-xs px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200",
};

export function Button(
  { className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return <button {...rest} className={`${TOK.btn} ${className}`} />;
}

export function Input({ className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${TOK.input} ${className}`} />;
}

export function Textarea({ className = "", ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${TOK.input} ${className}`} />;
}

export function Select({ className = "", ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={`${TOK.select} ${className}`} />;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className={TOK.badge}>{children}</span>;
}

export function Card({ className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`${TOK.card} p-4 ${className}`} />;
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Flowgrid logo"
      role="img"
    >
      <rect x="8" y="8" width="112" height="112" rx="28" fill="currentColor" />
      <path
        d="M36 84c12-20 44-20 56 0"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="36" cy="84" r="6" fill="white" />
      <circle cx="64" cy="64" r="6" fill="white" />
      <circle cx="92" cy="84" r="6" fill="white" />
    </svg>
  );
}

export function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="h-2 w-full rounded-full bg-neutral-200">
      <div className="h-2 rounded-full bg-black transition-all" style={{ width: `${v}%` }} />
    </div>
  );
}

