import { Tag } from 'antd';
import type { Task } from '../api/tasks';

const PRIORITY_CONFIG: Record<number, { color: string; label: string }> = {
  1: { color: 'green', label: 'Low' },
  2: { color: 'orange', label: 'Med' },
  3: { color: 'red', label: 'High' },
};

interface Props {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: Props) {
  const priority = PRIORITY_CONFIG[task.priority];

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('taskId', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <div className="task-card-header">
        <span className="task-card-title">{task.title || 'Untitled'}</span>
        {priority && <Tag color={priority.color} style={{ marginLeft: 'auto', marginRight: 0 }}>{priority.label}</Tag>}
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
