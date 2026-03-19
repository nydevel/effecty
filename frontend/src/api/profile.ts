import { apiFetch } from './client';

export interface FieldEncryption {
  title: boolean;
  content: boolean;
}

export interface ContentOnlyEncryption {
  content: boolean;
}

export interface EncryptionSettings {
  notes: FieldEncryption;
  memos: FieldEncryption;
  thoughts: FieldEncryption;
  thought_comments: ContentOnlyEncryption;
}

export const DEFAULT_ENCRYPTION_SETTINGS: EncryptionSettings = {
  notes: { title: false, content: false },
  memos: { title: false, content: false },
  thoughts: { title: false, content: false },
  thought_comments: { content: false },
};

export interface UserProfile {
  id: string;
  user_id: string;
  locale: string;
  encryption_settings: EncryptionSettings;
  created_at: string;
  updated_at: string;
}

export function hasAnyEncryption(settings: EncryptionSettings): boolean {
  return (
    settings.notes.title ||
    settings.notes.content ||
    settings.memos.title ||
    settings.memos.content ||
    settings.thoughts.title ||
    settings.thoughts.content ||
    settings.thought_comments.content
  );
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/profile');
}

export async function updateProfile(data: {
  locale: string;
  encryption_settings?: EncryptionSettings;
}): Promise<UserProfile> {
  return apiFetch<UserProfile>('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: {
  current_password: string;
  new_password: string;
}): Promise<void> {
  await apiFetch('/auth/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
