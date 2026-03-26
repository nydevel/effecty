import { apiFetch } from './client';

export interface Specialty {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorVisit {
  id: string;
  user_id: string;
  specialty_id: string;
  doctor_name: string;
  clinic: string;
  visit_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
  specialty_name: string;
}

export interface Analysis {
  id: string;
  user_id: string;
  title: string;
  analysis_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalImage {
  id: string;
  user_id: string;
  owner_type: string;
  owner_id: string;
  file_path: string;
  position: number;
  created_at: string;
}

// Specialties
export async function listSpecialties(): Promise<Specialty[]> {
  return apiFetch<Specialty[]>('/specialties');
}

export async function createSpecialty(data: { name: string }): Promise<Specialty> {
  return apiFetch<Specialty>('/specialties', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteSpecialty(id: string): Promise<void> {
  return apiFetch<void>(`/specialties/${id}`, { method: 'DELETE' });
}

// Doctor visits
export async function listVisits(specialtyId?: string): Promise<DoctorVisit[]> {
  const query = specialtyId ? `?specialty_id=${specialtyId}` : '';
  return apiFetch<DoctorVisit[]>(`/doctor-visits${query}`);
}

export async function getVisit(id: string): Promise<DoctorVisit> {
  return apiFetch<DoctorVisit>(`/doctor-visits/${id}`);
}

export async function createVisit(data: {
  specialty_id: string;
  doctor_name: string;
  clinic: string;
  visit_date: string;
}): Promise<DoctorVisit> {
  return apiFetch<DoctorVisit>('/doctor-visits', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateVisit(
  id: string,
  data: {
    specialty_id?: string;
    doctor_name?: string;
    clinic?: string;
    visit_date?: string;
    notes?: string;
  },
): Promise<DoctorVisit> {
  return apiFetch<DoctorVisit>(`/doctor-visits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteVisit(id: string): Promise<void> {
  return apiFetch<void>(`/doctor-visits/${id}`, { method: 'DELETE' });
}

// Analyses
export async function listAnalyses(): Promise<Analysis[]> {
  return apiFetch<Analysis[]>('/analyses');
}

export async function getAnalysis(id: string): Promise<Analysis> {
  return apiFetch<Analysis>(`/analyses/${id}`);
}

export async function createAnalysis(data: {
  title: string;
  analysis_date: string;
}): Promise<Analysis> {
  return apiFetch<Analysis>('/analyses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAnalysis(
  id: string,
  data: {
    title?: string;
    analysis_date?: string;
    notes?: string;
  },
): Promise<Analysis> {
  return apiFetch<Analysis>(`/analyses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAnalysis(id: string): Promise<void> {
  return apiFetch<void>(`/analyses/${id}`, { method: 'DELETE' });
}

// Medical images
export async function listImages(ownerType: string, ownerId: string): Promise<MedicalImage[]> {
  return apiFetch<MedicalImage[]>(
    `/medical-images?owner_type=${ownerType}&owner_id=${ownerId}`,
  );
}

export async function uploadImage(
  ownerType: string,
  ownerId: string,
  file: File,
): Promise<MedicalImage> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(
    `/api/medical-images?owner_type=${ownerType}&owner_id=${ownerId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
      body: formData,
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${res.status}`);
  }

  return res.json();
}

export async function deleteImage(imageId: string): Promise<void> {
  return apiFetch<void>(`/medical-images/${imageId}`, { method: 'DELETE' });
}
