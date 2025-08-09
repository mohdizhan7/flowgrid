import { Priority, TaskStatus } from "./types";

export const fmtDate = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const humanDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");
export const trunc = (s?: string, n = 36) => (s ? (s.length > n ? s.slice(0, n) + "…" : s) : "—");

export function mdToHtml(md = "") {
  let html = md;
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html
    .replace(/^\s*###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^\s*##\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^\s*#\s+(.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^(?:\s*[-*]\s+.+(?:\n|$))+?/gm, (block) => {
    const items = block
      .trim()
      .split(/\n/)
      .filter(Boolean)
      .map((line) => line.replace(/^\s*[-*]\s+/, ""))
      .map((txt) => `<li>${txt}</li>`)
      .join("");
    return `<ul class="ml-5 list-disc">${items}</ul>`;
  });
  html = html.replace(/^(?:\s*\d+\.\s+.+(?:\n|$))+?/gm, (block) => {
    const items = block
      .trim()
      .split(/\n/)
      .filter(Boolean)
      .map((line) => line.replace(/^\s*\d+\.\s+/, ""))
      .map((txt) => `<li>${txt}</li>`)
      .join("");
    return `<ol class="ml-5 list-decimal">${items}</ol>`;
  });
  html = html.replace(/^(?!\s*(?:[#-]|\d+\. ))(.+\S.*)$/gm, "<p>$1</p>");
  return html.replace(/\n/g, "<br/>");
}

export const statusColor: Record<TaskStatus, string> = {
  Backlog: "bg-neutral-200 text-neutral-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Blocked: "bg-orange-100 text-orange-800",
  Review: "bg-purple-100 text-purple-800",
  Done: "bg-green-100 text-green-800",
};

export const priorityColor: Record<Priority, string> = {
  Low: "bg-slate-100 text-slate-800",
  Medium: "bg-sky-100 text-sky-800",
  High: "bg-amber-100 text-amber-800",
  Urgent: "bg-rose-100 text-rose-800",
};

