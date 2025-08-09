"use client";
import React, { useState, useMemo } from "react";
import { Input, Button } from "./ui";
import { Project } from "../lib/types";

export default function CommandPalette({ open, onClose, onRun, projects }:{ open:boolean; onClose:()=>void; onRun:(cmd:string,arg?:string)=>void; projects: Project[] }){
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
        <div className="p-3 border-b border-neutral-200"><Input autoFocus placeholder="Type a command…" value={q} onChange={e=>setQ(e.target.value)} /></div>
        <div className="max-h-[50vh] overflow-auto">
          {items.map(i=> <button key={i.id} onClick={()=>{i.run(); onClose();}} className="w-full text-left px-4 py-2 hover:bg-neutral-50">{i.label}</button>)}
          {items.length===0 && <div className="px-4 py-6 text-neutral-500 text-sm">No results</div>}
        </div>
      </div>
    </div>
  );
}
