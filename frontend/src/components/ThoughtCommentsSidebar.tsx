import { useState } from 'react';
import AppButton from './ui/AppButton';
import { Input, Typography } from 'antd';
import { CloseOutlined, EditOutlined, SendOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { Thought, ThoughtComment } from '../api/thoughts';

interface Props {
  thought: Thought;
  comments: ThoughtComment[];
  onAddComment: (content: string) => void;
  onUpdateComment: (commentId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onClose: () => void;
}

function getPreview(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= 80) return cleaned;
  return `${cleaned.slice(0, 80)}...`;
}

export default function ThoughtCommentsSidebar({
  thought,
  comments,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text) return;
    onAddComment(text);
    setCommentText('');
  };

  const handleStartEdit = (comment: ThoughtComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    const text = editingCommentText.trim();
    if (!text) return;
    await onUpdateComment(commentId, text);
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  return (
    <aside className="exercise-catalog thoughts-comments-sidebar">
      <div className="exercise-catalog-header thoughts-comments-header">
        <div>
          <Typography.Text strong>{t('thoughts.comments')}</Typography.Text>
          <div className="thoughts-comments-preview">
            {getPreview(thought.content) || t('thoughts.contentPlaceholder')}
          </div>
        </div>
        <AppButton type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
      </div>

      <div className="thoughts-comments-form">
        <Input.TextArea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={t('thoughts.commentPlaceholder')}
          autoSize={{ minRows: 2, maxRows: 6 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleAddComment();
            }
          }}
        />
        <AppButton
          type="primary"
          icon={<SendOutlined />}
          onClick={handleAddComment}
          style={{ marginTop: 8, width: '100%' }}
        >
          {t('thoughts.addComment')}
        </AppButton>
      </div>

      <div className="exercise-catalog-list thoughts-comments-list">
        {comments.length > 0 ? comments.map((comment) => (
          <div key={comment.id} className="thought-comment">
            {editingCommentId === comment.id ? (
              <div className="thought-comment-edit">
                <Input.TextArea
                  value={editingCommentText}
                  onChange={(e) => setEditingCommentText(e.target.value)}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  placeholder={t('thoughts.commentPlaceholder')}
                  autoFocus
                />
                <div className="thought-comment-edit-actions">
                  <AppButton size="small" type="primary" onClick={() => handleSaveEdit(comment.id)}>
                    {t('thoughts.saveComment')}
                  </AppButton>
                  <AppButton size="small" onClick={handleCancelEdit}>
                    {t('thoughts.cancel')}
                  </AppButton>
                </div>
              </div>
            ) : (
              <>
                <div className="thought-comment-content">{comment.content}</div>
                <div className="thought-comment-meta">
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(comment.created_at).toLocaleString()}
                  </Typography.Text>
                  <div className="thought-comment-actions">
                    <AppButton
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleStartEdit(comment)}
                      title={t('thoughts.editComment')}
                    />
                    <AppButton
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      className="thought-comment-delete"
                      onClick={() => onDeleteComment(comment.id)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )) : (
          <div className="thoughts-comments-empty">{t('thoughts.noComments')}</div>
        )}
      </div>
    </aside>
  );
}
