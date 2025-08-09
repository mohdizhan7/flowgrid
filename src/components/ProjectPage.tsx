"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button, Card, Input, Select, Textarea, Badge, TOK } from "./ui";
import QuickAdd from "./QuickAdd";
import { Project, Task, TaskStatus, Priority, ProjectStatus } from "../lib/types";
import { fmtDate, humanDate, mdToHtml, statusColor, priorityColor } from "../lib/utils";

export default function ProjectPage({ project, tasks, onBack, onSaveProject, onAddTask, onOpenTask, onUpdateTask }:{ project:Project; tasks:Task[]; onBack:()=>void; onSaveProject:(p:Project)=>void; onAddTask:(title:string)=>void; onOpenTask:(t:Task)=>void; onUpdateTask:(t:Task)=>void; }){
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
          <div className="flex flex-col gap-2">
            {linked.sort((a,b)=> (a.dueDate||"")< (b.dueDate||"") ? -1:1).map(t=> (
              <div key={t.id} className="flex items-center gap-2">
                <div className="w-32 text-xs text-neutral-500">{humanDate(t.dueDate)}</div>
                <div className="flex-1 h-px bg-neutral-200" />
                <button className="text-sm underline" onClick={()=> onOpenTask(t)}>{t.title}</button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-4 flex items-center gap-2">
        <Input placeholder="Add task" value={newTitle} onChange={e=> setNewTitle(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter" && newTitle.trim()){ onAddTask(newTitle.trim()); setNewTitle(""); } }} />
        <Button onClick={()=>{ if(newTitle.trim()){ onAddTask(newTitle.trim()); setNewTitle(""); } }}>Add</Button>
      </div>

      <div className="mt-4">
        <QuickAdd projects={[project]} defaultProjectId={project.id} onAdd={(title) => onAddTask(title)} />
      </div>
    </div>
  );
}
