
"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { loadProjects, loadTasks, saveProjects, saveTasks } from "../lib/storage";

/* ===========================
   Flowgrid v1.5 — Canvas Build (No Persistence)
   This Next.js page is fully client-side and keeps state in memory.
   =========================== */

/* ---------- UI tokens & primitives ---------- */
const TOK = {
  bg: "bg-neutral-50",
  text: "text-neutral-900",
  card: "bg-white border border-neutral-200 rounded-2xl shadow-lg",
  label: "text-xs text-neutral-600",
  select: "px-3 py-2 pr-9 rounded-xl border border-neutral-200 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-black/10",
  input: "px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-black/10",
  btn: "px-3 py-2 rounded-xl shadow hover:opacity-90 active:scale-[.99] bg-black text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black/10",
  badge: "text-xs px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200",
};

function Button(p: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = p;
  return <button {...rest} className={`${TOK.btn} ${className}`} />;
}
function Input(p: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = p;
  return <input {...rest} className={`${TOK.input} ${className}`} />;
}
function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = p;
  return <textarea {...rest} className={`${TOK.input} ${className}`} />;
}
function Select(p: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = p;
  return <select {...rest} className={`${TOK.select} ${className}`} />;
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className={TOK.badge}>{children}</span>;
}
function Card(p: React.HTMLAttributes<HTMLDivElement>) {
  const { className = "", ...rest } = p;
  return <div {...rest} className={`${TOK.card} p-4 ${className}`} />;
}
function Logo({ className = "" }) {
  return (
    <svg viewBox="0 0 128 128" className={className} xmlns="http://www.w3.org/2000/svg" aria-label="Flowgrid logo" role="img">
      <rect x="8" y="8" width="112" height="112" rx="28" fill="currentColor" />
      <path d="M36 84c12-20 44-20 56 0" stroke="white" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx="36" cy="84" r="6" fill="white" />
      <circle cx="64" cy="64" r="6" fill="white" />
      <circle cx="92" cy="84" r="6" fill="white" />
    </svg>
  );
}
function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="h-2 w-full rounded-full bg-neutral-200">
      <div className="h-2 rounded-full bg-black transition-all" style={{ width: `${v}%` }} />
    </div>
  );
}

/* ---------- Global animations (cheap) ---------- */
function GlobalStyles() {
  return (
    <style>{`
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      .ani-fade { animation: fadeIn .4s ease-out both; }
      .ani-up { animation: fadeInUp .5s ease-out both; }
    `}</style>
  );
}

/* ---------- Helpers ---------- */
const fmtDate = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const humanDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");
const trunc = (s?: string, n = 36) => (s ? (s.length > n ? s.slice(0, n) + "…" : s) : "—");

function mdToHtml(md = "") {
  let html = md;
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html
    .replace(/^\s*###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^\s*##\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^\s*#\s+(.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^(?:\\s*[-*]\\s+.+(?:\\n|$))+?/gm, (block) => {
    const items = block
      .trim()
      .split(/\\n/)
      .filter(Boolean)
      .map((line) => line.replace(/^\\s*[-*]\\s+/, ""))
      .map((txt) => `<li>${txt}</li>`)
      .join("");
    return `<ul class="ml-5 list-disc">${items}</ul>`;
  });
  html = html.replace(/^(?:\\s*\\d+\\.\\s+.+(?:\\n|$))+?/gm, (block) => {
    const items = block
      .trim()
      .split(/\\n/)
      .filter(Boolean)
      .map((line) => line.replace(/^\\s*\\d+\\.\\s+/, ""))
      .map((txt) => `<li>${txt}</li>`)
      .join("");
    return `<ol class="ml-5 list-decimal">${items}</ol>`;
  });
  html = html.replace(/^(?!\\s*(?:[#-]|\\d+\\. ))(.+\\S.*)$/gm, "<p>$1</p>");
  return html.replace(/\\n/g, "<br/>");
}

/* ---------- Domain types ---------- */
type ProjectStatus = "Planned" | "Active" | "On Hold" | "Done" | "Archived";
type TaskStatus = "Backlog" | "In Progress" | "Blocked" | "Review" | "Done";
type Priority = "Low" | "Medium" | "High" | "Urgent";

type Project = {
  id: string;
  name: string;
  icon?: string;
  status: ProjectStatus;
  dueDate?: string;
  tags: string[];
  description?: string;
};
type ChecklistItem = { id: string; label: string; done: boolean };
type Task = {
  id: string;
  projectId?: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  points?: number;
  dueDate?: string | null;
  assignees: string[];
  tags: string[];
  description?: string;
  checklist: ChecklistItem[];
  done?: boolean;
  date?: string | null;
  completionDate?: string | null;
  escalations?: boolean;
  delay?: boolean;
  proactiveSteps?: string;
  toolsUsed?: string[];
  stakeholderFeedback?: string;
  lessonsLearned?: string;
  delivery?: number;
  createdAt: string;
  updatedAt: string;
};

/* ---------- Color chips ---------- */
const statusColor: Record<TaskStatus, string> = {
  Backlog: "bg-neutral-200 text-neutral-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Blocked: "bg-orange-100 text-orange-800",
  Review: "bg-purple-100 text-purple-800",
  Done: "bg-green-100 text-green-800",
};
const priorityColor: Record<Priority, string> = {
  Low: "bg-slate-100 text-slate-800",
  Medium: "bg-sky-100 text-sky-800",
  High: "bg-amber-100 text-amber-800",
  Urgent: "bg-rose-100 text-rose-800",
};

/* ---------- Sample data ---------- */
function addDays(n: number) { return new Date(Date.now() + n * 86400000).toISOString(); }
const nowIso = () => new Date().toISOString();
const seedProjects: Project[] = [
  { id: "p1", name: "ITC Dairy – SB TMS Pilot", icon: "🐄", status: "Active", dueDate: addDays(21), tags: ["TMS", "Q3"], description: "Kickoff, config, UAT, go‑live.\\n- Fleet setup\\n- Trip rules\\n- KPIs" },
  { id: "p2", name: "P&G DC – Pick Optimisation", icon: "📦", status: "Planned", dueDate: addDays(35), tags: ["WMS", "Ops"], description: "Reduce split picks, improve wave fill." },
  { id: "p3", name: "CRF Philippines – Reporting", icon: "📊", status: "Active", dueDate: addDays(14), tags: ["Analytics"], description: "Daily CRF dashboard + alerts." },
];
function t(id: string, pid: string, title: string, status: TaskStatus, prio: Priority, due: string,
  opts?: { points?: number; tools?: string[]; steps?: string; done?: boolean; completion?: string; escalations?: boolean; }): Task {
  return {
    id, projectId: pid, title, status, priority: prio,
    points: opts?.points ?? 1, dueDate: due, assignees: ["Me"], tags: [], description: "", checklist: [],
    done: opts?.done ?? (status === "Done"), date: nowIso(), completionDate: opts?.completion ?? (status === "Done" ? nowIso() : null),
    escalations: !!opts?.escalations, delay: false, proactiveSteps: opts?.steps ?? "", toolsUsed: opts?.tools ?? [],
    stakeholderFeedback: "", lessonsLearned: "", delivery: 0, createdAt: nowIso(), updatedAt: nowIso(),
  };
}
const seedTasks: Task[] = [
  t("t1", "p1", "Configure trip assignment rules", "In Progress", "High", addDays(5), { points: 3, tools: ["Sheets"], steps: "Review SLA → model rules" }),
  t("t2", "p1", "Carrier onboarding pack", "Backlog", "Medium", addDays(9), { points: 2, tools: ["Docs"], steps: "Checklist + sample trips" }),
  t("t3", "p1", "Run UAT Day‑in‑Life", "Review", "High", addDays(2), { points: 5, tools: ["Jira"], steps: "Scenarios → sign‑off" }),
  t("t4", "p2", "Analyze pick splits on RA bins", "In Progress", "High", addDays(6), { points: 3, tools: ["SQL", "Metabase"] }),
  t("t5", "p2", "Wave fill simulation", "Backlog", "Medium", addDays(12), { tools: ["Python"], steps: "Heuristics vs capacity" }),
  t("t6", "p3", "Define CRF KPI spec", "Done", "Medium", addDays(-1), { done: true, completion: addDays(-1), tools: ["Docs"] }),
  t("t7", "p3", "Alerting thresholds", "Blocked", "Urgent", addDays(1), { escalations: true, tools: ["Slack"], steps: "Define red/amber levels" }),
  t("t8", "p3", "Dashboard layout V1", "Backlog", "Low", addDays(10), { tools: ["PPT"], steps: "Mobile‑first cards" }),
];

/* ---------- Charts (SVG, no libs) ---------- */
function MiniBar({ data }: { data: number[] }) {
  const w = 220, h = 40, pad = 6, max = Math.max(1, ...data), bw = (w - pad * 2) / data.length;
  return (
    <svg width={w} height={h} className="mt-2">
      {data.map((v, i) => {
        const bh = (v / max) * (h - pad * 2);
        return <rect key={i} x={pad + i * bw} y={h - pad - bh} width={bw - 4} height={bh} rx={3} className="fill-green-600" />;
      })}
    </svg>
  );
}
function MiniLine({ data }: { data: number[] }) {
  const w = 220, h = 48, pad = 6, max = Math.max(1, ...data);
  const points = data.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1 || 1);
    const y = h - pad - (v / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="mt-2">
      <polyline points={points} fill="none" stroke="currentColor" className="text-green-600" strokeWidth="2" />
      {data.map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / (data.length - 1 || 1);
        const y = h - pad - (v / max) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r={2} className="fill-green-600" />;
      })}
    </svg>
  );
}
function MiniPie({ values, labels }: { values: number[]; labels: string[] }) {
  const total = Math.max(1, values.reduce((a, b) => a + b, 0));
  const colors = ["#9CA3AF", "#60A5FA", "#F59E0B", "#A78BFA", "#34D399"];
  let a = 0; const r = 34, cx = 40, cy = 40;
  return (
    <div className="flex items-center gap-4">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {values.map((v, i) => {
          const frac = v / total, angle = frac * Math.PI * 2;
          const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
          const x2 = cx + r * Math.cos(a + angle), y2 = cy + r * Math.sin(a + angle);
          const large = angle > Math.PI ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
          a += angle; return <path key={i} d={d} fill={colors[i % colors.length]} />;
        })}
      </svg>
      <div className="grid gap-1">
        {labels.map((l, i) => (
          <div key={l} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="w-28">{l}</span>
            <span className="text-neutral-500">{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function MiniStack({ series, colors }: { series: number[][]; colors: string[] }) {
  const w = 220, h = 48, pad = 6, days = series[0]?.length || 0;
  const sums = Array.from({ length: days }).map((_, i) => series.reduce((acc, s) => acc + (s[i] || 0), 0));
  const bw = (w - pad * 2) / (days || 1);
  return (
    <svg width={w} height={h} className="mt-2">
      {Array.from({ length: days }).map((_, day) => {
        const total = Math.max(1, sums[day]); let yCursor = h - pad;
        return series.map((s, si) => {
          const frac = (s[day] || 0) / total; const bh = frac * (h - pad * 2);
          yCursor -= bh;
          return <rect key={`${day}-${si}`} x={pad + day * bw} y={yCursor} width={bw - 4} height={bh} rx={2} fill={colors[si % colors.length]} />;
        });
      })}
    </svg>
  );
}
function PriorityDonut({ counts }: { counts: Record<Priority, number> }) {
  const vals = (["Low", "Medium", "High", "Urgent"] as Priority[]).map((k) => counts[k] || 0);
  const total = Math.max(1, vals.reduce((a, b) => a + b, 0));
  const cols = ["#94a3b8", "#38bdf8", "#f59e0b", "#f43f5e"];
  let a = -Math.PI / 2; const r = 36, cx = 40, cy = 40;
  return (
    <div className="flex items-center gap-4">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {vals.map((v, i) => {
          const frac = v / total, angle = frac * 2 * Math.PI;
          const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
          const x2 = cx + r * Math.cos(a + angle), y2 = cy + r * Math.sin(a + angle);
          const large = angle > Math.PI ? 1 : 0;
          const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
          a += angle; return <path key={i} d={d} fill={cols[i]} />;
        })}
      </svg>
      <div className="grid gap-1">
        {(["Low", "Medium", "High", "Urgent"] as Priority[]).map((p, i) => (
          <div key={p} className="flex items-center gap-2 text-sm">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: cols[i] }} />
            <span className="w-20">{p}</span>
            <span className="text-neutral-500">{counts[p] || 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Command Palette (trim demo) ---------- */
function CommandPalette({ open, onClose, onRun, projects }:{ open:boolean; onClose:()=>void; onRun:(cmd:string,arg?:string)=>void; projects: Project[] }){
  const [q,setQ]=useState("");
  const items = useMemo(()=>{
    const base=[
      {id:"new-task", label:"New Task", run:()=>onRun("new-task")},
      {id:"go-dashboard", label:"Go: Dashboard", run:()=>onRun("go-dashboard")},
      {id:"go-projects", label:"Go: Projects", run:()=>onRun("go-projects")},
      {id:"go-tasks", label:"Go: All Tasks", run:()=>onRun("go-tasks")},
    ];
    const proj = projects.map(p=> ({id:"open-"+p.id,label:`Open Project: ${p.name}`, run:()=>onRun("open-project", p.id)}));
    return [...base,...proj].filter(x=> x.label.toLowerCase().includes(q.toLowerCase()));
  },[q,projects,onRun]);
  if(!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-start p-4 z-50" onClick={(e)=> e.currentTarget===e.target && onClose()}>
      <div className="w-[min(720px,92vw)] mx-auto mt-24 rounded-2xl bg-white border border-neutral-200 shadow-2xl">
        <div className="p-3 border-b border-neutral-200"><Input autoFocus placeholder="Type a command…" value={q} onChange={e=> setQ(e.target.value)} /></div>
        <div className="max-h-[50vh] overflow-auto">
          {items.map(i=> <button key={i.id} onClick={()=>{i.run(); onClose();}} className="w-full text-left px-4 py-2 hover:bg-neutral-50">{i.label}</button>)}
          {items.length===0 && <div className="px-4 py-6 text-neutral-500 text-sm">No results</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Nav with notifications ---------- */
function NavBar({ current, onNavigate, projects, onQuickGo, notifications }:{
  current: string; onNavigate:(id:string)=>void; projects:Project[]; onQuickGo:(id:string)=>void; notifications:string[];
}){
  const [open,setOpen]=useState(false);
  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
        <div className="flex items-center gap-3 mr-3">
          <div className="h-10 w-10 rounded-2xl bg-black flex items-center justify-center text-white"><Logo className="h-6 w-6 text-white" /></div>
          <div className="text-xl font-semibold">Flowgrid</div>
        </div>
        <div className="flex gap-2">
          {[{id:"dashboard",label:"Dashboard"},{id:"projects",label:"Projects"},{id:"tasks",label:"All Tasks"}].map(x=> (
            <Button key={x.id} onClick={()=>onNavigate(x.id)} className={current===x.id? '' : 'opacity-80'}>{x.label}</Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select onChange={(e)=> e.target.value && onQuickGo(e.target.value)} defaultValue=""><option value="" disabled>Quick open project…</option>{projects.map(p=> <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}</Select>
          <div className="relative">
            <Button onClick={()=> setOpen(s=>!s)} aria-label="Notifications">🔔</Button>
            {notifications.length>0 && (<span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[11px] grid place-items-center">{notifications.length}</span>)}
            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-xl shadow-xl p-2">
                <div className="text-sm font-semibold px-2 py-1">Notifications</div>
                {notifications.length===0 && <div className="text-sm text-neutral-500 px-2 py-2">No new alerts</div>}
                {notifications.map((n,i)=> <div key={i} className="px-2 py-2 text-sm border-t border-neutral-100">{n}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Projects index ---------- */
function ProjectsIndex({ projects, progress, onOpen, onNew }:{ projects:Project[]; progress: Record<string,{pct:number;tasksDone:number;tasksTotal:number}>; onOpen:(id:string)=>void; onNew:()=>void; }){
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Projects</div>
        <Button onClick={onNew}>New Project</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        {projects.map(p=>{
          const pr = progress[p.id] || {pct:0,tasksDone:0,tasksTotal:0};
          const state = pr.pct>=100? "bg-purple-100 text-purple-800" : pr.pct>=70? "bg-green-100 text-green-800" : pr.pct>=40? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-800";
          return (
            <Card key={p.id} className="cursor-pointer hover:shadow-xl transition-shadow" onClick={()=> onOpen(p.id)}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">{p.icon || "📁"}</div>
                <div className="font-semibold">{p.name}</div>
                <div className="ml-auto"><span className={`text-xs px-2 py-1 rounded-full ${state}`}>{p.status}</span></div>
              </div>
              <div className="mt-2 text-xs text-neutral-500">Due {humanDate(p.dueDate)}</div>
              <div className="mt-3"><Progress value={pr.pct} /></div>
              <div className="mt-2 text-xs">{pr.tasksDone}/{pr.tasksTotal} tasks</div>
              <div className="mt-2 flex gap-2 flex-wrap">{(p.tags||[]).map(t=> <span key={t} className="text-xs px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200">{t}</span>)}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Project page (Board/List/Calendar/Timeline) ---------- */
function ProjectPage({ project, tasks, onBack, onSaveProject, onAddTask, onOpenTask, onUpdateTask }:{ project:Project; tasks:Task[]; onBack:()=>void; onSaveProject:(p:Project)=>void; onAddTask:(title:string)=>void; onOpenTask:(t:Task)=>void; onUpdateTask:(t:Task)=>void; }){
  const [draft,setDraft]=useState(project);
  const [view,setView]=useState<"Board"|"List"|"Calendar"|"Timeline">("Board");
  useEffect(()=> setDraft(project),[project?.id]);
  const linked = tasks.filter(t=> t.projectId===project.id);
  const [newTitle,setNewTitle]=useState("");

  const byStatus = useMemo(()=>{
    const m: Record<TaskStatus,Task[]> = { Backlog:[], "In Progress":[], Blocked:[], Review:[], Done:[] };
    for(const t of linked) m[t.status]?.push(t);
    return m;
  },[linked]);

  return (
    <div className="mt-6">
      <Card>
        <div className="flex items-center gap-3">
          <div className="text-2xl">{draft.icon || "📁"}</div>
          <Input value={draft.name} onChange={e=> setDraft({...draft,name:e.target.value})} className="font-semibold" />
          <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200">{draft.status}</span>
          <div className="ml-auto flex items-center gap-2">
            <Select value={view} onChange={e=> setView(e.target.value as any)}>
              {["Board","List","Calendar","Timeline"].map(v=> <option key={v}>{v}</option>)}
            </Select>
            <Button className="bg-neutral-700" onClick={onBack}>Back</Button>
            <Button onClick={()=> onSaveProject(draft)}>Save</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <div className="flex flex-col gap-1"><div className={TOK.label}>Status</div>
            <Select value={draft.status} onChange={e=> setDraft({...draft,status:e.target.value as ProjectStatus})}>{["Planned","Active","On Hold","Done","Archived"].map(s=> <option key={s}>{s}</option>)}</Select>
          </div>
          <div className="flex flex-col gap-1"><div className={TOK.label}>Due</div>
            <Input type="date" value={fmtDate(draft.dueDate)} onChange={e=> setDraft({...draft,dueDate:e.target.value || undefined})} />
          </div>
          <div className="flex flex-col gap-1"><div className={TOK.label}>Tags (comma)</div>
            <Input value={(draft.tags||[]).join(", ")} onChange={e=> setDraft({...draft,tags:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} />
          </div>
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1"><div className={TOK.label}>Description (Markdown)</div>
              <Textarea rows={5} value={draft.description||""} onChange={e=> setDraft({...draft,description:e.target.value})} />
            </div>
            <div className="rounded-xl border border-neutral-200 p-3">
              <div className="text-xs text-neutral-500 mb-1">Preview</div>
              <div className="prose prose-sm" dangerouslySetInnerHTML={{__html: mdToHtml(draft.description||"")}} />
            </div>
          </div>
        </div>
      </Card>

      {view==="Board" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 transition-all">
          {(["Backlog","In Progress","Blocked","Review","Done"] as TaskStatus[]).map(col=> (
            <div key={col} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{col}</div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[col]}`}>{byStatus[col].length}</span>
              </div>
              <div className="flex flex-col gap-3">
                {byStatus[col].map(t=> (
                  <div key={t.id} className="rounded-xl border border-neutral-200 bg-white p-3 cursor-pointer hover:shadow transition" onClick={()=> onOpenTask(t)}>
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full ${priorityColor[t.priority]}`}>{t.priority}</span>
                      {!!t.points && <Badge>{t.points}pt</Badge>}
                      {t.dueDate && <Badge>Due {humanDate(t.dueDate)}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view==="List" && (
        <Card className="mt-4 overflow-x-auto transition-all">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-neutral-600">
              <th className="py-2 pr-3">Title</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Priority</th><th className="py-2 pr-3">Deadline</th><th className="py-2 pr-3">Delivery</th>
            </tr></thead>
            <tbody>
              {linked.map(t=> (
                <tr key={t.id} className="border-t border-neutral-200">
                  <td className="py-2 pr-3"><button className="underline" onClick={()=> onOpenTask(t)}>{t.title}</button></td>
                  <td className="py-2 pr-3"><Select value={t.status} onChange={e=> onUpdateTask({...t,status:e.target.value as TaskStatus})}>{(["Backlog","In Progress","Blocked","Review","Done"] as TaskStatus[]).map(s=> <option key={s}>{s}</option>)}</Select></td>
                  <td className="py-2 pr-3"><Select value={t.priority} onChange={e=> onUpdateTask({...t,priority:e.target.value as Priority})}>{(["Low","Medium","High","Urgent"] as Priority[]).map(p=> <option key={p}>{p}</option>)}</Select></td>
                  <td className="py-2 pr-3"><Input type="date" value={fmtDate(t.dueDate || undefined)} onChange={e=> onUpdateTask({...t,dueDate:e.target.value || null})} /></td>
                  <td className="py-2 pr-3"><Select value={String(t.delivery || 0)} onChange={e=> onUpdateTask({...t,delivery:Number(e.target.value)})}>{[0,1,2,3,4,5].map(n=> <option key={n}>{n}</option>)}</Select></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {view==="Calendar" && (
        <Card className="mt-4 transition-all">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({length:7}).map((_,i)=>{
              const day = new Date(); day.setDate(day.getDate()+i);
              const k = day.toDateString();
              const todays = linked.filter(t=> t.dueDate && new Date(t.dueDate).toDateString()===k);
              return (
                <div key={i} className="rounded-xl border border-neutral-200 p-2">
                  <div className="text-xs text-neutral-500">{day.toLocaleDateString()}</div>
                  {todays.map(t=> <div key={t.id} className="mt-1 text-sm underline cursor-pointer" onClick={()=> onOpenTask(t)}>{t.title}</div>)}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {view==="Timeline" && (
        <Card className="mt-4 transition-all">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[160px_repeat(14,1fr)] gap-2 items-center">
                <div></div>
                {Array.from({length:14}).map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()+i); return <div key={i} className="text-xs text-neutral-500 text-center">{d.getMonth()+1}/{d.getDate()}</div>; })}
                {linked.map(t=>{ const start=new Date(t.date || t.createdAt); const end=new Date(t.dueDate || t.completionDate || t.date || start); const span=Math.max(1, Math.round((+end-+start)/86400000)); const offset=Math.max(0, Math.round((+start-+new Date())/86400000)); return (
                  <React.Fragment key={t.id}>
                    <div className="text-sm">{t.title}</div>
                    <div className="col-span-14">
                      <div className="relative h-6">
                        <div className="absolute top-2 h-2 rounded-full bg-black" style={{ left: `${(offset/14)*100}%`, width: `${(Math.min(span,14)/14)*100}%` }} title={`${humanDate(t.date)} → ${humanDate(t.dueDate || t.completionDate)}`} />
                      </div>
                    </div>
                  </React.Fragment>
                ); })}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Quick Add</div>
          <QuickAdd onAdd={onAddTask} />
        </div>
      </Card>
    </div>
  );
}

/* ---------- All Tasks ---------- */
function TaskSheet({ tasks, projects, onEdit }:{ tasks:Task[]; projects:Project[]; onEdit:(t:Task)=>void; }){
  const [columns,setColumns]=useState({title:true,project:true,done:true,date:true,due:true,completion:true,priority:true,status:true,escalations:true,delay:true,delivery:true,tools:true,steps:true,feedback:true,lessons:true});
  const [views,setViews]=useState([{id:"default",name:"Default",query:{} as any}]);
  const [activeView,setActiveView]=useState("default");
  const [filters,setFilters]=useState<{project:string;status:string;priority:string;q:string}>({project:"",status:"",priority:"",q:""});

  useEffect(()=>{ const v=views.find(v=> v.id===activeView); if(v?.query) setFilters({project:"",status:"",priority:"",q:"",...v.query}); },[activeView]);

  const filtered = useMemo(()=>{
    return tasks.filter(t=>{
      if(filters.project && t.projectId!==filters.project) return false;
      if(filters.status && t.status!==filters.status) return false;
      if(filters.priority && t.priority!==filters.priority) return false;
      if(filters.q){ const hay=[t.title,t.description||"", (t.tags||[]).join(" "), (t.toolsUsed||[]).join(" "), t.proactiveSteps||"", t.stakeholderFeedback||"", t.lessonsLearned||""].join(" ").toLowerCase(); if(!hay.includes(filters.q.toLowerCase())) return false; }
      return true;
    });
  },[tasks,filters]);

  const saveView = ()=>{ const name=prompt("Name this view"); if(!name) return; const id = name.toLowerCase().replace(/[^a-z0-9]+/g,"-"); setViews(prev=> [...prev.filter(v=> v.id!==id), {id, name, query: filters}]); setActiveView(id); };
  const delView = ()=>{ if(activeView==="default") return; setViews(prev=> prev.filter(v=> v.id!==activeView)); setActiveView("default"); };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">All Tasks</div>
        <div className="flex items-center gap-2">
          <Select value={activeView} onChange={e=> setActiveView(e.target.value)}>{views.map(v=> <option key={v.id} value={v.id}>{v.name}</option>)}</Select>
          <Button onClick={saveView}>Save view</Button>
          <Button className="bg-neutral-700" onClick={delView} disabled={activeView==="default"}>Delete view</Button>
        </div>
      </div>

      <Card className="mt-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div className="flex flex-col gap-1"><div className={TOK.label}>Project</div><Select value={filters.project} onChange={e=> setFilters({...filters,project:e.target.value})}><option value="">All</option>{projects.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
          <div className="flex flex-col gap-1"><div className={TOK.label}>Status</div><Select value={filters.status} onChange={e=> setFilters({...filters,status:e.target.value})}><option value="">All</option>{(["Backlog","In Progress","Blocked","Review","Done"] as TaskStatus[]).map(s=> <option key={s}>{s}</option>)}</Select></div>
          <div className="flex flex-col gap-1"><div className={TOK.label}>Priority</div><Select value={filters.priority} onChange={e=> setFilters({...filters,priority:e.target.value})}><option value="">All</option>{(["Low","Medium","High","Urgent"] as Priority[]).map(p=> <option key={p}>{p}</option>)}</Select></div>
          <div className="flex flex-col gap-1 md:col-span-2"><div className={TOK.label}>Search</div><Input placeholder="Title, tags, tools, notes…" value={filters.q} onChange={e=> setFilters({...filters,q:e.target.value})} /></div>
        </div>
      </Card>

      <Card className="mt-3">
        <div className="flex flex-wrap gap-2 items-center">
          {Object.keys(columns).map(k=> (
            <label key={k} className="text-xs flex items-center gap-1 border rounded-full px-2 py-1">
              <input type="checkbox" checked={(columns as any)[k]} onChange={e=> setColumns({...(columns as any), [k]: e.target.checked})} />
              <span>{k}</span>
            </label>
          ))}
          <Button onClick={()=> setColumns(Object.fromEntries(Object.keys(columns).map(k=> [k,true])) as any)}>Show all</Button>
          <Button className="bg-neutral-700" onClick={()=> setColumns(Object.fromEntries(Object.keys(columns).map(k=> [k,false])) as any)}>Hide all</Button>
        </div>
      </Card>

      <Card className="mt-3 overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="sticky top-0 bg-white">
            <tr className="text-left text-neutral-600">
              {(columns as any).title && <th className="py-2 pr-3">Title</th>}
              {(columns as any).project && <th className="py-2 pr-3">Project</th>}
              {(columns as any).done && <th className="py-2 pr-3">Done</th>}
              {(columns as any).date && <th className="py-2 pr-3">Date</th>}
              {(columns as any).due && <th className="py-2 pr-3">Deadline</th>}
              {(columns as any).completion && <th className="py-2 pr-3">Completion</th>}
              {(columns as any).priority && <th className="py-2 pr-3">Priority</th>}
              {(columns as any).status && <th className="py-2 pr-3">Status</th>}
              {(columns as any).escalations && <th className="py-2 pr-3">Escalations</th>}
              {(columns as any).delay && <th className="py-2 pr-3">Delay</th>}
              {(columns as any).delivery && <th className="py-2 pr-3">Delivery</th>}
              {(columns as any).tools && <th className="py-2 pr-3">Tools</th>}
              {(columns as any).steps && <th className="py-2 pr-3">Proactive Steps</th>}
              {(columns as any).feedback && <th className="py-2 pr-3">Stakeholder Feedback</th>}
              {(columns as any).lessons && <th className="py-2 pr-3">Lessons Learned</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t=> (
              <tr key={t.id} className="border-t border-neutral-200">
                {(columns as any).title && <td className="py-2 pr-3"><button className="underline" onClick={()=> onEdit(t)}>{t.title}</button></td>}
                {(columns as any).project && <td className="py-2 pr-3">{projects.find(p=> p.id===t.projectId)?.name || "—"}</td>}
                {(columns as any).done && <td className="py-2 pr-3"><input type="checkbox" checked={!!t.done} readOnly/></td>}
                {(columns as any).date && <td className="py-2 pr-3">{humanDate(t.date || undefined)}</td>}
                {(columns as any).due && <td className="py-2 pr-3">{humanDate(t.dueDate || undefined)}</td>}
                {(columns as any).completion && <td className="py-2 pr-3">{humanDate(t.completionDate || undefined)}</td>}
                {(columns as any).priority && <td className="py-2 pr-3"><span className={`text-xs px-2 py-1 rounded-full ${priorityColor[t.priority]}`}>{t.priority}</span></td>}
                {(columns as any).status && <td className="py-2 pr-3"><span className={`text-xs px-2 py-1 rounded-full ${statusColor[t.status]}`}>{t.status}</span></td>}
                {(columns as any).escalations && <td className="py-2 pr-3">{t.escalations? "Yes":"No"}</td>}
                {(columns as any).delay && <td className="py-2 pr-3">{t.delay? "Yes":"No"}</td>}
                {(columns as any).delivery && <td className="py-2 pr-3">{t.delivery ?? 0}</td>}
                {(columns as any).tools && <td className="py-2 pr-3">{(t.toolsUsed||[]).join(", ")||"—"}</td>}
                {(columns as any).steps && <td className="py-2 pr-3" title={t.proactiveSteps||""}>{trunc(t.proactiveSteps, 48)}</td>}
                {(columns as any).feedback && <td className="py-2 pr-3" title={t.stakeholderFeedback||""}>{trunc(t.stakeholderFeedback, 48)}</td>}
                {(columns as any).lessons && <td className="py-2 pr-3" title={t.lessonsLearned||""}>{trunc(t.lessonsLearned, 48)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------- Task modal ---------- */
function TaskModal({ task, projects, onSave, onDelete, onClose }:{ task:Task|null; projects:Project[]; onSave:(t:Task)=>void; onDelete:(id:string)=>void; onClose:()=>void; }){
  const [draft,setDraft]=useState<Task|null>(task);
  useEffect(()=> setDraft(task),[task?.id]);
  const patch=(k: keyof Task, v:any)=> setDraft(prev=> prev? ({...prev,[k]:v, updatedAt:new Date().toISOString()}): prev);
  const addChecklist=(label:string)=> patch("checklist",[...(draft?.checklist||[]),{id:Math.random().toString(36).slice(2), label, done:false}]);
  if(!draft) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center p-4 z-50" role="dialog" aria-modal="true" onClick={(e)=> e.currentTarget===e.target && onClose()}>
      <div className="w-[min(960px,92vw)] rounded-2xl bg-white border border-neutral-200 p-4 shadow-2xl max-h-[88vh] overflow-auto">
        <div className="flex items-center justify-between gap-3">
          <input value={draft.title} onChange={e=> patch("title", e.target.value)} className="w-full text-xl font-semibold bg-transparent outline-none" />
          <div className="flex items-center gap-2">
            <Button className="bg-red-600" onClick={()=> onDelete(draft.id)}>Delete</Button>
            <Button onClick={onClose}>Close</Button>
            <Button onClick={()=> onSave(draft)}>Save</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2"><input type="checkbox" checked={!!draft.done} onChange={(e)=> patch("done", e.target.checked)} /><span className="text-sm">Done</span></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex flex-col gap-1"><div className={TOK.label}>Date</div><Input type="date" value={fmtDate(draft.date || undefined)} onChange={e=> patch("date", e.target.value || null)} /></div>
              <div className="flex flex-col gap-1"><div className={TOK.label}>Deadline</div><Input type="date" value={fmtDate(draft.dueDate || undefined)} onChange={e=> patch("dueDate", e.target.value || null)} /></div>
              <div className="flex flex-col gap-1"><div className={TOK.label}>Completion</div><Input type="date" value={fmtDate(draft.completionDate || undefined)} onChange={e=> patch("completionDate", e.target.value || null)} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              <div className="flex flex-col gap-1"><div className={TOK.label}>Proactive Steps</div><Textarea rows={3} value={draft.proactiveSteps || ""} onChange={e=> patch("proactiveSteps", e.target.value)} /></div>
              <div className="flex flex-col gap-1"><div className={TOK.label}>Stakeholder Feedback</div><Textarea rows={3} value={draft.stakeholderFeedback || ""} onChange={e=> patch("stakeholderFeedback", e.target.value)} /></div>
            </div>
            <div className="flex flex-col gap-1"><div className={TOK.label}>Lessons Learned</div><Textarea rows={4} value={draft.lessonsLearned || ""} onChange={e=> patch("lessonsLearned", e.target.value)} /></div>
            <div className="mt-3 text-xs text-neutral-500">Checklist</div>
            <div className="flex flex-col gap-2">
              {(draft.checklist || []).map(c=> (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={c.done} onChange={()=> patch("checklist", (draft.checklist||[]).map(x=> x.id===c.id? {...x,done:!x.done}: x))} />
                  <span>{c.label}</span>
                </label>
              ))}
              <div className="flex gap-2">
                <Input id="new-check" placeholder="Add item" onKeyDown={e=>{ const val=(e.currentTarget.value||"").trim(); if(e.key==="Enter" && val){ addChecklist(val); (e.currentTarget as HTMLInputElement).value=""; } }} />
                <Button onClick={()=>{ const el=document.getElementById("new-check") as HTMLInputElement|null; if(el && el.value.trim()){ addChecklist(el.value.trim()); el.value=""; } }}>Add</Button>
              </div>
            </div>
            <div className="mt-3"><div className="text-xs text-neutral-500 mb-1">Description (Markdown) — Preview</div>
              <div className="rounded-xl border border-neutral-200 p-3" dangerouslySetInnerHTML={{__html: mdToHtml(draft.description || "")}} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-xs text-neutral-500">Properties</div>
            <div className={TOK.label}>Project</div>
            <Select value={draft.projectId || ""} onChange={e=> patch("projectId", e.target.value || undefined)}>
              <option value="">Unassigned</option>{projects.map(p=> <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
            </Select>
            <div className={TOK.label}>Status</div>
            <Select value={draft.status} onChange={e=> patch("status", e.target.value as TaskStatus)}>
              {(["Backlog","In Progress","Blocked","Review","Done"] as TaskStatus[]).map(s=> <option key={s}>{s}</option>)}
            </Select>
            <div className={TOK.label}>Priority</div>
            <Select value={draft.priority} onChange={e=> patch("priority", e.target.value as Priority)}>
              {(["Low","Medium","High","Urgent"] as Priority[]).map(p=> <option key={p}>{p}</option>)}
            </Select>
            <div className={TOK.label}>Escalations</div>
            <Select value={draft.escalations ? "Yes" : "No"} onChange={e=> patch("escalations", e.target.value==="Yes")}><option>Yes</option><option>No</option></Select>
            <div className={TOK.label}>Delay</div>
            <Select value={draft.delay ? "Yes" : "No"} onChange={e=> patch("delay", e.target.value==="Yes")}><option>Yes</option><option>No</option></Select>
            <div className={TOK.label}>Delivery (1–5)</div>
            <Select value={String(draft.delivery || 0)} onChange={e=> patch("delivery", Number(e.target.value))}>{[0,1,2,3,4,5].map(n=> <option key={n}>{n}</option>)}</Select>
            <div className={TOK.label}>Tools Used (comma)</div>
            <Input value={(draft.toolsUsed || []).join(", ")} onChange={e=> patch("toolsUsed", e.target.value.split(",").map(s=> s.trim()).filter(Boolean))} />
            <div className="text-xs text-neutral-500 mt-2">Created {new Date(draft.createdAt).toLocaleString()}</div>
            <div className="text-xs text-neutral-500">Updated {new Date(draft.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- New Project modal ---------- */
function NewProjectModal({ open, onClose, onCreate }:{ open:boolean; onClose:()=>void; onCreate:(p:Project)=>void; }){
  const [name,setName]=useState(""); const [icon,setIcon]=useState("📁"); const [due,setDue]=useState(""); const [tags,setTags]=useState("");
  if(!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center p-4 z-50" role="dialog" aria-modal="true" onClick={(e)=> e.currentTarget===e.target && onClose()}>
      <div className="w-[min(560px,92vw)] rounded-2xl bg-white border border-neutral-200 p-4 shadow-2xl" aria-labelledby="new-project-title">
        <div id="new-project-title" className="text-lg font-semibold mb-3">Create a new project</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1"><div className={TOK.label}>Name</div><Input value={name} onChange={e=> setName(e.target.value)} /></div>
          <div className="flex flex-col gap-1"><div className={TOK.label}>Icon</div><Input value={icon} onChange={e=> setIcon(e.target.value)} /></div>
          <div className="flex flex-col gap-1"><div className={TOK.label}>Due</div><Input type="date" value={due} onChange={e=> setDue(e.target.value)} /></div>
          <div className="flex flex-col gap-1 md:col-span-2"><div className={TOK.label}>Tags (comma)</div><Input value={tags} onChange={e=> setTags(e.target.value)} /></div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button className="bg-neutral-700" onClick={onClose}>Cancel</Button>
          <Button onClick={()=>{
            const n=name.trim(); if(!n) return;
            onCreate({ id:Math.random().toString(36).slice(2), name:n, icon:icon||"📁", status:"Planned", dueDate: due||undefined, tags: tags.split(",").map(s=>s.trim()).filter(Boolean), description:"" });
            onClose();
          }}>Create</Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Dashboard (KPIs + Insights) ---------- */
function Dashboard({ tasks, projects, onCardFilter }:{ tasks:Task[]; projects:Project[]; onCardFilter:(q:{status?:TaskStatus; overdue?:boolean})=>void; }){
  const now = new Date();
  const weekDays = Array.from({length:7}).map((_,i)=>{ const d=new Date(); d.setDate(now.getDate()-6+i); return d; });
  const completedThisWeek = tasks.filter(t=> t.status==="Done" && t.completionDate && +new Date(t.completionDate) >= +new Date(now.toDateString()) - 6*86400000);
  const overdue = tasks.filter(t=> t.dueDate && new Date(t.dueDate) < now && t.status!=="Done");
  const daily = weekDays.map(d=> tasks.filter(t=> t.status==="Done" && t.completionDate && new Date(t.completionDate).toDateString()===d.toDateString()).length);
  const statusCounts = ["Backlog","In Progress","Blocked","Review","Done"].map(s=> tasks.filter(t=> t.status === (s as TaskStatus)).length);
  const activeProjects = projects.filter(p=> p.status==="Active").length;
  const avgCompletionDays = (()=>{
    const done = tasks.filter(t=> t.status==="Done" && t.completionDate && t.date);
    if(!done.length) return 0;
    const sum = done.reduce((acc,t)=> acc + Math.max(0,(+new Date(t.completionDate!)-+new Date(t.date!))/86400000), 0);
    return Math.round((sum/done.length)*10)/10;
  })();
  const upcoming = tasks.filter(t=> t.dueDate && new Date(t.dueDate) >= now).sort((a,b)=> +new Date(a.dueDate!) - +new Date(b.dueDate!)).slice(0,5);

  const statusKeys: TaskStatus[] = ["Backlog","In Progress","Blocked","Review","Done"];
  const weeklyStacks = statusKeys.map(s=> weekDays.map(d=> tasks.filter(t=> t.status===s && t.date && new Date(t.date).toDateString()===d.toDateString()).length));
  const priorityCounts = (["Low","Medium","High","Urgent"] as Priority[]).reduce((m,p)=> { m[p] = tasks.filter(t=> t.priority===p).length; return m; }, {} as Record<Priority,number>);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-xl transition cursor-pointer" onClick={()=> onCardFilter({})}>
          <div className="text-sm">Tasks Completed (7d)</div>
          <div className="mt-2 text-3xl font-semibold text-green-700">{completedThisWeek.length}</div>
          <MiniBar data={daily} />
        </Card>
        <Card className="hover:shadow-xl transition cursor-pointer" onClick={()=> onCardFilter({overdue:true})}>
          <div className="text-sm">Overdue Tasks</div>
          <div className="mt-2 text-3xl font-semibold text-red-600">{overdue.length}</div>
          <div className="text-xs mt-2 text-neutral-500">Click to filter</div>
        </Card>
        <Card>
          <div className="text-sm">Active Projects</div>
          <div className="mt-2 text-3xl font-semibold text-blue-700">{activeProjects}</div>
          <div className="text-xs mt-2 text-neutral-500">Across your workspace</div>
        </Card>
        <Card>
          <div className="text-sm">Avg Completion Time</div>
          <div className="mt-2 text-3xl font-semibold text-amber-600">{avgCompletionDays}d</div>
          <div className="text-xs mt-2 text-neutral-500">Rolling window</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card>
          <div className="text-sm mb-2">Tasks by Status</div>
          <MiniPie values={statusCounts} labels={["Backlog","In Progress","Blocked","Review","Done"]} />
        </Card>
        <Card className="md:col-span-2">
          <div className="text-sm mb-2">Upcoming Deadlines</div>
          {upcoming.length===0 && <div className="text-sm text-neutral-500">Nothing due soon.</div>}
          <div className="grid gap-2">
            {upcoming.map(t=> (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-neutral-200 p-2">
                <div className="text-sm">{t.title}</div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[t.status]}`}>{t.status}</span>
                  <Badge>Due {humanDate(t.dueDate || undefined)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6 ani-fade">
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-50 to-neutral-100 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-700">Insights</div>
            <div className="text-xs text-neutral-500">Last 7 days</div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="ani-up" style={{ animationDelay: "40ms" }}>
              <div className="text-sm mb-2">Completions Trend (7d)</div>
              <MiniLine data={daily} />
            </Card>
            <Card className="ani-up" style={{ animationDelay: "120ms" }}>
              <div className="text-sm mb-2">Weekly Status Mix</div>
              <MiniStack series={weeklyStacks} colors={["#9CA3AF","#60A5FA","#F59E0B","#A78BFA","#34D399"]} />
            </Card>
            <Card className="ani-up" style={{ animationDelay: "200ms" }}>
              <div className="text-sm mb-2">Priority Distribution</div>
              <PriorityDonut counts={priorityCounts} />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Quick Add ---------- */
function QuickAdd({ onAdd }:{ onAdd:(title:string)=>void }){
  const [title,setTitle]=useState("");
  return (
    <div className="flex items-center gap-2">
      <Input placeholder="Quick task" value={title} onChange={e=> setTitle(e.target.value)} onKeyDown={e=> e.key==="Enter" && title.trim() && (onAdd(title.trim()), setTitle(""))} />
      <Button onClick={()=>{ if(title.trim()){ onAdd(title.trim()); setTitle(""); } }}>Add</Button>
    </div>
  );
}

/* ---------- Footer ---------- */
function Footer(){
  return <footer className="border-t border-neutral-200 bg-white text-neutral-500 text-xs text-center py-4">Created by — Mohd. Izhan</footer>;
}

/* ---------- App page ---------- */
export default function Page(){
  const [projects,setProjects]=useState<Project[]>(() => {
    const stored = loadProjects();
    return stored.length ? stored : seedProjects;
  });
  const [tasks,setTasks]=useState<Task[]>(() => {
    const stored = loadTasks();
    return stored.length ? stored : seedTasks;
  });

  const [page,setPage]=useState<"dashboard"|"projects"|"tasks">("dashboard");
  const [activeProjectId,setActiveProjectId]=useState<string|null>(null);
  const [query,setQuery]=useState("");
  const [showTask,setShowTask]=useState<Task|null>(null);
  const [showNewProject,setShowNewProject]=useState(false);
  const [paletteOpen,setPaletteOpen]=useState(false);

  const notifications = useMemo(()=>{
    const now=new Date(); const list:string[]=[];
    for(const t of tasks){
      if(t.dueDate && new Date(t.dueDate) < now && t.status!=="Done") list.push(`Overdue: ${t.title}`);
      if(t.escalations) list.push(`Escalation flagged: ${t.title}`);
    }
    list.push("Reminder: CRF KPI review tomorrow 10:00");
    list.push("Heads-up: Carrier onboarding pack pending approvals");
    return list.slice(0,8);
  },[tasks]);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(()=>{
    function onKey(e: KeyboardEvent){
      const k=e.key.toLowerCase();
      if((e.metaKey||e.ctrlKey) && k==="k"){ e.preventDefault(); setPaletteOpen(true); }
      if(k==="g"){ (window as any).__g=true; }
      else if((window as any).__g){
        (window as any).__g=false;
        if(k==="d") setPage("dashboard");
        if(k==="p") setPage("projects");
        if(k==="t") setPage("tasks");
      }
      if(k==="n"){
        const title = prompt("New task title");
        if(title) quickAddTask(title, activeProjectId||undefined);
      }
      if(e.key==="Escape"){
        if(showTask) setShowTask(null);
        if(showNewProject) setShowNewProject(false);
        if(paletteOpen) setPaletteOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  },[showTask,showNewProject,paletteOpen,activeProjectId]);

  const visibleTasks = useMemo(()=>{
    return tasks.filter(t=>{
      if(activeProjectId && t.projectId!==activeProjectId) return false;
      if(query){
        const hay=[t.title,t.description||"", (t.tags||[]).join(" "), (t.toolsUsed||[]).join(" "), t.proactiveSteps||"", t.stakeholderFeedback||"", t.lessonsLearned||""].join(" ").toLowerCase();
        if(!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  },[tasks,activeProjectId,query]);

  const projectProgress = useMemo(()=>{
    const by: Record<string,{pct:number;tasksDone:number;tasksTotal:number}> = Object.fromEntries(projects.map(p=> [p.id,{pct:0,tasksDone:0,tasksTotal:0}]));
    for(const t of tasks){
      if(!t.projectId || !by[t.projectId]) continue;
      by[t.projectId].tasksTotal += 1;
      if(t.status==="Done" || t.done) by[t.projectId].tasksDone += 1;
    }
    for(const id of Object.keys(by)){ const x=by[id]; x.pct = x.tasksTotal ? Math.round((x.tasksDone/x.tasksTotal)*100):0; }
    return by;
  },[projects,tasks]);

  const quickAddTask = useCallback((title:string, projectId?:string)=>{
    const iso=new Date().toISOString();
    const task: Task = { id:Math.random().toString(36).slice(2), projectId, title, status:"Backlog", priority:"Medium", points:1, dueDate:addDays(7), assignees:["Me"], tags:[], description:"", checklist:[], done:false, date:iso, completionDate:null, escalations:false, delay:false, proactiveSteps:"", toolsUsed:[], stakeholderFeedback:"", lessonsLearned:"", delivery:0, createdAt:iso, updatedAt:iso };
    setTasks(prev=> [task, ...prev]);
  },[]);
  const saveTask = (updated: Task)=> setTasks(prev=> prev.map(t=> t.id===updated.id? {...updated, updatedAt:new Date().toISOString() }: t));
  const deleteTask = (id:string)=> { setTasks(prev=> prev.filter(t=> t.id!==id)); setShowTask(null); };
  const createProject = (p:Project)=> setProjects(prev=> [p,...prev]);
  const updateProject = (p:Project)=> setProjects(prev=> prev.map(x=> x.id===p.id? p: x));

  const activeProject = activeProjectId? projects.find(p=> p.id===activeProjectId)||null: null;

  const runCommand = (cmd:string,arg?:string)=>{
    if(cmd==="new-task"){ const t=prompt("Task title"); if(t) quickAddTask(t, activeProjectId||undefined); }
    if(cmd==="go-projects") setPage("projects");
    if(cmd==="go-dashboard") setPage("dashboard");
    if(cmd==="go-tasks") setPage("tasks");
    if(cmd==="open-project" && arg){ setActiveProjectId(arg); setPage("projects"); }
  };

  return (
    <main className={`min-h-screen ${TOK.bg} ${TOK.text} flex flex-col`}>
      <NavBar current={page} onNavigate={(p)=>{ setPage(p as any); if(p!=="projects") setActiveProjectId(null); }} projects={projects} onQuickGo={(id)=>{ setActiveProjectId(id); setPage("projects"); }} notifications={notifications} />
      <GlobalStyles />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Input placeholder="Search tasks… (⌘K for commands)" value={query} onChange={e=> setQuery(e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <QuickAdd onAdd={(title)=> quickAddTask(title, activeProjectId || undefined)} />
            </div>
          </div>

          {page==="dashboard" && (
            <>
              <Dashboard tasks={visibleTasks} projects={projects} onCardFilter={()=> setPage("tasks")} />
              <div className="mt-6">
                <ProjectsIndex projects={projects} progress={projectProgress} onOpen={(id)=>{ setActiveProjectId(id); setPage("projects"); }} onNew={()=> setShowNewProject(true)} />
              </div>
            </>
          )}

          {page==="projects" && (
            activeProject ? (
              <ProjectPage project={activeProject} tasks={tasks} onBack={()=> setActiveProjectId(null)} onSaveProject={(p)=> updateProject(p)} onAddTask={(title)=> quickAddTask(title, activeProject.id)} onOpenTask={(t)=> setShowTask(t)} onUpdateTask={(t)=> setTasks(prev=> prev.map(x=> x.id===t.id? t: x))} />
            ) : (
              <ProjectsIndex projects={projects} progress={projectProgress} onOpen={(id)=> setActiveProjectId(id)} onNew={()=> setShowNewProject(true)} />
            )
          )}

          {page==="tasks" && <TaskSheet tasks={visibleTasks} projects={projects} onEdit={(t)=> setShowTask(t)} />}
        </div>
      </div>

      <Footer />

      <NewProjectModal open={showNewProject} onClose={()=> setShowNewProject(false)} onCreate={(p)=> createProject(p)} />
      {showTask && <TaskModal task={showTask} projects={projects} onSave={(t)=> { saveTask(t); setShowTask(null); }} onDelete={(id)=> deleteTask(id)} onClose={()=> setShowTask(null)} />}
      <CommandPalette open={paletteOpen} onClose={()=> setPaletteOpen(false)} onRun={runCommand} projects={projects} />
    </main>
  );
}


/* ---------- Quick Add (with project picker) ---------- */
function QuickAddWithProject({
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
  useEffect(() => { setProjectId(defaultProjectId || ""); }, [defaultProjectId]);

  const go = () => {
    const t = title.trim();
    if (!t) return;
    onAdd(t, projectId || undefined);
    setTitle("");
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-2 py-2 shadow-sm">
      <input
        className="flex-1 px-3 py-2 rounded-lg outline-none"
        placeholder="Quick task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
      />
      <select
        className="px-3 py-2 rounded-lg border border-neutral-200 bg-white"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
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
        className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50 hover:opacity-90 active:scale-[.99]"
      >
        Add
      </button>
    </div>
  );
}
