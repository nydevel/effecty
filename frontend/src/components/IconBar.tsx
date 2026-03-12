import { Button, Tooltip } from 'antd';
import {
  FileTextOutlined,
  CalendarOutlined,
  TrophyOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

type Feature = 'notes' | 'calendar' | 'workouts' | 'settings';

interface Props {
  activeFeature: Feature;
  onSelectFeature: (feature: Feature) => void;
  onLogout: () => void;
}

export default function IconBar({ activeFeature, onSelectFeature, onLogout }: Props) {
  const { t } = useTranslation();

  return (
    <div className="icon-bar">
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
          icon={<TrophyOutlined />}
          className={`icon-btn ${activeFeature === 'workouts' ? 'active' : ''}`}
          onClick={() => onSelectFeature('workouts')}
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
