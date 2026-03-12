import { useRef } from 'react';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Thought } from '../api/thoughts';

interface Props {
  thoughts: Thought[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onMove: (id: string, position: number) => void;
}

export default function ThoughtSidebar({
  thoughts,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onMove,
}: Props) {
  const { t } = useTranslation();
  const dragItemRef = useRef<string | null>(null);
  const dragOverRef = useRef<string | null>(null);

  const handleDragStart = (id: string) => {
    dragItemRef.current = id;
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverRef.current = id;
  };

  const handleDrop = () => {
    const dragId = dragItemRef.current;
    const overId = dragOverRef.current;
    dragItemRef.current = null;
    dragOverRef.current = null;

    if (!dragId || !overId || dragId === overId) return;

    const overIdx = thoughts.findIndex((th) => th.id === overId);
    if (overIdx < 0) return;

    const overPos = thoughts[overIdx].position;
    const prevPos = overIdx > 0 ? thoughts[overIdx - 1].position : overPos - 1;
    const newPosition = (prevPos + overPos) / 2;

    onMove(dragId, newPosition);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Button size="small" icon={<PlusOutlined />} onClick={onCreate}>
          {t('thoughts.newThought')}
        </Button>
      </div>
      <div
        className="sidebar-tree"
        onClick={(e) => {
          if (e.target === e.currentTarget) onSelect(null);
        }}
      >
        {thoughts.map((thought) => (
          <Dropdown
            key={thought.id}
            menu={{
              items: [
                {
                  key: 'delete',
                  label: t('thoughts.delete'),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => onDelete(thought.id),
                },
              ],
            }}
            trigger={['contextMenu']}
          >
            <div
              className={`workout-list-item ${selectedId === thought.id ? 'selected' : ''}`}
              onClick={() => onSelect(thought.id)}
              draggable
              onDragStart={() => handleDragStart(thought.id)}
              onDragOver={(e) => handleDragOver(e, thought.id)}
              onDrop={handleDrop}
            >
              {thought.title || t('thoughts.untitled')}
            </div>
          </Dropdown>
        ))}
      </div>
    </div>
  );
}
