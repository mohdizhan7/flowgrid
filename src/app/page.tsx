"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Input, TOK } from "../components/ui";
import GlobalStyles from "../components/GlobalStyles";
import NavBar from "../components/NavBar";
import Dashboard from "../components/Dashboard";
import ProjectsIndex from "../components/ProjectsIndex";
import ProjectPage from "../components/ProjectPage";
import TaskSheet from "../components/TaskSheet";
import TaskModal from "../components/TaskModal";
import NewProjectModal from "../components/NewProjectModal";
import CommandPalette from "../components/CommandPalette";
import QuickAdd from "../components/QuickAdd";
import Footer from "../components/Footer";
import { Project, Task, TaskStatus, Priority } from "../lib/types";

/* ---------- Sample data ---------- */
function addDays(n: number) { return new Date(Date.now() + n * 86400000).toISOString(); }
const nowIso = () => new Date().toISOString();
const seedProjects: Project[] = [
  { id: "p1", name: "ITC Dairy – SB TMS Pilot", icon: "🐄", status: "Active", dueDate: addDays(21), tags: ["TMS", "Q3"], description: "Kickoff, config, UAT, go‑live.\n- Fleet setup\n- Trip rules\n- KPIs" },
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

/* ---------- App page ---------- */
export default function Page(){
  const [projects,setProjects]=useState<Project[]>(seedProjects);
  const [tasks,setTasks]=useState<Task[]>(seedTasks);

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
      const hay = [t.title, t.description||"", (t.tags||[]).join(" ")].join(" ").toLowerCase();
      return hay.includes(query.toLowerCase());
    });
  },[tasks,query]);

  const projectProgress = useMemo(()=>{
    const m: Record<string,{pct:number;tasksDone:number;tasksTotal:number}>={};
    for(const p of projects){
      const linked = tasks.filter(t=> t.projectId===p.id);
      const done = linked.filter(t=> t.status==="Done").length;
      const total = linked.length;
      m[p.id] = {pct: total? Math.round((done/total)*100) : 0, tasksDone: done, tasksTotal: total};
    }
    return m;
  },[projects,tasks]);

  const activeProject = activeProjectId? projects.find(p=> p.id===activeProjectId) || null : null;

  const quickAddTask = (title:string, projectId?:string)=>{
    const id=Math.random().toString(36).slice(2);
    const newTask:Task={ id, projectId, title, status:"Backlog", priority:"Medium", assignees:["Me"], tags:[], description:"", checklist:[], createdAt:nowIso(), updatedAt:nowIso() } as Task;
    setTasks(prev=> [newTask,...prev]);
  };

  const createProject = (p:Project)=>{ setProjects(prev=> [p,...prev]); };
  const updateProject = (p:Project)=>{ setProjects(prev=> prev.map(x=> x.id===p.id? p: x)); };
  const saveTask = (t:Task)=>{ setTasks(prev=> prev.map(x=> x.id===t.id? t: x)); };
  const deleteTask = (id:string)=>{ setTasks(prev=> prev.filter(t=> t.id!==id)); };
  const runCommand = (cmd:string,arg?:string)=>{
    if(cmd==="new-task"){ const title=prompt("Task title"); if(title) quickAddTask(title); }
    if(cmd==="go-dashboard") setPage("dashboard");
    if(cmd==="go-projects") setPage("projects");
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
              <QuickAdd projects={projects} defaultProjectId={activeProjectId} onAdd={quickAddTask} />
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
