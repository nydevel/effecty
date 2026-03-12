import { useCallback, useEffect, useState } from 'react';
import * as workoutsApi from '../api/workouts';
import type { Workout, Exercise, WorkoutExercise } from '../api/workouts';
import WorkoutSidebar from '../components/WorkoutSidebar';
import WorkoutForm from '../components/WorkoutForm';
import ExerciseCatalog from '../components/ExerciseCatalog';

export default function WorkoutsFeature() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);

  const selectedWorkout = workouts.find((w) => w.id === selectedId) ?? null;

  const loadWorkouts = useCallback(async () => {
    try {
      const list = await workoutsApi.listWorkouts();
      setWorkouts(list);
    } catch (err) {
      console.error('Failed to load workouts:', err);
    }
  }, []);

  const loadExercises = useCallback(async () => {
    try {
      const list = await workoutsApi.listExercises();
      setExercises(list);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    }
  }, []);

  const loadWorkoutExercises = useCallback(async (workoutId: string) => {
    try {
      const list = await workoutsApi.listWorkoutExercises(workoutId);
      setWorkoutExercises(list);
    } catch (err) {
      console.error('Failed to load workout exercises:', err);
    }
  }, []);

  useEffect(() => {
    loadWorkouts();
    loadExercises();
  }, [loadWorkouts, loadExercises]);

  useEffect(() => {
    if (selectedId) {
      loadWorkoutExercises(selectedId);
    } else {
      setWorkoutExercises([]);
    }
  }, [selectedId, loadWorkoutExercises]);

  const handleCreate = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const workout = await workoutsApi.createWorkout({ workout_date: today });
    await loadWorkouts();
    setSelectedId(workout.id);
  };

  const handleDelete = async (id: string) => {
    await workoutsApi.deleteWorkout(id);
    if (selectedId === id) setSelectedId(null);
    await loadWorkouts();
  };


  const handleDateChange = async (date: string) => {
    if (!selectedId) return;
    await workoutsApi.updateWorkout(selectedId, { workout_date: date });
    await loadWorkouts();
  };

  const handleUpdateStats = async (weId: string, data: { sets?: string; reps?: string; weight?: string }) => {
    if (!selectedId) return;
    await workoutsApi.updateWorkoutExercise(selectedId, weId, data);
    await loadWorkoutExercises(selectedId);
  };

  const handleRemoveExercise = async (weId: string) => {
    if (!selectedId) return;
    await workoutsApi.removeExerciseFromWorkout(selectedId, weId);
    await loadWorkoutExercises(selectedId);
  };

  const handleDropExercise = async (exerciseName: string) => {
    if (!selectedId) return;
    try {
      await workoutsApi.addExerciseToWorkout(selectedId, { exercise_name: exerciseName });
      await loadWorkoutExercises(selectedId);
      await loadExercises();
    } catch (err) {
      console.error('Failed to add exercise:', err);
    }
  };

  const handleCreateExercise = async (name: string) => {
    await workoutsApi.createExercise({ name });
    await loadExercises();
  };

  return (
    <div className="feature-layout">
      <WorkoutSidebar
        workouts={workouts}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onDelete={handleDelete}
      />
      <main className="main-content">
        {selectedWorkout ? (
          <WorkoutForm
            workoutDate={selectedWorkout.workout_date}
            exercises={workoutExercises}
            onDateChange={handleDateChange}
            onUpdateStats={handleUpdateStats}
            onRemoveExercise={handleRemoveExercise}
            onDropExercise={handleDropExercise}
          />
        ) : (
          <div className="empty-state">Select a workout or create a new one</div>
        )}
      </main>
      <ExerciseCatalog
        exercises={exercises}
        onCreateExercise={handleCreateExercise}
      />
    </div>
  );
}
