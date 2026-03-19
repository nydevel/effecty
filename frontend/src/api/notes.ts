import { apiFetch } from './client';

export interface Note {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  content: string;
  node_type: 'folder' | 'file' | 'memolist';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Memo {
  id: string;
  note_id: string;
  user_id: string;
  title: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getTree(): Promise<Note[]> {
  return apiFetch<Note[]>('/notes');
}

export async function getNote(id: string): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}`);
}

export async function createNote(data: {
  parent_id: string | null;
  title: string;
  node_type: 'folder' | 'file' | 'memolist';
}): Promise<Note> {
  return apiFetch<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNote(
  id: string,
  data: { title?: string; content?: string },
): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function moveNote(
  id: string,
  data: { parent_id: string | null; sort_order: number },
): Promise<Note> {
  return apiFetch<Note>(`/notes/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteNote(id: string): Promise<void> {
  return apiFetch<void>(`/notes/${id}`, { method: 'DELETE' });
}

// --- Memos ---

export async function listMemos(noteId: string): Promise<Memo[]> {
  return apiFetch<Memo[]>(`/notes/${noteId}/memos`);
}

export async function createMemo(
  noteId: string,
  data: { title: string; content?: string },
): Promise<Memo> {
  return apiFetch<Memo>(`/notes/${noteId}/memos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateMemo(
  noteId: string,
  memoId: string,
  data: { title?: string; content?: string },
): Promise<Memo> {
  return apiFetch<Memo>(`/notes/${noteId}/memos/${memoId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteMemo(noteId: string, memoId: string): Promise<void> {
  return apiFetch<void>(`/notes/${noteId}/memos/${memoId}`, { method: 'DELETE' });
}

export async function reorderMemos(noteId: string, ids: string[]): Promise<void> {
  await apiFetch(`/notes/${noteId}/memos/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
}
