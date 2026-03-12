import { apiFetch } from './client';

export interface UserProfile {
  id: string;
  user_id: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/profile');
}

export async function updateProfile(data: { locale: string }): Promise<UserProfile> {
  return apiFetch<UserProfile>('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
