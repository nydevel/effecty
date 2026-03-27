import { apiFetch } from './client';
import type { Tag } from './thoughts';

export type MaterialType = 'article_link' | 'video_link' | 'text' | 'image' | 'document';
export type MaterialStatus = 'not_started' | 'in_progress' | 'completed';

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
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
  status: MaterialStatus;
  topic_names: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialComment {
  id: string;
  material_id: string;
  user_id: string;
  comment_type: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialLink {
  id: string;
  source_material_id: string;
  target_material_id: string;
  target_title: string;
  target_material_type: string;
  created_at: string;
}

// Topics
export async function listTopics(): Promise<Topic[]> {
  return apiFetch<Topic[]>('/topics');
}

export async function createTopic(data: {
  name: string;
  tag_ids: string[];
  parent_id?: string | null;
}): Promise<Topic> {
  return apiFetch<Topic>('/topics', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteTopic(id: string): Promise<void> {
  return apiFetch<void>(`/topics/${id}`, { method: 'DELETE' });
}

export async function moveTopic(
  id: string,
  data: { parent_id: string | null },
): Promise<Topic> {
  return apiFetch<Topic>(`/topics/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
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

export async function setMaterialStatus(id: string, status: MaterialStatus): Promise<Material> {
  return apiFetch<Material>(`/materials/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
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

export async function searchMaterials(query: string): Promise<Material[]> {
  return apiFetch<Material[]>(`/materials/search?q=${encodeURIComponent(query)}`);
}

// Material comments
export async function listMaterialComments(materialId: string): Promise<MaterialComment[]> {
  return apiFetch<MaterialComment[]>(`/materials/${materialId}/comments`);
}

export async function createMaterialComment(
  materialId: string,
  content: string,
  commentType?: string,
): Promise<MaterialComment> {
  return apiFetch<MaterialComment>(`/materials/${materialId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, comment_type: commentType }),
  });
}

export async function deleteMaterialComment(
  materialId: string,
  commentId: string,
): Promise<void> {
  return apiFetch<void>(`/materials/${materialId}/comments/${commentId}`, { method: 'DELETE' });
}

// Material links
export async function listMaterialLinks(materialId: string): Promise<MaterialLink[]> {
  return apiFetch<MaterialLink[]>(`/materials/${materialId}/links`);
}

export async function linkMaterial(
  materialId: string,
  targetMaterialId: string,
): Promise<MaterialLink> {
  return apiFetch<MaterialLink>(`/materials/${materialId}/links`, {
    method: 'POST',
    body: JSON.stringify({ target_material_id: targetMaterialId }),
  });
}

export async function unlinkMaterial(materialId: string, targetId: string): Promise<void> {
  return apiFetch<void>(`/materials/${materialId}/links/${targetId}`, { method: 'DELETE' });
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
