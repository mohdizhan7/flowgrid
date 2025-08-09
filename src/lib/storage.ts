const PROJECTS_KEY = "flowgrid_projects";
const TASKS_KEY = "flowgrid_tasks";

export function loadProjects(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function loadTasks(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    // ignore
  }
}

export function saveTasks(tasks: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}
