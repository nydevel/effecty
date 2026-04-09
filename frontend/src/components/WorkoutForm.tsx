import { useState } from 'react';
import AppButton from './ui/AppButton';
import { DatePicker, Input, Typography } from 'antd';
import { DeleteOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { WorkoutExercise } from '../api/workouts';

interface Props {
  workoutDate: string;
  exercises: WorkoutExercise[];
  onDateChange: (date: string) => void;
  onUpdateStats: (weId: string, data: { sets?: string; reps?: string; weight?: string }) => void;
  onRemoveExercise: (weId: string) => void;
}

export default function WorkoutForm({
  workoutDate,
  exercises,
  onDateChange,
  onUpdateStats,
  onRemoveExercise,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="workout-form">
      <div className="workout-date-row">
        <Typography.Text strong>{t('workouts.date')}</Typography.Text>
        <DatePicker
          value={dayjs(workoutDate)}
          onChange={(d) => { if (d) onDateChange(d.format('YYYY-MM-DD')); }}
          className="workout-date-picker"
        />
      </div>

      <Typography.Text strong className="workout-section-title">
        {t('workouts.exercises')}
      </Typography.Text>

      {exercises.length > 0 && (
        <div className="workout-exercise-header-row">
          <span className="workout-exercise-name">{t('workouts.name')}</span>
          <span className="workout-exercise-stat-label">{t('workouts.sets')}</span>
          <span className="workout-exercise-stat-label">{t('workouts.reps')}</span>
          <span className="workout-exercise-stat-label">{t('workouts.weight')}</span>
          <span className="workout-row-spacer" />
        </div>
      )}

      {exercises.map((we) => (
        <ExerciseRow
          key={we.id}
          exercise={we}
          onUpdateStats={(data) => onUpdateStats(we.id, data)}
          onRemove={() => onRemoveExercise(we.id)}
        />
      ))}
    </div>
  );
}

interface ExerciseRowProps {
  exercise: WorkoutExercise;
  onUpdateStats: (data: { sets?: string; reps?: string; weight?: string }) => void;
  onRemove: () => void;
}

function ExerciseRow({ exercise, onUpdateStats, onRemove }: ExerciseRowProps) {
  const [sets, setSets] = useState(exercise.sets);
  const [reps, setReps] = useState(exercise.reps);
  const [weight, setWeight] = useState(exercise.weight);

  const handleBlur = (field: 'sets' | 'reps' | 'weight', value: string) => {
    const original = exercise[field];
    if (value !== original) {
      onUpdateStats({ [field]: value });
    }
  };

  return (
    <div className="workout-exercise-row">
      <span className="workout-exercise-name">{exercise.exercise_name}</span>
      <Input
        className="workout-exercise-stat"
        size="small"
        placeholder="—"
        value={sets}
        onChange={(e) => setSets(e.target.value)}
        onBlur={() => handleBlur('sets', sets)}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
      <Input
        className="workout-exercise-stat"
        size="small"
        placeholder="—"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => handleBlur('reps', reps)}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
      <Input
        className="workout-exercise-stat"
        size="small"
        placeholder="—"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => handleBlur('weight', weight)}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
      <AppButton
        type="text"
        size="small"
        icon={<DeleteOutlined />}
        className="workout-exercise-delete"
        onClick={onRemove}
      />
    </div>
  );
}
