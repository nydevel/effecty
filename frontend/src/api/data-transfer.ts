const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function exportData(): Promise<void> {
  const response = await fetch(`${API_BASE}/export`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Export failed: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let filename = 'effecty-export.json';
  if (disposition) {
    const match = disposition.match(/filename="(.+)"/);
    if (match) filename = match[1];
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  notes: number;
  memos: number;
  tasks: number;
  exercises: number;
  workouts: number;
  workout_exercises: number;
  tags: number;
  thoughts: number;
  thought_comments: number;
  thought_tags: number;
  topics: number;
  topic_tags: number;
  materials: number;
  material_topics: number;
}

export async function importData(file: File): Promise<ImportResult> {
  const text = await file.text();

  const response = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: text,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Import failed: HTTP ${response.status}`);
  }

  return response.json();
}
