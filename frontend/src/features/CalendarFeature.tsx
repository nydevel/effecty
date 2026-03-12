import { useCallback, useEffect, useState } from 'react';
import { Button, Segmented, Space, Typography } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as tasksApi from '../api/tasks';
import type { Task } from '../api/tasks';
import CalendarWeekView from '../components/CalendarWeekView';
import CalendarMonthView from '../components/CalendarMonthView';
import CalendarYearView from '../components/CalendarYearView';
import TaskModal from '../components/TaskModal';

type ViewMode = 'Week' | 'Month' | 'Year';

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDateRange(viewMode: ViewMode, currentDate: Date): { from: string; to: string } {
  if (viewMode === 'Week') {
    const monday = getMonday(currentDate);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { from: formatDate(monday), to: formatDate(sunday) };
  }
  if (viewMode === 'Month') {
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return { from: formatDate(first), to: formatDate(last) };
  }
  return {
    from: `${currentDate.getFullYear()}-01-01`,
    to: `${currentDate.getFullYear()}-12-31`,
  };
}

function getPeriodLabel(
  viewMode: ViewMode,
  currentDate: Date,
  monthsFull: string[],
  monthsShort: string[],
): string {
  if (viewMode === 'Year') {
    return String(currentDate.getFullYear());
  }
  if (viewMode === 'Month') {
    return `${monthsFull[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }
  const monday = getMonday(currentDate);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const from = `${monday.getDate()} ${monthsShort[monday.getMonth()]}`;
  const to = `${sunday.getDate()} ${monthsShort[sunday.getMonth()]} ${sunday.getFullYear()}`;
  return `${from} – ${to}`;
}

export default function CalendarFeature() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('Week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);

  const monthsFull = t('calendar.monthsFull', { returnObjects: true }) as string[];
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[];

  const loadTasks = useCallback(async () => {
    const { from, to } = getDateRange(viewMode, currentDate);
    try {
      const result = await tasksApi.listTasks(from, to);
      setTasks(result);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, [viewMode, currentDate]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const navigate = (direction: -1 | 1) => {
    const d = new Date(currentDate);
    if (viewMode === 'Week') d.setDate(d.getDate() + direction * 7);
    else if (viewMode === 'Month') d.setMonth(d.getMonth() + direction);
    else d.setFullYear(d.getFullYear() + direction);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setModalDate(task.task_date);
  };

  const handleDayClick = (date: string) => {
    setEditingTask(null);
    setModalDate(date);
  };

  const handleDropTask = async (taskId: string, date: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.task_date === date) return;
    await tasksApi.moveTask(taskId, { task_date: date, position: task.position });
    await loadTasks();
  };

  const handleSave = async (data: {
    title: string;
    content: string;
    priority: number;
    task_date: string;
    time_start: string | null;
    time_end: string | null;
  }) => {
    if (editingTask) {
      await tasksApi.updateTask(editingTask.id, data);
    } else {
      await tasksApi.createTask(data);
    }
    setModalDate(null);
    setEditingTask(null);
    await loadTasks();
  };

  const handleDelete = async () => {
    if (editingTask) {
      await tasksApi.deleteTask(editingTask.id);
      setModalDate(null);
      setEditingTask(null);
      await loadTasks();
    }
  };

  const handleMonthClick = (month: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
    setViewMode('Month');
  };

  return (
    <div className="calendar-feature">
      <div className="calendar-toolbar">
        <Space>
          <Button onClick={goToday}>{t('calendar.today')}</Button>
          <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} />
          <Button icon={<RightOutlined />} onClick={() => navigate(1)} />
          <Typography.Text strong style={{ fontSize: 15 }}>
            {getPeriodLabel(viewMode, currentDate, monthsFull, monthsShort)}
          </Typography.Text>
        </Space>
        <div style={{ flex: 1 }} />
        <Segmented
          options={[
            { label: t('calendar.week'), value: 'Week' },
            { label: t('calendar.month'), value: 'Month' },
            { label: t('calendar.year'), value: 'Year' },
          ]}
          value={viewMode}
          onChange={(val) => setViewMode(val as ViewMode)}
        />
      </div>

      <div className="calendar-body">
        {viewMode === 'Week' && (
          <CalendarWeekView
            weekStart={getMonday(currentDate)}
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onDayClick={handleDayClick}
            onDropTask={handleDropTask}
          />
        )}
        {viewMode === 'Month' && (
          <CalendarMonthView
            year={currentDate.getFullYear()}
            month={currentDate.getMonth()}
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onDayClick={handleDayClick}
            onDropTask={handleDropTask}
          />
        )}
        {viewMode === 'Year' && (
          <CalendarYearView
            year={currentDate.getFullYear()}
            tasks={tasks}
            onMonthClick={handleMonthClick}
          />
        )}
      </div>

      {modalDate && (
        <TaskModal
          task={editingTask}
          defaultDate={modalDate}
          onSave={handleSave}
          onDelete={editingTask ? handleDelete : undefined}
          onClose={() => { setModalDate(null); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
