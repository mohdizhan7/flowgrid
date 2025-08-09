export type ProjectStatus = "Planned" | "Active" | "On Hold" | "Done" | "Archived";
export type TaskStatus = "Backlog" | "In Progress" | "Blocked" | "Review" | "Done";
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export type Project = {
  id: string;
  name: string;
  icon?: string;
  status: ProjectStatus;
  dueDate?: string;
  tags: string[];
  description?: string;
};

export type ChecklistItem = { id: string; label: string; done: boolean };

export type Task = {
  id: string;
  projectId?: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  points?: number;
  dueDate?: string | null;
  assignees: string[];
  tags: string[];
  description?: string;
  checklist: ChecklistItem[];
  done?: boolean;
  date?: string | null;
  completionDate?: string | null;
  escalations?: boolean;
  delay?: boolean;
  proactiveSteps?: string;
  toolsUsed?: string[];
  stakeholderFeedback?: string;
  lessonsLearned?: string;
  delivery?: number;
  createdAt: string;
  updatedAt: string;
};

