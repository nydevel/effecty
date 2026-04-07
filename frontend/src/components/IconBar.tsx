import { Tooltip } from 'antd';
import { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Dumbbell,
  Lightbulb,
  BookOpen,
  HeartPulse,
  KanbanSquare,
  Settings,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Feature = 'dashboard' | 'notes' | 'calendar' | 'workouts' | 'thoughts' | 'learning' | 'medical' | 'projects' | 'settings';

interface Props {
  activeFeature: Feature;
  onSelectFeature: (feature: Feature) => void;
  onLogout: () => void;
}

export default function IconBar({ activeFeature, onSelectFeature, onLogout }: Props) {
  const { t } = useTranslation();
  const iconProps = { size: 22, strokeWidth: 2 } as const;
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setTooltipsEnabled(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const withTooltip = (title: string, child: ReactNode) => {
    if (!tooltipsEnabled) return child;
    return <Tooltip title={title} placement="right">{child}</Tooltip>;
  };

  return (
    <div className="icon-bar">
      {withTooltip(t('iconBar.dashboard'),
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectFeature('dashboard')}
        >
          <LayoutDashboard {...iconProps} />
        </button>
      )}
      <div className="icon-bar-divider" />
      {withTooltip(t('iconBar.notes'),
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'notes' ? 'active' : ''}`}
          onClick={() => onSelectFeature('notes')}
        >
          <FileText {...iconProps} />
        </button>
      )}
      {withTooltip(t('iconBar.calendar'),
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'calendar' ? 'active' : ''}`}
          onClick={() => onSelectFeature('calendar')}
        >
          <CalendarDays {...iconProps} />
        </button>
      )}
      {withTooltip(t('iconBar.workouts'),
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'workouts' ? 'active' : ''}`}
          onClick={() => onSelectFeature('workouts')}
        >
          <Dumbbell {...iconProps} />
        </button>
      )}
      {withTooltip(t('iconBar.thoughts'),
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'thoughts' ? 'active' : ''}`}
          onClick={() => onSelectFeature('thoughts')}
        >
          <Lightbulb {...iconProps} />
        </button>
      )}
      {withTooltip(t('iconBar.learning'),
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'learning' ? 'active' : ''}`}
          onClick={() => onSelectFeature('learning')}
        >
          <BookOpen {...iconProps} />
        </button>
      )}
      {withTooltip(t('iconBar.medical'),
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'medical' ? 'active' : ''}`}
          onClick={() => onSelectFeature('medical')}
        >
          <HeartPulse {...iconProps} />
        </button>
      )}
      {withTooltip(t('iconBar.projects'),
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'projects' ? 'active' : ''}`}
          onClick={() => onSelectFeature('projects')}
        >
          <KanbanSquare {...iconProps} />
        </button>
      )}
      <div className="icon-bar-spacer" />
      {withTooltip(t('iconBar.settings'),
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectFeature('settings')}
        >
          <Settings {...iconProps} />
        </button>
      )}
      {withTooltip(t('iconBar.logout'),
        <button
          type="button"
          className="icon-btn"
          onClick={onLogout}
        >
          <LogOut {...iconProps} />
        </button>
      )}
    </div>
  );
}
