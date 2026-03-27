import { useState, useEffect, useCallback } from 'react';
import AppButton from './ui/AppButton';
import { Input, Select } from 'antd';
import { DeleteOutlined, LinkOutlined } from './ui/icons';
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
          className="project-task-title-input"
          onBlur={(e) => {
            if (e.target.value !== task.title) {
              onUpdate({ title: e.target.value });
            }
          }}
        />
      </div>

      {/* Description */}
      <div className="material-detail-section">
        <div className="material-detail-section-title">
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
      <div className="material-detail-section material-detail-section--last">
        <div className="material-detail-section-title">
          {t('projects.linkedTasks')}
        </div>
        <div className="project-task-search-row">
          <Select
            size="small"
            value={linkType}
            onChange={setLinkType}
            options={linkTypeOptions}
            className="project-task-link-type"
          />
          <Input.Search
            size="small"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={t('projects.searchTask')}
            allowClear
            className="project-task-search-input"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="material-search-results">
            {searchResults.map((t) => (
              <div
                key={t.id}
                onClick={() => handleLink(t.id)}
                className="material-search-item"
              >
                {t.title}
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
                <span className={`status-badge status-badge-link-${link.link_type}`}>
                  {link.link_type === 'parent' && t('projects.linkParent')}
                  {link.link_type === 'related' && t('projects.linkRelated')}
                  {link.link_type === 'blocker' && t('projects.linkBlocker')}
                </span>
                <div
                  className="material-linked-main"
                  onClick={() => onSelectTask(link.target_task_id)}
                >
                  <LinkOutlined className="material-linked-icon" />
                  <span className="material-linked-title">
                    {link.target_title}
                  </span>
                </div>
                <AppButton
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleUnlink(link.target_task_id)}
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
