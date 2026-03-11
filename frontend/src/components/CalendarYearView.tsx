import type { Task } from '../api/tasks';

interface Props {
  year: number;
  tasks: Task[];
  onMonthClick: (month: number) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAY_NAMES = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function CalendarYearView({ year, tasks, onMonthClick }: Props) {
  const taskDates = new Set(tasks.map((t) => t.task_date));
  const today = formatDate(new Date());

  return (
    <div className="calendar-year-grid">
      {MONTH_NAMES.map((name, month) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startOffset = firstDay.getDay() - 1;
        if (startOffset < 0) startOffset = 6;

        const cells: (number | null)[] = [];
        for (let i = 0; i < startOffset; i++) cells.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

        return (
          <div
            key={month}
            className="calendar-year-month"
            onClick={() => onMonthClick(month)}
          >
            <div className="calendar-year-month-title">{name}</div>
            <div className="calendar-year-mini-grid">
              {DAY_NAMES.map((d, i) => (
                <div key={i} className="calendar-year-mini-header">{d}</div>
              ))}
              {cells.map((day, i) => {
                if (day === null) {
                  return <div key={i} className="calendar-year-mini-cell empty" />;
                }
                const dateStr = formatDate(new Date(year, month, day));
                const hasTask = taskDates.has(dateStr);
                const isToday = dateStr === today;
                return (
                  <div
                    key={i}
                    className={`calendar-year-mini-cell ${hasTask ? 'has-task' : ''} ${isToday ? 'today' : ''}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
