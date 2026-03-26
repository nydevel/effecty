import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as projectsApi from '../api/projects';
import type { Project, ProjectTask } from '../api/projects';
import ProjectTaskList from '../components/ProjectTaskList';
import ProjectTaskDetail from '../components/ProjectTaskDetail';

export default function ProjectsFeature() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  const loadProjects = useCallback(async () => {
    try {
      setProjects(await projectsApi.listProjects());
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }
    try {
      setTasks(await projectsApi.listTasks(selectedProjectId));
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTasks();
    setSelectedTaskId(null);
  }, [loadTasks]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const project = await projectsApi.createProject({ name: newProjectName.trim() });
    setNewProjectName('');
    setProjectModalOpen(false);
    await loadProjects();
    setSelectedProjectId(project.id);
  };

  const handleDeleteProject = async (id: string) => {
    await projectsApi.deleteProject(id);
    if (selectedProjectId === id) {
      setSelectedProjectId(null);
    }
    await loadProjects();
  };

  const handleCreateTask = async (title: string) => {
    if (!selectedProjectId) return;
    await projectsApi.createTask(selectedProjectId, { title });
    await loadTasks();
  };

  const handleUpdateTask = async (
    taskId: string,
    data: { title?: string; description?: string; status?: projectsApi.ProjectTaskStatus },
  ) => {
    if (!selectedProjectId) return;
    const updated = await projectsApi.updateTask(selectedProjectId, taskId, data);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    // Re-sort if status changed
    if (data.status) {
      await loadTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedProjectId) return;
    await projectsApi.deleteTask(selectedProjectId, taskId);
    if (selectedTaskId === taskId) setSelectedTaskId(null);
    await loadTasks();
  };

  return (
    <div className="feature-layout">
      {/* Sidebar - project list */}
      <div className="sidebar">
        <div className="sidebar-header">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => setProjectModalOpen(true)}
          >
            {t('projects.newProject')}
          </Button>
        </div>
        <div className="sidebar-items">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`sidebar-item ${selectedProjectId === p.id ? 'selected' : ''}`}
              onClick={() => setSelectedProjectId(p.id)}
            >
              <span className="sidebar-item-name">{p.name}</span>
              <Button
                type="text"
                size="small"
                danger
                className="sidebar-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProject(p.id);
                }}
              >
                ×
              </Button>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="empty-state-small">{t('projects.noProjects')}</div>
          )}
        </div>
      </div>

      {/* Main - task list */}
      <main className="main-content">
        {selectedProject ? (
          <ProjectTaskList
            tasks={tasks}
            selectedId={selectedTaskId}
            onSelect={setSelectedTaskId}
            onCreate={handleCreateTask}
            onDelete={handleDeleteTask}
            onStatusChange={(id, status) => handleUpdateTask(id, { status })}
          />
        ) : (
          <div className="empty-state">{t('projects.selectProject')}</div>
        )}
      </main>

      {/* Detail - task detail */}
      {selectedTask && selectedProjectId && (
        <div className="medical-detail">
          <ProjectTaskDetail
            task={selectedTask}
            projectId={selectedProjectId}
            onUpdate={(data) => handleUpdateTask(selectedTask.id, data)}
            onSelectTask={setSelectedTaskId}
          />
        </div>
      )}

      <Modal
        title={t('projects.newProject')}
        open={projectModalOpen}
        onOk={handleCreateProject}
        onCancel={() => { setProjectModalOpen(false); setNewProjectName(''); }}
        okText={t('projects.save')}
        cancelText={t('projects.cancel')}
      >
        <Input
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder={t('projects.projectName')}
          onPressEnter={handleCreateProject}
          autoFocus
        />
      </Modal>
    </div>
  );
}
