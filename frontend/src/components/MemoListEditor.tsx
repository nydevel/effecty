import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, HolderOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Memo } from '../api/notes';
import type { UserProfile } from '../api/profile';
import { useEncryption } from '../hooks/useEncryption';
import * as notesApi from '../api/notes';

interface Props {
  noteId: string;
  title: string;
  onTitleChange: (title: string) => void;
  profile: UserProfile | null;
  readOnly?: boolean;
}

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function MemoListEditor({ noteId, title, onTitleChange, profile, readOnly }: Props) {
  const { t } = useTranslation();
  const { encryptField, decryptField, shouldEncrypt } = useEncryption(profile);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const loadMemos = useCallback(async () => {
    try {
      const list = await notesApi.listMemos(noteId);
      const decrypted = await Promise.all(
        list.map(async (m) => ({
          ...m,
          title: await decryptField(m.title),
          content: await decryptField(m.content),
        })),
      );
      setMemos(decrypted);
    } catch (err) {
      console.error('Failed to load memos:', err);
    }
  }, [noteId, decryptField]);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    const encTitle = await encryptField('memos', 'title', newTitle.trim());
    const encContent = newContent.trim()
      ? await encryptField('memos', 'content', newContent.trim())
      : undefined;
    const isEnc = shouldEncrypt('memos', 'title') || shouldEncrypt('memos', 'content');
    await notesApi.createMemo(noteId, { title: encTitle, content: encContent, is_encrypted: isEnc || undefined });
    setNewTitle('');
    setNewContent('');
    setAdding(false);
    await loadMemos();
  };

  const handleStartEdit = (memo: Memo) => {
    setEditingId(memo.id);
    setEditTitle(memo.title);
    setEditContent(memo.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    const encTitle = await encryptField('memos', 'title', editTitle.trim());
    const encContent = await encryptField('memos', 'content', editContent);
    const isEnc = shouldEncrypt('memos', 'title') || shouldEncrypt('memos', 'content');
    await notesApi.updateMemo(noteId, editingId, {
      title: encTitle,
      content: encContent,
      is_encrypted: isEnc || undefined,
    });
    setEditingId(null);
    await loadMemos();
  };

  const handleDelete = async (memoId: string) => {
    await notesApi.deleteMemo(noteId, memoId);
    await loadMemos();
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = async (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromIdx = dragIdx.current;
    dragIdx.current = null;
    setDragOverIdx(null);
    if (fromIdx === null || fromIdx === targetIdx) return;

    const updated = [...memos];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setMemos(updated);

    try {
      await notesApi.reorderMemos(noteId, updated.map((m) => m.id));
    } catch (err) {
      console.error('Failed to reorder memos:', err);
      await loadMemos();
    }
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  return (
    <div className="memo-list-editor">
      <Input
        variant="borderless"
        defaultValue={title}
        placeholder={t('notes.untitled')}
        style={{ fontSize: 28, fontWeight: 700, padding: '8px 0 12px' }}
        disabled={readOnly}
        onBlur={(e) => {
          const val = e.currentTarget.value.trim();
          if (val && val !== title) onTitleChange(val);
        }}
        onPressEnter={(e) => e.currentTarget.blur()}
      />

      <div className="memo-list">
        {memos.map((memo, idx) => (
          <div
            key={memo.id}
            className={`memo-item${dragOverIdx === idx ? ' memo-item-drag-over' : ''}`}
            draggable={!readOnly && editingId !== memo.id}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
          >
            {editingId === memo.id ? (
              <div className="memo-item-edit">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onPressEnter={handleSaveEdit}
                  placeholder={t('notes.memoTitle')}
                />
                <Input.TextArea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  placeholder={t('notes.memoContent')}
                />
                <div className="memo-item-edit-actions">
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleSaveEdit}
                  />
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => setEditingId(null)}
                  />
                </div>
              </div>
            ) : (
              <>
                <HolderOutlined className="memo-drag-handle" />
                <div className="memo-item-body">
                  <div className="memo-item-title">{memo.title}</div>
                  {memo.content && (
                    <div className="memo-item-content">{linkify(memo.content)}</div>
                  )}
                </div>
                <div className="memo-item-actions">
                  {!readOnly && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleStartEdit(memo)}
                    />
                  )}
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(memo.id)}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        adding ? (
          <div className="memo-add-form">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onPressEnter={handleAdd}
              placeholder={t('notes.memoTitle')}
              autoFocus
            />
            <Input.TextArea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder={t('notes.memoContent')}
            />
            <div className="memo-add-form-actions">
              <Button size="small" type="primary" onClick={handleAdd}>
                {t('notes.addMemo')}
              </Button>
              <Button size="small" onClick={() => { setAdding(false); setNewTitle(''); setNewContent(''); }}>
                {t('notes.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setAdding(true)}
            style={{ marginTop: 12 }}
            block
          >
            {t('notes.addMemo')}
          </Button>
        )
      )}
    </div>
  );
}
