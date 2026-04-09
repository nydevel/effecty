import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as workoutsApi from '../api/workouts';
import type { Workout, Exercise, WorkoutExercise } from '../api/workouts';
import WorkoutSidebar from '../components/WorkoutSidebar';
import WorkoutForm from '../components/WorkoutForm';
import ExerciseCatalog from '../components/ExerciseCatalog';

function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function WorkoutsFeature() {
  const { t } = useTranslation();
  const { id: selectedId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const setSelectedId = (id: string | null) => {
    if (id) {
      navigate(`/app/workouts/${id}`);
    } else {
      navigate('/app/workouts');
    }
  };
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
    const today = getTodayDateString();
    const workout = await workoutsApi.createWorkout({ workout_date: today });
    await loadWorkouts();
    setSelectedId(workout.id);
  };

  const handleDuplicate = async (id: string) => {
    const workout = await workoutsApi.duplicateWorkout(id, { workout_date: getTodayDateString() });
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

  const handleAddExerciseToWorkout = async (exerciseName: string) => {
    if (!selectedId) return;
    try {
      await workoutsApi.addExerciseToWorkout(selectedId, { exercise_name: exerciseName });
      await loadWorkoutExercises(selectedId);
      await loadExercises();
    } catch (err) {
      console.error('Failed to add exercise:', err);
    }
  };

  const handleCreateExercise = async (name: string, muscleGroup?: string) => {
    await workoutsApi.createExercise({ name, muscle_group: muscleGroup });
    await loadExercises();
  };

  const handleUpdateExercise = async (id: string, data: { name?: string; muscle_group?: string }) => {
    await workoutsApi.updateExercise(id, data);
    await loadExercises();
    if (selectedId) await loadWorkoutExercises(selectedId);
  };

  const handleDeleteExercise = async (id: string) => {
    await workoutsApi.deleteExercise(id);
    await loadExercises();
    if (selectedId) await loadWorkoutExercises(selectedId);
  };

  return (
    <div className="feature-layout">
      <WorkoutSidebar
        workouts={workouts}
        selectedId={selectedId ?? null}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onDuplicate={handleDuplicate}
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
          />
        ) : (
          <div className="empty-state">{t('workouts.emptyState')}</div>
        )}
      </main>
      <ExerciseCatalog
        exercises={exercises}
        onCreateExercise={handleCreateExercise}
        onUpdateExercise={handleUpdateExercise}
        onDeleteExercise={handleDeleteExercise}
        canAddToWorkout={Boolean(selectedWorkout)}
        onAddToWorkout={handleAddExerciseToWorkout}
      />
    </div>
  );
}
