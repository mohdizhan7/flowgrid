"use client";
import React, { useState } from "react";
import { Project } from "../lib/types";

export default function QuickAdd({
  projects,
  defaultProjectId,
  onAdd,
}: {
  projects: Project[];
  defaultProjectId?: string | null;
  onAdd: (title: string, projectId?: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string>(defaultProjectId || "");

  const go = () => {
    const t = title.trim();
    if (!t) return;
    onAdd(t, projectId || undefined);
    setTitle("");
  };

  return (
    <div className="w-full md:w-[620px] md:ml-auto flex items-center gap-3 bg-white border border-neutral-200 rounded-xl px-3 py-2 shadow-sm">
      <input
        className="flex-1 h-11 text-sm px-3 rounded-lg outline-none placeholder:text-neutral-400"
        placeholder="Quick task…"
        aria-label="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
      />
      <select
        className="h-11 text-sm px-3 rounded-lg border border-neutral-200 bg-white"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        aria-label="Project"
        title="Select project"
      >
        <option value="">No Project</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.icon || "📁"} {p.name}
          </option>
        ))}
      </select>
      <button
        onClick={go}
        disabled={!title.trim()}
        className="h-11 text-sm px-4 rounded-lg bg-black text-white disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed hover:opacity-90 active:scale-[.99]"
      >
        Add
      </button>
    </div>
  );
}
