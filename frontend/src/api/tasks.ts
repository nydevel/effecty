import { apiFetch } from './client';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  content: string;
  priority: number;
  task_date: string;
  time_start: string | null;
  time_end: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export async function listTasks(from: string, to: string): Promise<Task[]> {
  return apiFetch<Task[]>(`/tasks?from=${from}&to=${to}`);
}

export async function createTask(data: {
  title: string;
  content?: string;
  priority?: number;
  task_date: string;
  time_start?: string | null;
  time_end?: string | null;
}): Promise<Task> {
  return apiFetch<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    content?: string;
    priority?: number;
    task_date?: string;
    time_start?: string | null;
    time_end?: string | null;
  },
): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function moveTask(
  id: string,
  data: { task_date: string; position: number },
): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<void> {
  return apiFetch<void>(`/tasks/${id}`, { method: 'DELETE' });
}
