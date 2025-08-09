"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Textarea, Select, TOK } from "./ui";
import { Project, Task, TaskStatus, Priority } from "../lib/types";
import { fmtDate, mdToHtml } from "../lib/utils";

export default function TaskModal({ task, projects, onSave, onDelete, onClose }:{ task:Task|null; projects:Project[]; onSave:(t:Task)=>void; onDelete:(id:string)=>void; onClose:()=>void; }){
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
