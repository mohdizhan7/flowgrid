import { supabase } from './supabaseClient';

export type TaskRow = {
  id: string; project_id: string|null; title: string; status: string;
  priority: string; points: number; date: string|null; due_date: string|null;
  completion_date: string|null; assignees: string[]; tags: string[];
  description: string|null; checklist: any[]; done: boolean;
  escalations: boolean; delay: boolean; proactive_steps: string|null;
  tools_used: string[]; stakeholder_feedback: string|null;
  lessons_learned: string|null; delivery: number;
  created_at: string; updated_at: string;
};

export async function fetchTasks() {
  const { data, error } = await supabase.from('tasks').select('*').order('created_at',{ascending:false});
  if (error) throw error;
  return (data||[]) as TaskRow[];
}

export async function insertTask(t: Partial<TaskRow>) {
  const { data, error } = await supabase.from('tasks').insert(t).select().single();
  if (error) throw error;
  return data as TaskRow;
}
