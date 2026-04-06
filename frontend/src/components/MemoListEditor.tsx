import { useState, useEffect, useCallback, useRef } from 'react';
import AppButton from './ui/AppButton';
import { Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, HolderOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { Memo } from '../api/notes';
import * as notesApi from '../api/notes';
import UniversalListItem from './UniversalListItem';

interface Props {
  noteId: string;
  title: string;
  onTitleChange: (title: string) => void;
  readOnly?: boolean;
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const copied = document.execCommand('copy');
    if (!copied) {
      throw new Error('document.execCommand("copy") returned false');
    }
  } finally {
    document.body.removeChild(textarea);
  }
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

export default function MemoListEditor({ noteId, title, onTitleChange, readOnly }: Props) {
  const { t } = useTranslation();
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
      setMemos(list);
    } catch (err) {
      console.error('Failed to load memos:', err);
    }
  }, [noteId]);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  const handleAdd = async () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    await notesApi.createMemo(noteId, {
      title: newTitle.trim(),
      content: newContent.trim() || undefined,
    });
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
    if (!editingId || (!editTitle.trim() && !editContent.trim())) return;
    await notesApi.updateMemo(noteId, editingId, {
      title: editTitle.trim(),
      content: editContent,
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

  const handleCopyMemo = async (memo: Memo) => {
    const text = memo.content || memo.title;
    if (!text) return;

    try {
      await copyTextToClipboard(text);
      message.success(t('notes.copiedToClipboard'));
    } catch (err) {
      console.error('Failed to copy memo to clipboard:', err);
      message.error(t('notes.copyFailed'));
    }
  };

  return (
    <div className="memo-list-editor">
      <Input
        variant="borderless"
        defaultValue={title}
        placeholder={t('notes.untitled')}
        className="editor-title-input"
        disabled={readOnly}
        onBlur={(e) => {
          const val = e.currentTarget.value.trim();
          if (val && val !== title) onTitleChange(val);
        }}
        onPressEnter={(e) => e.currentTarget.blur()}
      />

      <div className="memo-list">
        {memos.map((memo, idx) => (
          <UniversalListItem
            key={memo.id}
            className="memo-item"
            dragOver={dragOverIdx === idx}
            draggable={!readOnly && editingId !== memo.id}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            leading={
              !readOnly && editingId !== memo.id ? <HolderOutlined className="memo-drag-handle" /> : undefined
            }
            body={editingId === memo.id ? (
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
                  <AppButton
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={handleSaveEdit}
                  />
                  <AppButton
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => setEditingId(null)}
                  />
                </div>
              </div>
            ) : (
              <div
                className="memo-item-body memo-item-body-clickable"
                onClick={() => void handleCopyMemo(memo)}
              >
                {memo.title && <div className="memo-item-title">{memo.title}</div>}
                {memo.content && (
                  <div className="memo-item-content">{linkify(memo.content)}</div>
                )}
                {!memo.title && !memo.content && (
                  <div className="memo-item-title memo-item-title-muted">{t('notes.untitled')}</div>
                )}
              </div>
            )}
            actions={editingId === memo.id ? undefined : (
              <>
                {!readOnly && (
                  <AppButton
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleStartEdit(memo)}
                  />
                )}
                <AppButton
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(memo.id)}
                />
              </>
            )}
          />
        ))}
      </div>

      {!readOnly && (
        adding ? (
          <div className="memo-add-form">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onPressEnter={handleAdd}
              placeholder={t('notes.memoTitleOptional')}
              autoFocus
            />
            <Input.TextArea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder={t('notes.memoContent')}
            />
            <div className="memo-add-form-actions">
              <AppButton size="small" type="primary" onClick={handleAdd}>
                {t('notes.addMemo')}
              </AppButton>
              <AppButton size="small" onClick={() => { setAdding(false); setNewTitle(''); setNewContent(''); }}>
                {t('notes.cancel')}
              </AppButton>
            </div>
          </div>
        ) : (
          <AppButton
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setAdding(true)}
            className="memo-add-button"
            block
          >
            {t('notes.addMemo')}
          </AppButton>
        )
      )}
    </div>
  );
}
