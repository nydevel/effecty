import { useState } from 'react';
import { Button, Input, List } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Specialty } from '../api/medical';

interface Props {
  specialties: Specialty[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function SpecialtySidebar({ specialties, selectedId, onSelect, onCreate, onDelete }: Props) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onCreate(newName.trim());
    setNewName('');
    setAdding(false);
  };

  return (
    <div className="sidebar medical-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">{t('medical.specialties')}</span>
        <Button
          type="text"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setAdding(true)}
        />
      </div>
      {adding && (
        <div className="specialty-add-row">
          <Input
            size="small"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onPressEnter={handleAdd}
            onBlur={() => {
              if (!newName.trim()) setAdding(false);
            }}
            placeholder={t('medical.specialtyName')}
          />
        </div>
      )}
      <div
        className={`specialty-item ${selectedId === null ? 'selected' : ''}`}
        onClick={() => onSelect(null)}
      >
        {t('medical.allSpecialties')}
      </div>
      <List
        dataSource={specialties}
        renderItem={(item) => (
          <div
            className={`specialty-item ${selectedId === item.id ? 'selected' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="specialty-name">{item.name}</span>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              className="specialty-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            />
          </div>
        )}
      />
    </div>
  );
}
