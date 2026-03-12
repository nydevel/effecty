import { Button, Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Workout } from '../api/workouts';

interface Props {
  workouts: Workout[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

function formatWorkoutDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function WorkoutSidebar({
  workouts,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: Props) {
  const sorted = [...workouts].sort((a, b) => b.workout_date.localeCompare(a.workout_date));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Button size="small" icon={<PlusOutlined />} onClick={onCreate}>
          Workout
        </Button>
      </div>
      <div
        className="sidebar-tree"
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelect(null);
        }}
      >
        {sorted.map((workout) => (
          <Dropdown
            key={workout.id}
            menu={{
              items: [
                {
                  key: 'delete',
                  label: 'Delete',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => onDelete(workout.id),
                },
              ],
            }}
            trigger={['contextMenu']}
          >
            <div
              className={`workout-list-item ${selectedId === workout.id ? 'selected' : ''}`}
              onClick={() => onSelect(workout.id)}
            >
              {formatWorkoutDate(workout.workout_date)}
            </div>
          </Dropdown>
        ))}
      </div>
    </div>
  );
}
