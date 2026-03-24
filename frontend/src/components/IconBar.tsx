import { Button, Tooltip } from 'antd';
import Icon, {
  DashboardOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BulbOutlined,
  ReadOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const DumbbellSvg = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M6.5 6a1.5 1.5 0 0 0-1.5 1.5v2H4a1.5 1.5 0 0 0-1.5 1.5v2A1.5 1.5 0 0 0 4 14.5h1v2A1.5 1.5 0 0 0 6.5 18h1A1.5 1.5 0 0 0 9 16.5v-4h6v4a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5v-2h1a1.5 1.5 0 0 0 1.5-1.5v-2A1.5 1.5 0 0 0 20 9.5h-1v-2A1.5 1.5 0 0 0 17.5 6h-1A1.5 1.5 0 0 0 15 7.5v4H9v-4A1.5 1.5 0 0 0 7.5 6h-1Z" />
  </svg>
);

const DumbbellOutlined = (props: Record<string, unknown>) => (
  <Icon component={DumbbellSvg} {...props} />
);
import { useTranslation } from 'react-i18next';

type Feature = 'dashboard' | 'notes' | 'calendar' | 'workouts' | 'thoughts' | 'learning' | 'medical' | 'settings';

interface Props {
  activeFeature: Feature;
  onSelectFeature: (feature: Feature) => void;
  onLogout: () => void;
}

export default function IconBar({ activeFeature, onSelectFeature, onLogout }: Props) {
  const { t } = useTranslation();

  return (
    <div className="icon-bar">
      <Tooltip title={t('iconBar.dashboard')} placement="right">
        <Button
          type="text"
          icon={<DashboardOutlined />}
          className={`icon-btn ${activeFeature === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectFeature('dashboard')}
        />
      </Tooltip>
      <div className="icon-bar-divider" />
      <Tooltip title={t('iconBar.notes')} placement="right">
        <Button
          type="text"
          icon={<FileTextOutlined />}
          className={`icon-btn ${activeFeature === 'notes' ? 'active' : ''}`}
          onClick={() => onSelectFeature('notes')}
        />
      </Tooltip>
      <Tooltip title={t('iconBar.calendar')} placement="right">
        <Button
          type="text"
          icon={<CalendarOutlined />}
          className={`icon-btn ${activeFeature === 'calendar' ? 'active' : ''}`}
          onClick={() => onSelectFeature('calendar')}
        />
      </Tooltip>
      <Tooltip title={t('iconBar.workouts')} placement="right">
        <Button
          type="text"
          icon={<DumbbellOutlined />}
          className={`icon-btn ${activeFeature === 'workouts' ? 'active' : ''}`}
          onClick={() => onSelectFeature('workouts')}
        />
      </Tooltip>
      <Tooltip title={t('iconBar.thoughts')} placement="right">
        <Button
          type="text"
          icon={<BulbOutlined />}
          className={`icon-btn ${activeFeature === 'thoughts' ? 'active' : ''}`}
          onClick={() => onSelectFeature('thoughts')}
        />
      </Tooltip>
      <Tooltip title={t('iconBar.learning')} placement="right">
        <Button
          type="text"
          icon={<ReadOutlined />}
          className={`icon-btn ${activeFeature === 'learning' ? 'active' : ''}`}
          onClick={() => onSelectFeature('learning')}
        />
      </Tooltip>
      <Tooltip title={t('iconBar.medical')} placement="right">
        <Button
          type="text"
          icon={<MedicineBoxOutlined />}
          className={`icon-btn ${activeFeature === 'medical' ? 'active' : ''}`}
          onClick={() => onSelectFeature('medical')}
        />
      </Tooltip>
      <div className="icon-bar-spacer" />
      <Tooltip title={t('iconBar.settings')} placement="right">
        <Button
          type="text"
          icon={<SettingOutlined />}
          className={`icon-btn ${activeFeature === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectFeature('settings')}
        />
      </Tooltip>
      <Tooltip title={t('iconBar.logout')} placement="right">
        <Button
          type="text"
          icon={<LogoutOutlined />}
          className="icon-btn"
          onClick={onLogout}
        />
      </Tooltip>
    </div>
  );
}
