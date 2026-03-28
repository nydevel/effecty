import AppButton from './ui/AppButton';
import { Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { Workout } from '../api/workouts';

interface Props {
  workouts: Workout[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatWorkoutDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const jsLocale = locale === 'ru' ? 'ru-RU' : 'en-US';
  return d.toLocaleDateString(jsLocale, {
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
  onDuplicate,
  onDelete,
}: Props) {
  const { t, i18n } = useTranslation();
  const sorted = [...workouts].sort((a, b) => b.workout_date.localeCompare(a.workout_date));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">{t('iconBar.workouts')}</div>
        <AppButton type="text" className="sidebar-add-btn" size="small" icon={<PlusOutlined />} onClick={onCreate}>
          {t('workouts.newWorkout')}
        </AppButton>
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
                  key: 'duplicate',
                  label: t('workouts.duplicate'),
                  icon: <CopyOutlined />,
                  onClick: () => onDuplicate(workout.id),
                },
                {
                  key: 'delete',
                  label: t('workouts.delete'),
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
              {formatWorkoutDate(workout.workout_date, i18n.language)}
            </div>
          </Dropdown>
        ))}
      </div>
    </div>
  );
}
