import { useState, useEffect, useCallback, useRef } from 'react';
import AppButton from '../components/ui/AppButton';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '../components/ui/icons';
import { useTranslation } from 'react-i18next';
import * as thoughtsApi from '../api/thoughts';
import type { Thought, ThoughtComment } from '../api/thoughts';
import ThoughtCommentsSidebar from '../components/ThoughtCommentsSidebar';
import UniversalListItem from '../components/UniversalListItem';

function sortThoughts(thoughts: Thought[]): Thought[] {
  return [...thoughts].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
}

export default function ThoughtsFeature() {
  const { t } = useTranslation();
  const { id: selectedId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [comments, setComments] = useState<ThoughtComment[]>([]);
  const [addingThought, setAddingThought] = useState(false);
  const [newThoughtContent, setNewThoughtContent] = useState('');
  const [editingThoughtId, setEditingThoughtId] = useState<string | null>(null);
  const [editingThoughtContent, setEditingThoughtContent] = useState('');
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const setSelectedId = (id: string | null) => {
    if (id) {
      navigate(`/app/thoughts/${id}`);
    } else {
      navigate('/app/thoughts');
    }
  };

  const selectedThought = thoughts.find((th) => th.id === selectedId) ?? null;

  const loadThoughts = useCallback(async () => {
    try {
      const list = await thoughtsApi.listThoughts();
      setThoughts(sortThoughts(list));
    } catch (err) {
      console.error('Failed to load thoughts:', err);
    }
  }, []);

  const loadComments = useCallback(async (thoughtId: string) => {
    try {
      const list = await thoughtsApi.listComments(thoughtId);
      setComments(list);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  }, []);

  useEffect(() => {
    loadThoughts();
  }, [loadThoughts]);

  useEffect(() => {
    if (selectedId) {
      loadComments(selectedId);
    } else {
      setComments([]);
    }
  }, [selectedId, loadComments]);

  const handleCreate = async () => {
    const content = newThoughtContent.trim();
    if (!content) return;
    const thought = await thoughtsApi.createThought({ content });
    await loadThoughts();
    setNewThoughtContent('');
    setAddingThought(false);
    setSelectedId(thought.id);
  };

  const handleDelete = async (id: string) => {
    await thoughtsApi.deleteThought(id);
    if (selectedId === id) setSelectedId(null);
    if (editingThoughtId === id) {
      setEditingThoughtId(null);
      setEditingThoughtContent('');
    }
    await loadThoughts();
  };

  const handleContentChange = async (thoughtId: string, content: string) => {
    const updated = await thoughtsApi.updateThought(thoughtId, { content });
    setThoughts((prev) => sortThoughts(prev.map((th) => (th.id === thoughtId ? updated : th))));
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

    const updated = [...thoughts];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(targetIdx, 0, moved);

    setThoughts(updated);

    const prevPos = targetIdx > 0 ? updated[targetIdx - 1].position : null;
    const nextPos = targetIdx < updated.length - 1 ? updated[targetIdx + 1].position : null;

    const newPosition = (() => {
      if (prevPos === null && nextPos === null) return moved.position;
      if (prevPos === null) return nextPos! - 1;
      if (nextPos === null) return prevPos + 1;
      return (prevPos + nextPos) / 2;
    })();

    try {
      const movedUpdated = await thoughtsApi.moveThought(moved.id, { position: newPosition });
      setThoughts((prev) =>
        sortThoughts(prev.map((th) => (th.id === moved.id ? movedUpdated : th))),
      );
    } catch (err) {
      console.error('Failed to reorder thoughts:', err);
      await loadThoughts();
    }
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setDragOverIdx(null);
  };

  const handleStartEdit = (thoughtId: string, content: string) => {
    setEditingThoughtId(thoughtId);
    setEditingThoughtContent(content);
  };

  const handleSaveEdit = async (thoughtId: string) => {
    await handleContentChange(thoughtId, editingThoughtContent);
    setEditingThoughtId(null);
    setEditingThoughtContent('');
  };

  const handleCancelEdit = () => {
    setEditingThoughtId(null);
    setEditingThoughtContent('');
  };

  const handleAddComment = async (content: string) => {
    if (!selectedId) return;
    await thoughtsApi.createComment(selectedId, { content });
    await loadComments(selectedId);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedId) return;
    await thoughtsApi.deleteComment(selectedId, commentId);
    await loadComments(selectedId);
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!selectedId) return;
    await thoughtsApi.updateComment(selectedId, commentId, { content });
    await loadComments(selectedId);
  };

  const formatUpdatedAt = (iso: string) => new Date(iso).toLocaleString();
  const getPreview = (content: string) => {
    const cleaned = content.replace(/\s+/g, ' ').trim();
    if (!cleaned) return t('thoughts.emptyThought');
    return cleaned;
  };

  return (
    <div className="feature-layout thoughts-feature-layout">
      <main className="main-content thoughts-main">
        <div className="thoughts-list-toolbar">
          {addingThought ? (
            <div className="thoughts-add-form">
              <Input.TextArea
                value={newThoughtContent}
                onChange={(e) => setNewThoughtContent(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 6 }}
                placeholder={t('thoughts.contentPlaceholder')}
                autoFocus
              />
              <div className="thoughts-add-form-actions">
                <AppButton size="small" type="primary" onClick={handleCreate}>
                  {t('thoughts.saveThought')}
                </AppButton>
                <AppButton
                  size="small"
                  onClick={() => {
                    setAddingThought(false);
                    setNewThoughtContent('');
                  }}
                >
                  {t('thoughts.cancel')}
                </AppButton>
              </div>
            </div>
          ) : (
            <AppButton
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setAddingThought(true)}
              block
            >
              {t('thoughts.addThought')}
            </AppButton>
          )}
        </div>
        <div className="thoughts-list">
          {thoughts.length > 0 ? thoughts.map((thought, idx) => (
            <UniversalListItem
              key={thought.id}
              className="thought-item"
              selected={selectedId === thought.id}
              clickable
              dragOver={dragOverIdx === idx}
              draggable={editingThoughtId !== thought.id}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedId(thought.id)}
              meta={(
                <Typography.Text type="secondary" className="thought-item-meta">
                  {formatUpdatedAt(thought.updated_at)}
                </Typography.Text>
              )}
              body={editingThoughtId === thought.id ? (
                <div className="thought-item-edit" onClick={(e) => e.stopPropagation()}>
                  <Input.TextArea
                    value={editingThoughtContent}
                    onChange={(e) => setEditingThoughtContent(e.target.value)}
                    placeholder={t('thoughts.contentPlaceholder')}
                    autoSize={{ minRows: 2, maxRows: 8 }}
                    autoFocus
                  />
                  <div className="thought-item-edit-actions">
                    <AppButton size="small" type="primary" onClick={() => handleSaveEdit(thought.id)}>
                      {t('thoughts.saveThought')}
                    </AppButton>
                    <AppButton size="small" onClick={handleCancelEdit}>
                      {t('thoughts.cancel')}
                    </AppButton>
                  </div>
                </div>
              ) : (
                <div className="thought-item-preview">{getPreview(thought.content)}</div>
              )}
              actions={editingThoughtId === thought.id ? undefined : (
                <>
                  <AppButton
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(thought.id, thought.content);
                    }}
                  />
                  <AppButton
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(thought.id);
                    }}
                  />
                </>
              )}
            />
          )) : (
            <div className="empty-state">{t('thoughts.emptyState')}</div>
          )}
        </div>
      </main>

      {selectedThought && (
        <ThoughtCommentsSidebar
          thought={selectedThought}
          comments={comments}
          onAddComment={handleAddComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
