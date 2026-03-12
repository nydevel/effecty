import { useState } from 'react';
import { Button, Input, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Exercise } from '../api/workouts';

interface Props {
  exercises: Exercise[];
  onCreateExercise: (name: string) => void;
}

export default function ExerciseCatalog({ exercises, onCreateExercise }: Props) {
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateExercise(name);
    setNewName('');
  };

  return (
    <div className="exercise-catalog">
      <div className="exercise-catalog-header">
        <Typography.Text strong>Exercises</Typography.Text>
      </div>
      <div className="exercise-catalog-list">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="exercise-catalog-item"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/exercise-name', ex.name);
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            {ex.name}
          </div>
        ))}
      </div>
      <div className="exercise-catalog-footer">
        <Input
          size="small"
          placeholder="New exercise..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={handleAdd}
          suffix={
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ marginRight: -7 }}
            />
          }
        />
      </div>
    </div>
  );
}
