"use client";
import React from "react";
import { Button, Card, Progress } from "./ui";
import { Project } from "../lib/types";
import { humanDate } from "../lib/utils";

export default function ProjectsIndex({ projects, progress, onOpen, onNew }:{ projects:Project[]; progress: Record<string,{pct:number;tasksDone:number;tasksTotal:number}>; onOpen:(id:string)=>void; onNew:()=>void; }){
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
