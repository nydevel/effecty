import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as tasksApi from '../api/tasks';
import type { Task } from '../api/tasks';
import TaskCard from '../components/TaskCard';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  draggable={false}
                  clickable={false}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
