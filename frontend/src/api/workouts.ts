import { apiFetch } from './client';

export interface Workout {
  id: string;
  user_id: string;
  workout_date: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  sets: string;
  reps: string;
  weight: string;
  position: number;
  created_at: string;
  updated_at: string;
}

// Workouts
export async function listWorkouts(): Promise<Workout[]> {
  return apiFetch<Workout[]>('/workouts');
}

export async function createWorkout(data: { workout_date: string }): Promise<Workout> {
  return apiFetch<Workout>('/workouts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWorkout(id: string, data: { workout_date?: string }): Promise<Workout> {
  return apiFetch<Workout>(`/workouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function moveWorkout(id: string, data: { position: number }): Promise<Workout> {
  return apiFetch<Workout>(`/workouts/${id}/move`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteWorkout(id: string): Promise<void> {
  return apiFetch<void>(`/workouts/${id}`, { method: 'DELETE' });
}

// Workout exercises
export async function listWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
  return apiFetch<WorkoutExercise[]>(`/workouts/${workoutId}/exercises`);
}

export async function addExerciseToWorkout(
  workoutId: string,
  data: { exercise_name: string },
): Promise<WorkoutExercise> {
  return apiFetch<WorkoutExercise>(`/workouts/${workoutId}/exercises`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateWorkoutExercise(
  workoutId: string,
  weId: string,
  data: { sets?: string; reps?: string; weight?: string },
): Promise<WorkoutExercise> {
  return apiFetch<WorkoutExercise>(`/workouts/${workoutId}/exercises/${weId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function moveWorkoutExercise(
  workoutId: string,
  weId: string,
  data: { position: number },
): Promise<WorkoutExercise> {
  return apiFetch<WorkoutExercise>(`/workouts/${workoutId}/exercises/${weId}/move`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function removeExerciseFromWorkout(
  workoutId: string,
  weId: string,
): Promise<void> {
  return apiFetch<void>(`/workouts/${workoutId}/exercises/${weId}`, { method: 'DELETE' });
}

// Exercise catalog
export async function listExercises(): Promise<Exercise[]> {
  return apiFetch<Exercise[]>('/exercises');
}

export async function createExercise(data: { name: string }): Promise<Exercise> {
  return apiFetch<Exercise>('/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExercise(
  id: string,
  data: { name?: string },
): Promise<Exercise> {
  return apiFetch<Exercise>(`/exercises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteExercise(id: string): Promise<void> {
  return apiFetch<void>(`/exercises/${id}`, { method: 'DELETE' });
}
