import { useRef, useState } from 'react';
import AppButton from './ui/AppButton';
import { Input } from 'antd';
import { DeleteOutlined, HolderOutlined, PlusOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { ProjectTask, ProjectTaskStatus } from '../api/projects';

interface Props {
  tasks: ProjectTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: ProjectTaskStatus) => void;
  onReorder: (taskId: string, position: number) => Promise<void>;
  statusFilter: ProjectTaskStatus | 'all';
  onStatusFilterChange: (status: ProjectTaskStatus | 'all') => void;
}

const STATUS_CYCLE: ProjectTaskStatus[] = ['todo', 'in_progress', 'done'];

export default function ProjectTaskList({
  tasks,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onStatusChange,
  onReorder,
  statusFilter,
  onStatusFilterChange,
}: Props) {
  const { t } = useTranslation();
  const [newTitle, setNewTitle] = useState('');
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const canDrag = statusFilter === 'all';

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

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = async (e: React.DragEvent, targetIdx: number) => {
    if (!canDrag) return;
    e.preventDefault();
    const fromIdx = dragIdx.current;
    dragIdx.current = null;
    setDragOverIdx(null);
    if (fromIdx === null || fromIdx === targetIdx) return;

    const updated = [...tasks];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(targetIdx, 0, moved);

    const prevPos = targetIdx > 0 ? updated[targetIdx - 1].position : null;
    const nextPos = targetIdx < updated.length - 1 ? updated[targetIdx + 1].position : null;

    const newPosition = (() => {
      if (prevPos === null && nextPos === null) return moved.position;
      if (prevPos === null) return nextPos! + 1;
      if (nextPos === null) return prevPos - 1;
      return (prevPos + nextPos) / 2;
    })();

    await onReorder(moved.id, newPosition);
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
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
      <div className="project-task-toolbar">
        <div className="project-task-toolbar-title">{t('projects.filterStatus')}</div>
        <div className="project-task-filters">
          <AppButton
            size="small"
            type={statusFilter === 'all' ? 'primary' : 'default'}
            className="project-task-filter-btn"
            onClick={() => onStatusFilterChange('all')}
          >
            {t('projects.filterAll')}
          </AppButton>
          <AppButton
            size="small"
            type={statusFilter === 'todo' ? 'primary' : 'default'}
            className="project-task-filter-btn"
            onClick={() => onStatusFilterChange('todo')}
          >
            {t('projects.statusTodo')}
          </AppButton>
          <AppButton
            size="small"
            type={statusFilter === 'in_progress' ? 'primary' : 'default'}
            className="project-task-filter-btn"
            onClick={() => onStatusFilterChange('in_progress')}
          >
            {t('projects.statusInProgress')}
          </AppButton>
          <AppButton
            size="small"
            type={statusFilter === 'done' ? 'primary' : 'default'}
            className="project-task-filter-btn"
            onClick={() => onStatusFilterChange('done')}
          >
            {t('projects.statusDone')}
          </AppButton>
        </div>
      </div>
      <div className="project-task-items">
        {tasks.map((task, idx) => (
          <div
            key={task.id}
            className={`project-task-item ${selectedId === task.id ? 'selected' : ''} ${task.status === 'done' ? 'done' : ''} ${dragOverIdx === idx ? 'drag-over' : ''}`}
            draggable={canDrag}
            onDragStart={canDrag ? (e) => handleDragStart(e, idx) : undefined}
            onDragOver={canDrag ? (e) => handleDragOver(e, idx) : undefined}
            onDrop={canDrag ? (e) => handleDrop(e, idx) : undefined}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect(task.id)}
          >
            {canDrag && (
              <span className="project-task-drag-handle">
                <HolderOutlined />
              </span>
            )}
            <span
              className={`status-badge status-badge-project-${task.status} status-badge-clickable`}
              onClick={(e) => {
                e.stopPropagation();
                cycleStatus(task);
              }}
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
