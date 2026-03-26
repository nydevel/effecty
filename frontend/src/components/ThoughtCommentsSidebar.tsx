import { useState } from 'react';
import { Button, Input, Typography } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Thought, ThoughtComment } from '../api/thoughts';

interface Props {
  thought: Thought;
  comments: ThoughtComment[];
  onAddComment: (content: string) => void;
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
  onDeleteComment,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text) return;
    onAddComment(text);
    setCommentText('');
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
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
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
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleAddComment}
          style={{ marginTop: 8, width: '100%' }}
        >
          {t('thoughts.addComment')}
        </Button>
      </div>

      <div className="exercise-catalog-list thoughts-comments-list">
        {comments.length > 0 ? comments.map((comment) => (
          <div key={comment.id} className="thought-comment">
            <div className="thought-comment-content">{comment.content}</div>
            <div className="thought-comment-meta">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(comment.created_at).toLocaleString()}
              </Typography.Text>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                className="thought-comment-delete"
                onClick={() => onDeleteComment(comment.id)}
              />
            </div>
          </div>
        )) : (
          <div className="thoughts-comments-empty">{t('thoughts.noComments')}</div>
        )}
      </div>
    </aside>
  );
}
