"use client";
import React, { useState } from "react";
import { Button, Input, TOK } from "./ui";
import { Project } from "../lib/types";

export default function NewProjectModal({ open, onClose, onCreate }:{ open:boolean; onClose:()=>void; onCreate:(p:Project)=>void; }){
  const [name,setName]=useState(""); const [icon,setIcon]=useState("📁"); const [due,setDue]=useState(""); const [tags,setTags]=useState("");
  if(!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm grid place-items-center p-4 z-50" role="dialog" aria-modal="true" onClick={(e)=> e.currentTarget===e.target && onClose()}>
      <div className="w-[min(560px,92vw)] rounded-2xl bg-white border border-neutral-200 p-4 shadow-2xl" aria-labelledby="new-project-title">
        <div id="new-project-title" className="text-lg font-semibold mb-3">Create a new project</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1"><div className={TOK.label}>Name</div><Input value={name} onChange={e=> setName(e.target.value)} /></div>
          <div className="flex flex-col gap-1"><div className={TOK.label}>Icon</div><Input value={icon} onChange={e=> setIcon(e.target.value)} /></div>
          <div className="flex flex-col gap-1"><div className={TOK.label}>Due</div><Input type="date" value={due} onChange={e=>setDue(e.target.value)} /></div>
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
