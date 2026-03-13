import { Button, Dropdown } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Topic } from '../api/learning';

interface Props {
  topics: Topic[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export default function TopicSidebar({ topics, selectedId, onSelect, onCreate, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Button
          type="text"
          icon={<PlusOutlined />}
          size="small"
          onClick={onCreate}
        >
          {t('learning.newTopic')}
        </Button>
      </div>
      <div className="sidebar-tree">
        <div
          className={`topic-list-item ${selectedId === null ? 'selected' : ''}`}
          onClick={() => onSelect(null)}
        >
          {t('learning.allMaterials')}
        </div>
        {topics.map((topic) => (
          <Dropdown
            key={topic.id}
            menu={{
              items: [
                {
                  key: 'delete',
                  label: t('learning.delete'),
                  danger: true,
                  onClick: () => onDelete(topic.id),
                },
              ],
            }}
            trigger={['contextMenu']}
          >
            <div
              className={`topic-list-item ${selectedId === topic.id ? 'selected' : ''}`}
              onClick={() => onSelect(topic.id)}
            >
              {topic.name || t('learning.untitled')}
            </div>
          </Dropdown>
        ))}
      </div>
    </div>
  );
}
