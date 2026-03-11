import type { Task } from '../api/tasks';
import TaskCard from './TaskCard';

interface Props {
  year: number;
  month: number;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDayClick: (date: string) => void;
  onDropTask: (taskId: string, date: string) => void;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_VISIBLE = 3;

export default function CalendarMonthView({
  year,
  month,
  tasks,
  onTaskClick,
  onDayClick,
  onDropTask,
}: Props) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const totalDays = lastDay.getDate();
  const weeks: (Date | null)[][] = [];
  let current = -startOffset + 1;

  while (current <= totalDays) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      if (current >= 1 && current <= totalDays) {
        week.push(new Date(year, month, current));
      } else {
        week.push(null);
      }
      current++;
    }
    weeks.push(week);
  }

  const tasksByDate = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.task_date;
    if (!tasksByDate.has(key)) tasksByDate.set(key, []);
    tasksByDate.get(key)!.push(task);
  }

  const today = formatDate(new Date());

  return (
    <div className="calendar-month-grid">
      <div className="calendar-month-header">
        {DAY_NAMES.map((name) => (
          <div key={name} className="calendar-month-header-cell">{name}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="calendar-month-row">
          {week.map((day, di) => {
            if (!day) {
              return <div key={di} className="calendar-month-cell empty" />;
            }
            const dateStr = formatDate(day);
            const dayTasks = tasksByDate.get(dateStr) ?? [];
            const isToday = dateStr === today;

            return (
              <div
                key={di}
                className={`calendar-month-cell ${isToday ? 'today' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('taskId');
                  if (taskId) onDropTask(taskId, dateStr);
                }}
                onClick={() => onDayClick(dateStr)}
              >
                <div className={`calendar-month-day-number ${isToday ? 'today' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="calendar-month-tasks">
                  {dayTasks.slice(0, MAX_VISIBLE).map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
                  ))}
                  {dayTasks.length > MAX_VISIBLE && (
                    <div className="calendar-month-more">
                      +{dayTasks.length - MAX_VISIBLE} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
