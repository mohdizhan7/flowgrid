"use client";
import React, { useState } from "react";
import { Button, Select, Logo } from "./ui";
import { Project } from "../lib/types";

export default function NavBar({ current, onNavigate, projects, onQuickGo, notifications }:{
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
              <div className="absolute right-0 mt-2 w-80 max-h-60 overflow-auto bg-white border border-neutral-200 rounded-xl shadow-xl p-2">
                <div className="text-sm font-semibold px-2 py-1">Notifications</div>
                {notifications.length===0 && <div className="text-sm text-neutral-500 px-2 py-2">No new alerts</div>}
                {notifications.map((n,i)=> (
                  <div
                    key={i}
                    className={`px-2 py-2 text-sm ${i>0? 'border-t border-neutral-100':''}`}
                  >
                    {n}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
