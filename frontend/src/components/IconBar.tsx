import { Tooltip } from 'antd';
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

  return (
    <div className="icon-bar">
      <Tooltip title={t('iconBar.dashboard')} placement="right">
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectFeature('dashboard')}
        >
          <LayoutDashboard {...iconProps} />
        </button>
      </Tooltip>
      <div className="icon-bar-divider" />
      <Tooltip title={t('iconBar.notes')} placement="right">
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'notes' ? 'active' : ''}`}
          onClick={() => onSelectFeature('notes')}
        >
          <FileText {...iconProps} />
        </button>
      </Tooltip>
      <Tooltip title={t('iconBar.calendar')} placement="right">
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'calendar' ? 'active' : ''}`}
          onClick={() => onSelectFeature('calendar')}
        >
          <CalendarDays {...iconProps} />
        </button>
      </Tooltip>
      <Tooltip title={t('iconBar.workouts')} placement="right">
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'workouts' ? 'active' : ''}`}
          onClick={() => onSelectFeature('workouts')}
        >
          <Dumbbell {...iconProps} />
        </button>
      </Tooltip>
      <Tooltip title={t('iconBar.thoughts')} placement="right">
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'thoughts' ? 'active' : ''}`}
          onClick={() => onSelectFeature('thoughts')}
        >
          <Lightbulb {...iconProps} />
        </button>
      </Tooltip>
      <Tooltip title={t('iconBar.learning')} placement="right">
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'learning' ? 'active' : ''}`}
          onClick={() => onSelectFeature('learning')}
        >
          <BookOpen {...iconProps} />
        </button>
      </Tooltip>
      <Tooltip title={t('iconBar.medical')} placement="right">
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'medical' ? 'active' : ''}`}
          onClick={() => onSelectFeature('medical')}
        >
          <HeartPulse {...iconProps} />
        </button>
      </Tooltip>
      <Tooltip title={t('iconBar.projects')} placement="right">
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'projects' ? 'active' : ''}`}
          onClick={() => onSelectFeature('projects')}
        >
          <KanbanSquare {...iconProps} />
        </button>
      </Tooltip>
      <div className="icon-bar-spacer" />
      <Tooltip title={t('iconBar.settings')} placement="right">
        <button
          type="button"
          className={`icon-btn ${activeFeature === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectFeature('settings')}
        >
          <Settings {...iconProps} />
        </button>
      </Tooltip>
      <Tooltip title={t('iconBar.logout')} placement="right">
        <button
          type="button"
          className="icon-btn"
          onClick={onLogout}
        >
          <LogOut {...iconProps} />
        </button>
      </Tooltip>
    </div>
  );
}
