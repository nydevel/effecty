import { useState } from 'react';
import { Button, Input, Tag, Typography } from 'antd';
import { CloseOutlined, SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Thought, ThoughtComment, ThoughtTag } from '../api/thoughts';

interface Props {
  thought: Thought;
  tags: ThoughtTag[];
  comments: ThoughtComment[];
  onContentChange: (content: string) => void;
  onDropTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: string) => void;
  readOnly?: boolean;
}

export default function ThoughtEditor({
  thought,
  tags,
  comments,
  onContentChange,
  onDropTag,
  onRemoveTag,
  onAddComment,
  onDeleteComment,
  readOnly,
}: Props) {
  const { t } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleAddComment = () => {
    const text = commentText.trim();
    if (!text) return;
    onAddComment(text);
    setCommentText('');
  };

  return (
    <div className="thought-editor">
      <div
        className={`thought-tags-zone ${dragOver ? 'active' : ''}`}
        onDragOver={(e) => {
          if (readOnly) return;
          if (e.dataTransfer.types.includes('application/tag-id')) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (readOnly) return;
          e.preventDefault();
          setDragOver(false);
          const tagId = e.dataTransfer.getData('application/tag-id');
          if (tagId) onDropTag(tagId);
        }}
      >
        {tags.length > 0 ? (
          tags.map((tt) => (
            <Tag
              key={tt.tag_id}
              closable={!readOnly}
              onClose={() => onRemoveTag(tt.tag_id)}
            >
              {tt.tag_name}
            </Tag>
          ))
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {t('thoughts.dragTagHint')}
          </Typography.Text>
        )}
      </div>

      <Input.TextArea
        defaultValue={thought.content}
        key={thought.id + '-content'}
        placeholder={t('thoughts.contentPlaceholder')}
        autoSize={{ minRows: 4 }}
        style={{ marginTop: 16 }}
        disabled={readOnly}
        onBlur={(e) => {
          const val = e.currentTarget.value;
          if (val !== thought.content) onContentChange(val);
        }}
      />

      <div className="thought-comments-section">
        <Typography.Text strong style={{ display: 'block', margin: '24px 0 12px' }}>
          {t('thoughts.comments')}
        </Typography.Text>

        {comments.map((comment) => (
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
        ))}

        {!readOnly && (
          <div className="thought-comment-form">
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
              style={{ marginTop: 8 }}
            >
              {t('thoughts.addComment')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
