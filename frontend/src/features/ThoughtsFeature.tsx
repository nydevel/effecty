import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as thoughtsApi from '../api/thoughts';
import type { Thought, ThoughtComment } from '../api/thoughts';
import ThoughtCommentsSidebar from '../components/ThoughtCommentsSidebar';
import UniversalListItem from '../components/UniversalListItem';

function sortByNewest(thoughts: Thought[]): Thought[] {
  return [...thoughts].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );
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
      setThoughts(sortByNewest(list));
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
    const thought = await thoughtsApi.createThought();
    await thoughtsApi.updateThought(thought.id, { content });
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
    setThoughts((prev) => sortByNewest(prev.map((th) => (th.id === thoughtId ? updated : th))));
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
                <Button size="small" type="primary" onClick={handleCreate}>
                  {t('thoughts.saveThought')}
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setAddingThought(false);
                    setNewThoughtContent('');
                  }}
                >
                  {t('thoughts.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setAddingThought(true)}
              block
            >
              {t('thoughts.addThought')}
            </Button>
          )}
        </div>
        <div className="thoughts-list">
          {thoughts.length > 0 ? thoughts.map((thought) => (
            <UniversalListItem
              key={thought.id}
              className="thought-item"
              selected={selectedId === thought.id}
              clickable
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
                    <Button size="small" type="primary" onClick={() => handleSaveEdit(thought.id)}>
                      {t('thoughts.saveThought')}
                    </Button>
                    <Button size="small" onClick={handleCancelEdit}>
                      {t('thoughts.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="thought-item-preview">{getPreview(thought.content)}</div>
              )}
              actions={editingThoughtId === thought.id ? undefined : (
                <>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(thought.id, thought.content);
                    }}
                  />
                  <Button
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
          onDeleteComment={handleDeleteComment}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
