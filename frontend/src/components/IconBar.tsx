import { Button, Tooltip } from 'antd';
import { FileTextOutlined, CalendarOutlined, TrophyOutlined, LogoutOutlined } from '@ant-design/icons';

type Feature = 'notes' | 'calendar' | 'workouts';

interface Props {
  activeFeature: Feature;
  onSelectFeature: (feature: Feature) => void;
  onLogout: () => void;
}

export default function IconBar({ activeFeature, onSelectFeature, onLogout }: Props) {
  return (
    <div className="icon-bar">
      <Tooltip title="Notes" placement="right">
        <Button
          type="text"
          icon={<FileTextOutlined />}
          className={`icon-btn ${activeFeature === 'notes' ? 'active' : ''}`}
          onClick={() => onSelectFeature('notes')}
        />
      </Tooltip>
      <Tooltip title="Calendar" placement="right">
        <Button
          type="text"
          icon={<CalendarOutlined />}
          className={`icon-btn ${activeFeature === 'calendar' ? 'active' : ''}`}
          onClick={() => onSelectFeature('calendar')}
        />
      </Tooltip>
      <Tooltip title="Workouts" placement="right">
        <Button
          type="text"
          icon={<TrophyOutlined />}
          className={`icon-btn ${activeFeature === 'workouts' ? 'active' : ''}`}
          onClick={() => onSelectFeature('workouts')}
        />
      </Tooltip>
      <div className="icon-bar-spacer" />
      <Tooltip title="Logout" placement="right">
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
