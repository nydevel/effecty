import { apiFetch } from './client';

export interface Workout {
  id: string;
  user_id: string;
  workout_date: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms';

export const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'legs', 'shoulders', 'arms'];

export interface MuscleRecoveryHours {
  chest: number;
  back: number;
  legs: number;
  shoulders: number;
  arms: number;
}

export interface WorkoutsSettings {
  recovery_hours: MuscleRecoveryHours;
}

export const DEFAULT_WORKOUTS_SETTINGS: WorkoutsSettings = {
  recovery_hours: {
    chest: 48,
    back: 48,
    legs: 48,
    shoulders: 48,
    arms: 48,
  },
};

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  muscle_group: MuscleGroup | null;
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

export async function duplicateWorkout(id: string, data: { workout_date: string }): Promise<Workout> {
  return apiFetch<Workout>(`/workouts/${id}/duplicate`, {
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

export async function createExercise(data: { name: string; muscle_group?: string }): Promise<Exercise> {
  return apiFetch<Exercise>('/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateExercise(
  id: string,
  data: { name?: string; muscle_group?: string },
): Promise<Exercise> {
  return apiFetch<Exercise>(`/exercises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteExercise(id: string): Promise<void> {
  return apiFetch<void>(`/exercises/${id}`, { method: 'DELETE' });
}

// Workouts settings
export async function getWorkoutsSettings(): Promise<WorkoutsSettings> {
  return apiFetch<WorkoutsSettings>('/workout-settings');
}

export async function updateWorkoutsSettings(
  data: WorkoutsSettings,
): Promise<WorkoutsSettings> {
  return apiFetch<WorkoutsSettings>('/workout-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
