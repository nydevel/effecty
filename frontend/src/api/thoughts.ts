import { apiFetch } from './client';

export interface Thought {
  id: string;
  user_id: string;
  content: string;
  position: number;

  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ThoughtComment {
  id: string;
  thought_id: string;
  user_id: string;
  content: string;

  created_at: string;
  updated_at: string;
}

// Thoughts
export async function listThoughts(): Promise<Thought[]> {
  return apiFetch<Thought[]>('/thoughts');
}

export async function createThought(data: { content: string }): Promise<Thought> {
  return apiFetch<Thought>('/thoughts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateThought(id: string, data: { content?: string }): Promise<Thought> {
  return apiFetch<Thought>(`/thoughts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteThought(id: string): Promise<void> {
  return apiFetch<void>(`/thoughts/${id}`, { method: 'DELETE' });
}

// Thought comments
export async function listComments(thoughtId: string): Promise<ThoughtComment[]> {
  return apiFetch<ThoughtComment[]>(`/thoughts/${thoughtId}/comments`);
}

export async function createComment(
  thoughtId: string,
  data: { content: string },
): Promise<ThoughtComment> {
  return apiFetch<ThoughtComment>(`/thoughts/${thoughtId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteComment(thoughtId: string, commentId: string): Promise<void> {
  return apiFetch<void>(`/thoughts/${thoughtId}/comments/${commentId}`, { method: 'DELETE' });
}
