import { apiFetch } from './client';
import type { Tag } from './thoughts';

export type MaterialType = 'article_link' | 'video_link' | 'text' | 'image' | 'document';

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  user_id: string;
  material_type: MaterialType;
  title: string;
  url: string | null;
  content: string | null;
  file_path: string | null;
  thumbnail_path: string | null;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

// Topics
export async function listTopics(): Promise<Topic[]> {
  return apiFetch<Topic[]>('/topics');
}

export async function createTopic(data: { name: string; tag_ids: string[] }): Promise<Topic> {
  return apiFetch<Topic>('/topics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteTopic(id: string): Promise<void> {
  return apiFetch<void>(`/topics/${id}`, { method: 'DELETE' });
}

// Tags (shared)
export async function listTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>('/learning/tags');
}

export async function createTag(data: { name: string }): Promise<Tag> {
  return apiFetch<Tag>('/learning/tags', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// URL metadata
export async function fetchUrlTitle(url: string): Promise<string | null> {
  const res = await apiFetch<{ title: string | null }>('/learning/fetch-title', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return res.title;
}

// Materials
export async function listMaterials(): Promise<Material[]> {
  return apiFetch<Material[]>('/materials');
}

export async function listMaterialsByTopic(topicId: string): Promise<Material[]> {
  return apiFetch<Material[]>(`/materials/by-topic/${topicId}`);
}

export async function createMaterial(data: {
  material_type: MaterialType;
  title: string;
  url?: string;
  content?: string;
  topic_id: string;
}): Promise<Material> {
  return apiFetch<Material>('/materials', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function toggleMaterialDone(id: string): Promise<Material> {
  return apiFetch<Material>(`/materials/${id}/toggle-done`, { method: 'PATCH' });
}

export async function deleteMaterial(id: string): Promise<void> {
  return apiFetch<void>(`/materials/${id}`, { method: 'DELETE' });
}

export async function uploadMaterialFile(id: string, file: File): Promise<Material> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api/materials/${id}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token ?? ''}` },
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${res.status}`);
  }

  return res.json();
}

// Roadmap nodes
export interface RoadmapNode {
  id: string;
  user_id: string;
  parent_id: string | null;
  label: string;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export async function listRoadmapNodes(): Promise<RoadmapNode[]> {
  return apiFetch<RoadmapNode[]>('/roadmap/nodes');
}

export async function createRoadmapNode(data: {
  parent_id?: string | null;
  label: string;
  position_x: number;
  position_y: number;
}): Promise<RoadmapNode> {
  return apiFetch<RoadmapNode>('/roadmap/nodes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRoadmapNode(
  id: string,
  data: {
    label?: string;
    position_x?: number;
    position_y?: number;
    parent_id?: string | null;
  },
): Promise<RoadmapNode> {
  return apiFetch<RoadmapNode>(`/roadmap/nodes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRoadmapNode(id: string): Promise<void> {
  return apiFetch<void>(`/roadmap/nodes/${id}`, { method: 'DELETE' });
}

