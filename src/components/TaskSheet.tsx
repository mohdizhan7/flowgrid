"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button, Card, Select, Input, TOK } from "./ui";
import { Project, Task, TaskStatus, Priority } from "../lib/types";
import { humanDate, priorityColor, statusColor, trunc } from "../lib/utils";

export default function TaskSheet({ tasks, projects, onEdit }:{ tasks:Task[]; projects:Project[]; onEdit:(t:Task)=>void; }){
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
