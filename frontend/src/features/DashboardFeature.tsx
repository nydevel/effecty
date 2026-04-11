import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as tasksApi from '../api/tasks';
import * as workoutsApi from '../api/workouts';
import type { Task } from '../api/tasks';
import { DEFAULT_WORKOUTS_SETTINGS, MUSCLE_GROUPS } from '../api/workouts';
import type { MuscleGroup, Workout } from '../api/workouts';
import TaskCard from '../components/TaskCard';
import MuscleRecoveryWidget from '../components/MuscleRecoveryWidget';
import type { MuscleRecoveryState } from '../components/MuscleRecoveryWidget';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DashboardFeature() {
  const { t } = useTranslation();
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryItems, setRecoveryItems] = useState<MuscleRecoveryState[]>([]);

  const loadTodayTasks = useCallback(async () => {
    const today = formatDate(new Date());
    setLoading(true);
    try {
      const tasks = await tasksApi.listTasks(today, today);
      setTodayTasks(tasks);
    } catch (err) {
      console.error('Failed to load today tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecovery = useCallback(async () => {
    setRecoveryLoading(true);
    try {
      const [settings, workouts, exercises] = await Promise.all([
        workoutsApi.getWorkoutsSettings().catch(() => DEFAULT_WORKOUTS_SETTINGS),
        workoutsApi.listWorkouts(),
        workoutsApi.listExercises(),
      ]);

      const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
      const remaining = new Set<MuscleGroup>(MUSCLE_GROUPS);
      const lastWorkoutByGroup: Partial<Record<MuscleGroup, Date>> = {};
      const sortedWorkouts = [...workouts].sort(
        (a, b) => getWorkoutRecoveryAnchor(b).getTime() - getWorkoutRecoveryAnchor(a).getTime(),
      );

      for (const workout of sortedWorkouts) {
        if (remaining.size === 0) break;

        const workoutExercises = await workoutsApi.listWorkoutExercises(workout.id);
        const trainedGroups = new Set<MuscleGroup>();

        for (const workoutExercise of workoutExercises) {
          const muscleGroup = exercisesById.get(workoutExercise.exercise_id)?.muscle_group as MuscleGroup | null | undefined;
          if (muscleGroup && remaining.has(muscleGroup)) {
            trainedGroups.add(muscleGroup);
          }
        }

        if (trainedGroups.size === 0) continue;

        const anchor = getWorkoutRecoveryAnchor(workout);
        for (const group of trainedGroups) {
          lastWorkoutByGroup[group] = anchor;
          remaining.delete(group);
        }
      }

      const nowMs = Date.now();
      const nextItems = MUSCLE_GROUPS.map((group) => {
        const recoveryHours = settings.recovery_hours[group] ?? DEFAULT_WORKOUTS_SETTINGS.recovery_hours[group];
        const lastWorkoutAt = lastWorkoutByGroup[group] ?? null;

        if (!lastWorkoutAt) {
          return {
            group,
            status: 'ready' as const,
            recoveryHours,
            hoursLeft: 0,
            progress: 1,
            lastWorkoutAt: null,
            readyAt: null,
          };
        }

        const readyAt = new Date(lastWorkoutAt.getTime() + recoveryHours * 60 * 60 * 1000);
        const diffMs = readyAt.getTime() - nowMs;
        const durationMs = recoveryHours * 60 * 60 * 1000;
        const progress = Math.max(0, Math.min(1, (nowMs - lastWorkoutAt.getTime()) / durationMs));

        return {
          group,
          status: diffMs > 0 ? 'recovering' as const : 'ready' as const,
          recoveryHours,
          hoursLeft: diffMs > 0 ? Math.ceil(diffMs / (60 * 60 * 1000)) : 0,
          progress: diffMs > 0 ? progress : 1,
          lastWorkoutAt,
          readyAt,
        };
      });

      setRecoveryItems(nextItems);
    } catch (err) {
      console.error('Failed to load recovery widget:', err);
    } finally {
      setRecoveryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayTasks();
    loadRecovery();
  }, [loadTodayTasks, loadRecovery]);

  const sortedTasks = useMemo(
    () => [...todayTasks].sort((a, b) => a.position - b.position),
    [todayTasks],
  );
  const readyMuscleGroups = recoveryItems.filter((item) => item.status === 'ready').length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-title">{t('dashboard.muscleRecovery')}</div>
            <div className="dashboard-card-count">{readyMuscleGroups}</div>
          </div>

          {recoveryLoading ? (
            <div className="dashboard-card-empty">{t('dashboard.loading')}</div>
          ) : (
            <div className="dashboard-recovery-body">
              <MuscleRecoveryWidget items={recoveryItems} />
            </div>
          )}
        </section>

        <section className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-card-title">{t('dashboard.todayTasks')}</div>
            <div className="dashboard-card-count">{sortedTasks.length}</div>
          </div>

          {loading ? (
            <div className="dashboard-card-empty">{t('dashboard.loading')}</div>
          ) : sortedTasks.length === 0 ? (
            <div className="dashboard-card-empty">{t('dashboard.noTasksToday')}</div>
          ) : (
            <div className="dashboard-task-list">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  draggable={false}
                  clickable={false}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function getWorkoutRecoveryAnchor(workout: Workout): Date {
  // Workouts only store a calendar date, so use evening of that day as a stable recovery anchor.
  return new Date(`${workout.workout_date}T18:00:00`);
}
