import { apiFetch } from './client';

export type ProjectTaskStatus = 'todo' | 'in_progress' | 'done';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectTaskLink {
  id: string;
  source_task_id: string;
  target_task_id: string;
  link_type: string;
  target_title: string;
  created_at: string;
}

// Projects
export async function listProjects(): Promise<Project[]> {
  return apiFetch<Project[]>('/projects');
}

export async function createProject(data: { name: string }): Promise<Project> {
  return apiFetch<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: string, data: { name?: string }): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  return apiFetch<void>(`/projects/${id}`, { method: 'DELETE' });
}

// Project tasks
export async function listTasks(projectId: string): Promise<ProjectTask[]> {
  return apiFetch<ProjectTask[]>(`/projects/${projectId}/tasks`);
}

export async function createTask(
  projectId: string,
  data: { title: string },
): Promise<ProjectTask> {
  return apiFetch<ProjectTask>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  projectId: string,
  taskId: string,
  data: { title?: string; description?: string; status?: ProjectTaskStatus; position?: number },
): Promise<ProjectTask> {
  return apiFetch<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
}

export async function searchTasks(projectId: string, query: string): Promise<ProjectTask[]> {
  return apiFetch<ProjectTask[]>(
    `/projects/${projectId}/tasks/search?q=${encodeURIComponent(query)}`,
  );
}

// Task links
export async function listTaskLinks(
  projectId: string,
  taskId: string,
): Promise<ProjectTaskLink[]> {
  return apiFetch<ProjectTaskLink[]>(`/projects/${projectId}/tasks/${taskId}/links`);
}

export async function linkTask(
  projectId: string,
  taskId: string,
  targetTaskId: string,
  linkType: string,
): Promise<ProjectTaskLink> {
  return apiFetch<ProjectTaskLink>(`/projects/${projectId}/tasks/${taskId}/links`, {
    method: 'POST',
    body: JSON.stringify({ target_task_id: targetTaskId, link_type: linkType }),
  });
}

export async function unlinkTask(
  projectId: string,
  taskId: string,
  targetId: string,
): Promise<void> {
  return apiFetch<void>(`/projects/${projectId}/tasks/${taskId}/links/${targetId}`, {
    method: 'DELETE',
  });
}
