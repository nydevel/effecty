import { useState, useEffect, useCallback } from 'react';
import AppButton from './ui/AppButton';
import { Input, List } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  LinkOutlined,
  SendOutlined,
  UploadOutlined,
} from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { Material, MaterialComment, MaterialLink } from '../api/learning';
import * as learningApi from '../api/learning';
import { useAuthFileUrl } from '../hooks/useAuthFileUrl';

const { TextArea } = Input;

interface Props {
  material: Material;
  onMaterialUpdated: (material: Material) => void;
  onSelectMaterial: (id: string) => void;
}

function isCommentAttachmentSupported(file: File): boolean {
  return file.type.startsWith('image/') || file.type === 'application/pdf';
}

export default function MaterialDetail({ material, onMaterialUpdated, onSelectMaterial }: Props) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<MaterialComment[]>([]);
  const [links, setLinks] = useState<MaterialLink[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentFile, setCommentFile] = useState<File | null>(null);
  const [commentDragOver, setCommentDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Material[]>([]);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [draftContent, setDraftContent] = useState(material.content ?? '');
  const materialFileUrl = useAuthFileUrl(material.file_path);
  const materialThumbnailUrl = useAuthFileUrl(material.thumbnail_path);
  const isTextMaterial = material.material_type === 'text';
  const hasContentChanges = draftContent !== (material.content ?? '');

  const loadComments = useCallback(async () => {
    try {
      setComments(await learningApi.listMaterialComments(material.id));
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  }, [material.id]);

  const loadLinks = useCallback(async () => {
    try {
      setLinks(await learningApi.listMaterialLinks(material.id));
    } catch (err) {
      console.error('Failed to load links:', err);
    }
  }, [material.id]);

  useEffect(() => {
    loadComments();
    loadLinks();
    setNewComment('');
    setCommentFile(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsEditingContent(false);
    setDraftContent(material.content ?? '');
  }, [loadComments, loadLinks, material.content]);

  const handleAddComment = async () => {
    if (!newComment.trim() && !commentFile) return;
    await learningApi.createMaterialComment(material.id, {
      content: newComment.trim() || undefined,
      file: commentFile ?? undefined,
    });
    setNewComment('');
    setCommentFile(null);
    await loadComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    await learningApi.deleteMaterialComment(material.id, commentId);
    await loadComments();
  };

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await learningApi.searchMaterials(value.trim());
      setSearchResults(results.filter((m) => m.id !== material.id));
    } catch (err) {
      console.error('Failed to search materials:', err);
    }
  };

  const handleLinkMaterial = async (targetId: string) => {
    await learningApi.linkMaterial(material.id, targetId);
    setSearchQuery('');
    setSearchResults([]);
    await loadLinks();
  };

  const handleUnlink = async (targetId: string) => {
    await learningApi.unlinkMaterial(material.id, targetId);
    await loadLinks();
  };

  const handleCommentFileChange = (file: File | null) => {
    if (!file) {
      setCommentFile(null);
      return;
    }
    if (!isCommentAttachmentSupported(file)) {
      console.error('Only images and PDFs are supported for comments');
      return;
    }
    setCommentFile(file);
  };

  const handleSaveContent = async () => {
    if (!isTextMaterial || !hasContentChanges) return;
    setIsSavingContent(true);
    try {
      const updated = await learningApi.updateMaterial(material.id, {
        content: draftContent,
      });
      onMaterialUpdated(updated);
      setDraftContent(updated.content ?? '');
      setIsEditingContent(false);
    } catch (err) {
      console.error('Failed to update material:', err);
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleCancelContentEdit = () => {
    setDraftContent(material.content ?? '');
    setIsEditingContent(false);
  };

  const renderMaterialPreview = () => {
    switch (material.material_type) {
      case 'text':
        if (isEditingContent) {
          return (
            <div className="material-edit-content">
              <TextArea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder={t('learning.contentPlaceholder')}
                autoSize={{ minRows: 10, maxRows: 18 }}
                className="material-edit-textarea"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    void handleSaveContent();
                  }
                }}
              />
              <div className="material-edit-actions">
                <AppButton
                  size="small"
                  onClick={handleCancelContentEdit}
                  disabled={isSavingContent}
                >
                  {t('learning.cancel')}
                </AppButton>
                <AppButton
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleSaveContent}
                  loading={isSavingContent}
                  disabled={!hasContentChanges}
                >
                  {t('learning.save')}
                </AppButton>
              </div>
            </div>
          );
        }

        return material.content ? (
          <div className="material-preview-text">{material.content}</div>
        ) : (
          <div className="material-preview-empty">{t('learning.noPreview')}</div>
        );
      case 'image':
        return materialFileUrl ? (
          <img src={materialFileUrl} alt={material.title} className="material-preview-image" />
        ) : (
          <div className="material-preview-empty">{t('learning.noPreview')}</div>
        );
      case 'document':
        return materialFileUrl ? (
          <div className="material-preview-file">
            <iframe src={materialFileUrl} title={material.title} className="material-preview-pdf" />
            <a href={materialFileUrl} target="_blank" rel="noreferrer" className="material-preview-link">
              <DownloadOutlined /> {t('learning.openFile')}
            </a>
          </div>
        ) : (
          <div className="material-preview-empty">{t('learning.noPreview')}</div>
        );
      case 'article_link':
      case 'video_link':
        return (
          <div className="material-preview-link-block">
            {materialThumbnailUrl && (
              <img src={materialThumbnailUrl} alt={material.title} className="material-preview-thumb" />
            )}
            {material.url ? (
              <a href={material.url} target="_blank" rel="noreferrer" className="material-preview-link">
                <LinkOutlined /> {t('learning.openOriginal')}
              </a>
            ) : (
              <div className="material-preview-empty">{t('learning.noPreview')}</div>
            )}
          </div>
        );
      default:
        return <div className="material-preview-empty">{t('learning.noPreview')}</div>;
    }
  };

  return (
    <div className="material-detail">
      <div className="material-detail-header">
        <div className="material-detail-title">
          {material.title || t('learning.untitled')}
        </div>
        <div className="material-detail-subtitle">
          {t(`learning.${material.material_type}`)}
          {material.topic_names && ` · ${material.topic_names}`}
        </div>
      </div>

      <div className="material-detail-section">
        <div className="material-detail-section-header">
          <div className="material-detail-section-title">
            {t('learning.materialPreview')}
          </div>
          {isTextMaterial && !isEditingContent && (
            <AppButton
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => setIsEditingContent(true)}
            >
              {t('learning.edit')}
            </AppButton>
          )}
        </div>
        {renderMaterialPreview()}
      </div>

      <div className="material-detail-section">
        <div className="material-detail-section-title">
          {t('learning.comments')}
        </div>
        <div
          className={`material-comment-input ${commentDragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            if (e.dataTransfer.files.length === 0) return;
            e.preventDefault();
            setCommentDragOver(true);
          }}
          onDragLeave={() => setCommentDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setCommentDragOver(false);
            handleCommentFileChange(e.dataTransfer.files.item(0));
          }}
        >
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('learning.commentPlaceholder')}
            autoSize={{ minRows: 2, maxRows: 5 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                void handleAddComment();
              }
            }}
          />
          <div className="material-comment-input-actions">
            <label className="material-comment-upload-btn">
              <input
                type="file"
                accept="image/*,application/pdf"
                className="material-comment-hidden-input"
                onChange={(e) => handleCommentFileChange(e.target.files?.item(0) ?? null)}
              />
              <UploadOutlined /> {t('learning.uploadFile')}
            </label>
            {commentFile && (
              <div className="material-comment-pending-file">
                <span>{commentFile.name}</span>
                <button
                  type="button"
                  className="material-comment-pending-remove"
                  onClick={() => setCommentFile(null)}
                >
                  <CloseOutlined />
                </button>
              </div>
            )}
          </div>
          <div className="material-comment-drop-hint">{t('learning.dropCommentFile')}</div>
          <AppButton
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={handleAddComment}
            disabled={!newComment.trim() && !commentFile}
            className="material-comment-submit"
          >
            {t('learning.addComment')}
          </AppButton>
        </div>
        {comments.length > 0 ? (
          <List
            size="small"
            dataSource={comments}
            split={false}
            renderItem={(comment) => (
              <div className="material-comment-row">
                <div className="material-comment-main">
                  {comment.file_path && (
                    <MaterialCommentAttachment comment={comment} />
                  )}
                  {comment.content && (
                    <div className="material-comment-content">{comment.content}</div>
                  )}
                  <div className="material-comment-meta">
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>
                <AppButton
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteComment(comment.id)}
                  className="material-action-btn"
                />
              </div>
            )}
          />
        ) : (
          <div className="material-empty-text">{t('learning.noComments')}</div>
        )}
      </div>

      <div className="material-detail-section material-detail-section--last">
        <div className="material-detail-section-title">
          {t('learning.linkedMaterials')}
        </div>
        <Input.Search
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t('learning.searchMaterials')}
          allowClear
          size="small"
        />
        {searchResults.length > 0 && (
          <div className="material-search-results">
            {searchResults.map((m) => (
              <div
                key={m.id}
                onClick={() => handleLinkMaterial(m.id)}
                className="material-search-item"
              >
                <span className="material-search-item-main">
                  {m.title}
                </span>
                <span className="material-search-item-type">{t(`learning.${m.material_type}`)}</span>
              </div>
            ))}
          </div>
        )}
        {links.length > 0 && (
          <div className="material-linked-list">
            {links.map((link) => (
              <div
                key={link.id}
                className="material-linked-item"
              >
                <div
                  className="material-linked-main"
                  onClick={() => onSelectMaterial(link.target_material_id)}
                >
                  <LinkOutlined className="material-linked-icon" />
                  <span className="material-linked-title">
                    {link.target_title}
                  </span>
                  <span className="material-linked-type">
                    {t(`learning.${link.target_material_type}`)}
                  </span>
                </div>
                <AppButton
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleUnlink(link.target_material_id)}
                  className="material-action-btn"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MaterialCommentAttachment({ comment }: { comment: MaterialComment }) {
  const { t } = useTranslation();
  const fileUrl = useAuthFileUrl(comment.file_path);

  if (!fileUrl) {
    return null;
  }

  if (comment.file_mime?.startsWith('image/')) {
    return (
      <div className="material-comment-attachment">
        <img
          src={fileUrl}
          alt={comment.file_name ?? 'attachment'}
          className="material-comment-image"
        />
        <a href={fileUrl} target="_blank" rel="noreferrer" className="material-preview-link">
          <DownloadOutlined /> {comment.file_name ?? t('learning.openFile')}
        </a>
      </div>
    );
  }

  if (comment.file_mime === 'application/pdf') {
    return (
      <div className="material-comment-attachment">
        <iframe
          src={fileUrl}
          title={comment.file_name ?? 'attachment'}
          className="material-comment-pdf"
        />
        <a href={fileUrl} target="_blank" rel="noreferrer" className="material-preview-link">
          <DownloadOutlined /> {comment.file_name ?? t('learning.openFile')}
        </a>
      </div>
    );
  }

  return (
    <a href={fileUrl} target="_blank" rel="noreferrer" className="material-preview-link">
      <DownloadOutlined /> {comment.file_name ?? t('learning.openFile')}
    </a>
  );
}
