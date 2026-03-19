import { apiFetch } from './client';

export interface UserProfile {
  id: string;
  user_id: string;
  locale: string;
  encrypt_notes: boolean;
  encrypt_thoughts: boolean;
  created_at: string;
  updated_at: string;
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/profile');
}

export async function updateProfile(data: {
  locale: string;
  encrypt_notes?: boolean;
  encrypt_thoughts?: boolean;
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
