import { useState } from 'react';
import { DatePicker, Input, Button, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { WorkoutExercise } from '../api/workouts';

interface Props {
  workoutDate: string;
  exercises: WorkoutExercise[];
  onDateChange: (date: string) => void;
  onUpdateStats: (weId: string, data: { sets?: string; reps?: string; weight?: string }) => void;
  onRemoveExercise: (weId: string) => void;
  onDropExercise: (exerciseName: string) => void;
}

export default function WorkoutForm({
  workoutDate,
  exercises,
  onDateChange,
  onUpdateStats,
  onRemoveExercise,
  onDropExercise,
}: Props) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className="workout-form"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/exercise-name')) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const name = e.dataTransfer.getData('application/exercise-name');
        if (name) onDropExercise(name);
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong>Date</Typography.Text>
        <DatePicker
          value={dayjs(workoutDate)}
          onChange={(d) => { if (d) onDateChange(d.format('YYYY-MM-DD')); }}
          style={{ marginLeft: 8 }}
        />
      </div>

      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Exercises
      </Typography.Text>

      {exercises.length > 0 && (
        <div className="workout-exercise-header-row">
          <span className="workout-exercise-name">Name</span>
          <span className="workout-exercise-stat-label">Sets</span>
          <span className="workout-exercise-stat-label">Reps</span>
          <span className="workout-exercise-stat-label">Weight</span>
          <span style={{ width: 32 }} />
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

      <div className={`workout-drop-zone ${dragOver ? 'active' : ''}`}>
        Drag an exercise here to add
      </div>
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
      <Button
        type="text"
        size="small"
        icon={<DeleteOutlined />}
        className="workout-exercise-delete"
        onClick={onRemove}
      />
    </div>
  );
}
