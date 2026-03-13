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

export interface TopicTag {
  id: string;
  topic_id: string;
  tag_id: string;
  tag_name: string;
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
  created_at: string;
  updated_at: string;
}

export interface MaterialTopic {
  id: string;
  material_id: string;
  topic_id: string;
  topic_name: string;
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

export async function updateTopic(id: string, data: { name?: string }): Promise<Topic> {
  return apiFetch<Topic>(`/topics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTopic(id: string): Promise<void> {
  return apiFetch<void>(`/topics/${id}`, { method: 'DELETE' });
}

// Topic tags
export async function listTopicTags(topicId: string): Promise<TopicTag[]> {
  return apiFetch<TopicTag[]>(`/topics/${topicId}/tags`);
}

export async function linkTopicTag(topicId: string, data: { tag_id: string }): Promise<TopicTag> {
  return apiFetch<TopicTag>(`/topics/${topicId}/tags`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function unlinkTopicTag(topicId: string, tagId: string): Promise<void> {
  return apiFetch<void>(`/topics/${topicId}/tags/${tagId}`, { method: 'DELETE' });
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

export async function updateMaterial(
  id: string,
  data: { title?: string; url?: string; content?: string },
): Promise<Material> {
  return apiFetch<Material>(`/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
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

// Material topics
export async function listMaterialTopics(materialId: string): Promise<MaterialTopic[]> {
  return apiFetch<MaterialTopic[]>(`/materials/${materialId}/topics`);
}

export async function linkMaterialTopic(
  materialId: string,
  data: { topic_id: string },
): Promise<MaterialTopic> {
  return apiFetch<MaterialTopic>(`/materials/${materialId}/topics`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function unlinkMaterialTopic(materialId: string, topicId: string): Promise<void> {
  return apiFetch<void>(`/materials/${materialId}/topics/${topicId}`, { method: 'DELETE' });
}
