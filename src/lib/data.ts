import { getSupabase } from './supabaseClient';

export type ProjectRow = {
  id:string; name:string; icon:string|null; status:string|null;
  due_date:string|null; tags:string[]; description:string|null;
  created_at:string; updated_at:string;
};
export type TaskRow = {
  id:string; project_id:string|null; title:string; status:string;
  priority:string; points:number; date:string|null; due_date:string|null;
  completion_date:string|null; assignees:string[]; tags:string[];
  description:string|null; checklist:any[]; done:boolean;
  escalations:boolean; delay:boolean; proactive_steps:string|null;
  tools_used:string[]; stakeholder_feedback:string|null;
  lessons_learned:string|null; delivery:number;
  created_at:string; updated_at:string;
};

export async function fetchProjects(){
  const { data, error } = await getSupabase().from('projects').select('*').order('created_at',{ascending:false});
  if (error) throw error;
  return (data||[]) as ProjectRow[];
}
export async function insertProject(p: Partial<ProjectRow>){
  const { data, error } = await getSupabase().from('projects').insert(p).select().single();
  if (error) throw error;
  return data as ProjectRow;
}
export async function fetchTasks(){
  const { data, error } = await getSupabase().from('tasks').select('*').order('created_at',{ascending:false});
  if (error) throw error;
  return (data||[]) as TaskRow[];
}
export async function insertTask(t: Partial<TaskRow>){
  const { data, error } = await getSupabase().from('tasks').insert(t).select().single();
  if (error) throw error;
  return data as TaskRow;
}

export async function updateProject(id: string, patch: Partial<ProjectRow>) {
  const { data, error } = await getSupabase().from('projects').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as ProjectRow;
}

export async function updateTask(id: string, patch: Partial<TaskRow>) {
  const { data, error } = await getSupabase().from('tasks').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as TaskRow;
}
