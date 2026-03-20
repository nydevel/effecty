import { useTranslation } from 'react-i18next';
import type { Task } from '../api/tasks';
import TaskCard from './TaskCard';

interface Props {
  weekStart: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDayClick: (date: string) => void;
  onDropTask: (taskId: string, date: string) => void;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarWeekView({
  weekStart,
  tasks,
  onTaskClick,
  onDayClick,
  onDropTask,
}: Props) {
  const { t } = useTranslation();
  const dayNames = t('calendar.daysShort', { returnObjects: true }) as string[];

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const tasksByDate = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.task_date;
    if (!tasksByDate.has(key)) tasksByDate.set(key, []);
    tasksByDate.get(key)!.push(task);
  }

  const today = formatDate(new Date());

  return (
    <div className="calendar-week-grid">
      {days.map((day, i) => {
        const dateStr = formatDate(day);
        const dayTasks = tasksByDate.get(dateStr) ?? [];
        const isToday = dateStr === today;

        return (
          <div
            key={dateStr}
            className={`calendar-day-column ${isToday ? 'today' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('taskId');
              if (taskId) onDropTask(taskId, dateStr);
            }}
            onClick={() => onDayClick(dateStr)}
          >
            <div className="calendar-day-header">
              <span className="calendar-day-name">{dayNames[i]}</span>
              <span className={`calendar-day-number ${isToday ? 'today' : ''}`}>
                {day.getDate()}
              </span>
            </div>
            <div className="calendar-day-tasks">
              {dayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
