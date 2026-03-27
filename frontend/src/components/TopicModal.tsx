import { useState } from 'react';
import { Modal, Input, Tag as AntTag } from 'antd';
import { PlusOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { Tag } from '../api/thoughts';

interface Props {
  open: boolean;
  tags: Tag[];
  onCancel: () => void;
  onOk: (name: string, tagIds: string[]) => void;
  onCreateTag: (name: string) => Promise<Tag>;
}

export default function TopicModal({ open, tags, onCancel, onOk, onCreateTag }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

  const handleOk = () => {
    if (!name.trim() || selectedTagIds.length === 0) return;
    onOk(name.trim(), selectedTagIds);
    setName('');
    setSelectedTagIds([]);
    setNewTagName('');
  };

  const handleCancel = () => {
    setName('');
    setSelectedTagIds([]);
    setNewTagName('');
    onCancel();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    const newTag = await onCreateTag(trimmed);
    setSelectedTagIds((prev) => [...prev, newTag.id]);
    setNewTagName('');
  };

  const handleNewTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateTag();
    }
  };

  const availableTags = tags.filter((tag) => !selectedTagIds.includes(tag.id));

  return (
    <Modal
      title={t('learning.newTopic')}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={t('learning.save')}
      cancelText={t('learning.cancel')}
      okButtonProps={{ disabled: !name.trim() || selectedTagIds.length === 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        <Input
          placeholder={t('learning.topicName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <div>
          <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>
            {t('learning.selectedTags')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 28 }}>
            {selectedTagIds.length === 0 && (
              <span style={{ color: '#bbb', fontSize: 13 }}>{t('learning.noTagsSelected')}</span>
            )}
            {selectedTagIds.map((tagId) => {
              const tag = tags.find((tg) => tg.id === tagId);
              return (
                <AntTag
                  key={tagId}
                  color="blue"
                  closable
                  onClose={() => toggleTag(tagId)}
                >
                  {tag?.name ?? tagId}
                </AntTag>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>
            {t('learning.createTag')}
          </div>
          <Input
            placeholder={t('learning.newTagPlaceholder')}
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleNewTagKeyDown}
            suffix={
              <PlusOutlined
                style={{ cursor: newTagName.trim() ? 'pointer' : 'default', color: newTagName.trim() ? '#1a1a2e' : '#ccc' }}
                onClick={handleCreateTag}
              />
            }
          />
        </div>

        <div>
          <div style={{ marginBottom: 4, fontSize: 13, color: '#666' }}>
            {t('learning.tagCloud')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {availableTags.length === 0 && (
              <span style={{ color: '#bbb', fontSize: 13 }}>{t('learning.noAvailableTags')}</span>
            )}
            {availableTags.map((tag) => (
              <AntTag
                key={tag.id}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name}
              </AntTag>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
