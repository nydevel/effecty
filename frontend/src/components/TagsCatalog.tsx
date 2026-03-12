import { useState } from 'react';
import { Button, Input, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Tag } from '../api/thoughts';

interface Props {
  tags: Tag[];
  onCreateTag: (name: string) => void;
}

export default function TagsCatalog({ tags, onCreateTag }: Props) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateTag(name);
    setNewName('');
  };

  return (
    <div className="exercise-catalog">
      <div className="exercise-catalog-header">
        <Typography.Text strong>{t('thoughts.tags')}</Typography.Text>
        <Input
          size="small"
          placeholder={t('thoughts.newTag')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={handleAdd}
          style={{ marginTop: 8 }}
          suffix={
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ marginRight: -7 }}
            />
          }
        />
      </div>
      <div className="exercise-catalog-list">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="exercise-catalog-item"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/tag-id', tag.id);
              e.dataTransfer.setData('application/tag-name', tag.name);
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            {tag.name}
          </div>
        ))}
      </div>
    </div>
  );
}
