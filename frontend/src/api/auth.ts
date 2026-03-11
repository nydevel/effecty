import { apiFetch, setToken } from './client';

interface AuthResponse {
  token: string;
}

interface MeResponse {
  id: string;
  email: string;
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
}

export async function register(email: string, password: string): Promise<void> {
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
}

export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/auth/me');
}
