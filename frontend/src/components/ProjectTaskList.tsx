import { useState } from 'react';
import AppButton from './ui/AppButton';
import { Input } from 'antd';
import { DeleteOutlined, PlusOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { ProjectTask, ProjectTaskStatus } from '../api/projects';

interface Props {
  tasks: ProjectTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: ProjectTaskStatus) => void;
}

const STATUS_CYCLE: ProjectTaskStatus[] = ['todo', 'in_progress', 'done'];

export default function ProjectTaskList({
  tasks,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onStatusChange,
}: Props) {
  const { t } = useTranslation();
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await onCreate(newTitle.trim());
    setNewTitle('');
  };

  const cycleStatus = (task: ProjectTask) => {
    const idx = STATUS_CYCLE.indexOf(task.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onStatusChange(task.id, next);
  };

  return (
    <div className="project-task-list">
      <div className="project-task-add">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder={t('projects.newTask')}
          onPressEnter={handleCreate}
          suffix={
            <AppButton
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              disabled={!newTitle.trim()}
            />
          }
        />
      </div>
      <div className="project-task-items">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`project-task-item ${selectedId === task.id ? 'selected' : ''} ${task.status === 'done' ? 'done' : ''}`}
            onClick={() => onSelect(task.id)}
          >
            <span
              className={`status-badge status-badge-project-${task.status}`}
              onClick={(e) => {
                e.stopPropagation();
                cycleStatus(task);
              }}
              style={{ cursor: 'pointer', flexShrink: 0 }}
            >
              {task.status === 'todo' && t('projects.statusTodo')}
              {task.status === 'in_progress' && t('projects.statusInProgress')}
              {task.status === 'done' && t('projects.statusDone')}
            </span>
            <span className="project-task-title">{task.title}</span>
            <AppButton
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
              className="project-task-delete"
            />
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="empty-state-small">{t('projects.noTasks')}</div>
        )}
      </div>
    </div>
  );
}
