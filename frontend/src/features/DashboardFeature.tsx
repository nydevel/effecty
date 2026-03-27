import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as tasksApi from '../api/tasks';
import type { Task } from '../api/tasks';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const PRIORITY_LABEL_KEYS: Record<number, string> = {
  1: 'tasks.low',
  2: 'tasks.med',
  3: 'tasks.high',
};

const PRIORITY_CLASS_NAMES: Record<number, string> = {
  1: 'priority-low',
  2: 'priority-med',
  3: 'priority-high',
};

export default function DashboardFeature() {
  const { t } = useTranslation();
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    loadTodayTasks();
  }, [loadTodayTasks]);

  const sortedTasks = useMemo(
    () => [...todayTasks].sort((a, b) => a.position - b.position),
    [todayTasks],
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-grid">
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
              {sortedTasks.map((task) => {
                const priorityLabelKey = PRIORITY_LABEL_KEYS[task.priority];
                const priorityClassName = PRIORITY_CLASS_NAMES[task.priority];
                const hasTime = Boolean(task.time_start);
                return (
                  <div key={task.id} className="dashboard-task-item">
                    <div className="dashboard-task-main">
                      <div className="dashboard-task-title">{task.title || t('tasks.untitled')}</div>
                      {hasTime && (
                        <div className="dashboard-task-time">
                          {task.time_start?.slice(0, 5)}
                          {task.time_end ? ` - ${task.time_end.slice(0, 5)}` : ''}
                        </div>
                      )}
                    </div>
                    {priorityLabelKey && priorityClassName && (
                      <span className={`dashboard-task-priority ${priorityClassName}`}>
                        {t(priorityLabelKey)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
