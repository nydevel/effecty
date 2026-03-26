import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Select } from 'antd';
import { DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ProjectTask, ProjectTaskLink, ProjectTaskStatus } from '../api/projects';
import * as projectsApi from '../api/projects';

const { TextArea } = Input;

interface Props {
  task: ProjectTask;
  projectId: string;
  onUpdate: (data: { title?: string; description?: string; status?: ProjectTaskStatus }) => Promise<void>;
  onSelectTask: (id: string) => void;
}

export default function ProjectTaskDetail({ task, projectId, onUpdate, onSelectTask }: Props) {
  const { t } = useTranslation();
  const [links, setLinks] = useState<ProjectTaskLink[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProjectTask[]>([]);
  const [linkType, setLinkType] = useState('related');

  const loadLinks = useCallback(async () => {
    try {
      setLinks(await projectsApi.listTaskLinks(projectId, task.id));
    } catch (err) {
      console.error('Failed to load links:', err);
    }
  }, [projectId, task.id]);

  useEffect(() => {
    loadLinks();
    setSearchQuery('');
    setSearchResults([]);
  }, [loadLinks]);

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await projectsApi.searchTasks(projectId, value.trim());
      setSearchResults(results.filter((t) => t.id !== task.id));
    } catch (err) {
      console.error('Failed to search tasks:', err);
    }
  };

  const handleLink = async (targetId: string) => {
    await projectsApi.linkTask(projectId, task.id, targetId, linkType);
    setSearchQuery('');
    setSearchResults([]);
    await loadLinks();
  };

  const handleUnlink = async (targetId: string) => {
    await projectsApi.unlinkTask(projectId, task.id, targetId);
    await loadLinks();
  };

  const linkTypeOptions = [
    { label: t('projects.linkParent'), value: 'parent' },
    { label: t('projects.linkRelated'), value: 'related' },
    { label: t('projects.linkBlocker'), value: 'blocker' },
  ];

  return (
    <div className="material-detail">
      {/* Title */}
      <div className="material-detail-header">
        <Input
          defaultValue={task.title}
          key={`title-${task.id}`}
          style={{ fontWeight: 600, fontSize: 14, border: 'none', padding: 0, boxShadow: 'none' }}
          onBlur={(e) => {
            if (e.target.value !== task.title) {
              onUpdate({ title: e.target.value });
            }
          }}
        />
      </div>

      {/* Description */}
      <div className="material-detail-section">
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          {t('projects.description')}
        </div>
        <TextArea
          defaultValue={task.description}
          key={`desc-${task.id}`}
          autoSize={{ minRows: 3, maxRows: 8 }}
          placeholder={t('projects.descriptionPlaceholder')}
          onBlur={(e) => {
            if (e.target.value !== task.description) {
              onUpdate({ description: e.target.value });
            }
          }}
        />
      </div>

      {/* Task links */}
      <div className="material-detail-section" style={{ borderBottom: 'none' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          {t('projects.linkedTasks')}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Select
            size="small"
            value={linkType}
            onChange={setLinkType}
            options={linkTypeOptions}
            style={{ width: 140 }}
          />
          <Input.Search
            size="small"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('projects.searchTask')}
            allowClear
            style={{ flex: 1 }}
          />
        </div>
        {searchResults.length > 0 && (
          <div className="material-search-results">
            {searchResults.map((t) => (
              <div
                key={t.id}
                onClick={() => handleLink(t.id)}
                style={{ padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: '#555', borderBottom: '1px solid #f5f5f5' }}
              >
                {t.title}
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
                  gap: 6,
                }}
              >
                <span className={`status-badge status-badge-link-${link.link_type}`}>
                  {link.link_type === 'parent' && t('projects.linkParent')}
                  {link.link_type === 'related' && t('projects.linkRelated')}
                  {link.link_type === 'blocker' && t('projects.linkBlocker')}
                </span>
                <div
                  style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => onSelectTask(link.target_task_id)}
                >
                  <LinkOutlined style={{ color: '#4f98a3' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {link.target_title}
                  </span>
                </div>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleUnlink(link.target_task_id)}
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
