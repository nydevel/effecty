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

export interface ThoughtTag {
  id: string;
  thought_id: string;
  tag_id: string;
  tag_name: string;
}

// Thoughts
export async function listThoughts(): Promise<Thought[]> {
  return apiFetch<Thought[]>('/thoughts');
}

export async function createThought(): Promise<Thought> {
  return apiFetch<Thought>('/thoughts', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function updateThought(id: string, data: { content?: string }): Promise<Thought> {
  return apiFetch<Thought>(`/thoughts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function moveThought(id: string, data: { position: number }): Promise<Thought> {
  return apiFetch<Thought>(`/thoughts/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteThought(id: string): Promise<void> {
  return apiFetch<void>(`/thoughts/${id}`, { method: 'DELETE' });
}

// Tags
export async function listTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>('/tags');
}

export async function createTag(data: { name: string }): Promise<Tag> {
  return apiFetch<Tag>('/tags', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Thought tags
export async function listThoughtTags(thoughtId: string): Promise<ThoughtTag[]> {
  return apiFetch<ThoughtTag[]>(`/thoughts/${thoughtId}/tags`);
}

export async function linkTag(thoughtId: string, data: { tag_id: string }): Promise<ThoughtTag> {
  return apiFetch<ThoughtTag>(`/thoughts/${thoughtId}/tags`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function unlinkTag(thoughtId: string, tagId: string): Promise<void> {
  return apiFetch<void>(`/thoughts/${thoughtId}/tags/${tagId}`, { method: 'DELETE' });
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
