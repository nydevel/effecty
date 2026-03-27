import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Task } from '../api/tasks';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'green',
  2: 'orange',
  3: 'red',
};

const PRIORITY_KEYS: Record<number, string> = {
  1: 'tasks.low',
  2: 'tasks.med',
  3: 'tasks.high',
};

interface Props {
  task: Task;
  onClick?: () => void;
  draggable?: boolean;
  clickable?: boolean;
}

export default function TaskCard({
  task,
  onClick,
  draggable = true,
  clickable = true,
}: Props) {
  const { t } = useTranslation();
  const color = PRIORITY_COLORS[task.priority];
  const labelKey = PRIORITY_KEYS[task.priority];

  return (
    <div
      className={`task-card ${draggable ? 'draggable' : 'static'} ${clickable ? 'clickable' : ''}`}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <div className="task-card-header">
        <span className="task-card-title">{task.title || t('tasks.untitled')}</span>
        {color && labelKey && <Tag className="task-card-priority-tag" color={color}>{t(labelKey)}</Tag>}
      </div>
      {task.time_start && (
        <div className="task-card-time">
          {task.time_start.slice(0, 5)}
          {task.time_end ? ` – ${task.time_end.slice(0, 5)}` : ''}
        </div>
      )}
    </div>
  );
}
