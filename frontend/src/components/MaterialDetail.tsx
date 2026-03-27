import { useState, useEffect, useCallback } from 'react';
import AppButton from './ui/AppButton';
import { Input, List } from 'antd';
import { DeleteOutlined, LinkOutlined, SendOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { Material, MaterialComment, MaterialLink } from '../api/learning';
import * as learningApi from '../api/learning';

const { TextArea } = Input;

interface Props {
  material: Material;
  onSelectMaterial: (id: string) => void;
}

export default function MaterialDetail({ material, onSelectMaterial }: Props) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<MaterialComment[]>([]);
  const [links, setLinks] = useState<MaterialLink[]>([]);
  const [newComment, setNewComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Material[]>([]);

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
    setSearchQuery('');
    setSearchResults([]);
  }, [loadComments, loadLinks]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await learningApi.createMaterialComment(material.id, newComment.trim());
    setNewComment('');
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

      {/* Comments */}
      <div className="material-detail-section">
        <div className="material-detail-section-title">
          {t('learning.comments')}
        </div>
        {comments.length > 0 ? (
          <List
            size="small"
            dataSource={comments}
            split={false}
            renderItem={(c) => (
              <div className="material-comment-row">
                <div className="material-comment-content">
                  {c.content}
                </div>
                <AppButton
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteComment(c.id)}
                  className="material-action-btn"
                />
              </div>
            )}
          />
        ) : (
          <div className="material-empty-text">{t('learning.noComments')}</div>
        )}
        <div className="material-comment-input">
          <TextArea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('learning.commentPlaceholder')}
            autoSize={{ minRows: 2, maxRows: 5 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleAddComment();
              }
            }}
          />
          <AppButton
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="material-comment-submit"
          >
            {t('learning.addComment')}
          </AppButton>
        </div>
      </div>

      {/* Linked materials */}
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
