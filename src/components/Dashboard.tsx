"use client";
import React from "react";
import { Card, Badge } from "./ui";
import { Task, Project, Priority, TaskStatus } from "../lib/types";
import { humanDate, statusColor } from "../lib/utils";

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
      <polyline points={points} fill="none" stroke="currentColor" className="text-green-600" strokeWidth="2" />
      {data.map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / denom;
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

export default function Dashboard({ tasks, projects, onCardFilter }:{ tasks:Task[]; projects:Project[]; onCardFilter:(q:{status?:TaskStatus; overdue?:boolean})=>void; }){
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
  const weekDaysData = weekDays.map(d=> d.toDateString());
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
