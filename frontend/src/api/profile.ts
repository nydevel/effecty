import { apiFetch } from './client';

export interface UiSettings {
  font_scale: number;
}

export const DEFAULT_UI_SETTINGS: UiSettings = {
  font_scale: 1.0,
};

export interface UserProfile {
  id: string;
  user_id: string;
  locale: string;
  ui_settings: UiSettings;
  created_at: string;
  updated_at: string;
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/profile');
}

export async function updateProfile(data: {
  locale: string;
  ui_settings?: UiSettings;
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
