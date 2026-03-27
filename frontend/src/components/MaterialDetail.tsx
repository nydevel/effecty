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
        <div style={{ fontSize: 14, fontWeight: 600, color: '#222', lineHeight: 1.3, wordBreak: 'break-word' }}>
          {material.title || t('learning.untitled')}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
          {t(`learning.${material.material_type}`)}
          {material.topic_names && ` · ${material.topic_names}`}
        </div>
      </div>

      {/* Comments */}
      <div className="material-detail-section">
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          {t('learning.comments')}
        </div>
        {comments.length > 0 ? (
          <List
            size="small"
            dataSource={comments}
            split={false}
            renderItem={(c) => (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 0', borderBottom: '1px solid #f0f0f2' }}>
                <div style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13, lineHeight: 1.5 }}>
                  {c.content}
                </div>
                <AppButton
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteComment(c.id)}
                  style={{ flexShrink: 0 }}
                />
              </div>
            )}
          />
        ) : (
          <div style={{ fontSize: 12, color: '#aaa' }}>{t('learning.noComments')}</div>
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
            style={{ marginTop: 8 }}
          >
            {t('learning.addComment')}
          </AppButton>
        </div>
      </div>

      {/* Linked materials */}
      <div className="material-detail-section" style={{ borderBottom: 'none' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
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
                style={{
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: '#555',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderBottom: '1px solid #f5f5f5',
                }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.title}
                </span>
                <span style={{ color: '#aaa', flexShrink: 0 }}>{t(`learning.${m.material_type}`)}</span>
              </div>
            ))}
          </div>
        )}
        {links.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {links.map((link) => (
              <div
                key={link.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '7px 10px',
                  background: '#f8f8fa',
                  border: '1px solid #e8e8ec',
                  borderRadius: 4,
                  fontSize: 12,
                  color: '#555',
                  gap: 6,
                }}
              >
                <div
                  style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  onClick={() => onSelectMaterial(link.target_material_id)}
                >
                  <LinkOutlined style={{ color: '#4f98a3' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.target_title}
                  </span>
                  <span style={{ color: '#aaa', flexShrink: 0 }}>
                    {t(`learning.${link.target_material_type}`)}
                  </span>
                </div>
                <AppButton
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleUnlink(link.target_material_id)}
                  style={{ flexShrink: 0 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
