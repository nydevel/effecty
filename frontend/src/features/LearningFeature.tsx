import { useState, useEffect, useCallback, useMemo } from 'react';
import AppButton from '../components/ui/AppButton';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusOutlined } from '../components/ui/icons';
import { useTranslation } from 'react-i18next';
import * as learningApi from '../api/learning';
import type { Topic, Material, MaterialStatus } from '../api/learning';
import type { Tag } from '../api/thoughts';
import TopicSidebar from '../components/TopicSidebar';
import TopicModal from '../components/TopicModal';
import MaterialTable from '../components/MaterialTable';
import MaterialDetail from '../components/MaterialDetail';
import MaterialForm from '../components/MaterialForm';

export default function LearningFeature() {
  const { t } = useTranslation();
  const { id: selectedTopicId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [topicCreateParentId, setTopicCreateParentId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<MaterialStatus | 'all'>('all');

  const setSelectedTopicId = (id: string | null) => {
    if (id) {
      navigate(`/app/learning/${id}`);
    } else {
      navigate('/app/learning');
    }
    setSelectedMaterialId(null);
  };
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [materialFormOpen, setMaterialFormOpen] = useState(false);

  const filteredMaterials = useMemo(
    () => (
      statusFilter === 'all'
        ? materials
        : materials.filter((material) => material.status === statusFilter)
    ),
    [materials, statusFilter],
  );

  const selectedMaterial = filteredMaterials.find((m) => m.id === selectedMaterialId) ?? null;

  const loadTopics = useCallback(async () => {
    try {
      const list = await learningApi.listTopics();
      setTopics(list);
    } catch (err) {
      console.error('Failed to load topics:', err);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const list = await learningApi.listTags();
      setTags(list);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  const loadMaterials = useCallback(async () => {
    try {
      const list = selectedTopicId
        ? await learningApi.listMaterialsByTopic(selectedTopicId)
        : await learningApi.listMaterials();
      setMaterials(list);
    } catch (err) {
      console.error('Failed to load materials:', err);
    }
  }, [selectedTopicId]);

  useEffect(() => {
    loadTopics();
    loadTags();
  }, [loadTopics, loadTags]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleCreateTopic = async (name: string, tagIds: string[]) => {
    try {
      await learningApi.createTopic({
        name,
        tag_ids: tagIds,
        parent_id: topicCreateParentId ?? selectedTopicId ?? null,
      });
      await loadTopics();
      setTopicCreateParentId(null);
      setTopicModalOpen(false);
    } catch (err) {
      console.error('Failed to create topic:', err);
    }
  };

  const handleMoveTopic = async (id: string, parentId: string | null) => {
    try {
      await learningApi.moveTopic(id, { parent_id: parentId });
      await loadTopics();
    } catch (err) {
      console.error('Failed to move topic:', err);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    await learningApi.deleteTopic(id);
    if (selectedTopicId === id) navigate('/app/learning');
    await loadTopics();
  };

  const handleCreateTag = async (name: string): Promise<Tag> => {
    const tag = await learningApi.createTag({ name });
    await loadTags();
    return tag;
  };

  const handleCreateMaterial = async (data: {
    material_type: learningApi.MaterialType;
    title: string;
    url?: string;
    content?: string;
    file?: File;
  }) => {
    const topicId = selectedTopicId || topics[0]?.id;
    if (!topicId) return;

    try {
      const material = await learningApi.createMaterial({
        material_type: data.material_type,
        title: data.title,
        url: data.url,
        content: data.content,
        topic_id: topicId,
      });

      if (data.file) {
        await learningApi.uploadMaterialFile(material.id, data.file);
      }

      await loadMaterials();
      setMaterialFormOpen(false);
    } catch (err) {
      console.error('Failed to create material:', err);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    await learningApi.deleteMaterial(id);
    if (selectedMaterialId === id) setSelectedMaterialId(null);
    await loadMaterials();
  };

  const handleStatusChange = async (id: string, status: MaterialStatus) => {
    try {
      const updated = await learningApi.setMaterialStatus(id, status);
      setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleMaterialUpdate = (updated: Material) => {
    setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleReassignMaterialTopic = async (materialId: string, topicId: string) => {
    try {
      await learningApi.setMaterialTopic(materialId, topicId);
      await loadMaterials();
    } catch (err) {
      console.error('Failed to reassign material topic:', err);
    }
  };

  return (
    <div className="learning-feature">
      <div className="feature-layout">
        <TopicSidebar
          topics={topics}
          selectedId={selectedTopicId ?? null}
          statusFilter={statusFilter}
          onSelect={setSelectedTopicId}
          onStatusFilterChange={setStatusFilter}
          onCreate={(parentIdOverride) => {
            setTopicCreateParentId(parentIdOverride ?? null);
            setTopicModalOpen(true);
          }}
          onMove={handleMoveTopic}
          onDropMaterial={handleReassignMaterialTopic}
          onDelete={handleDeleteTopic}
        />
        <main className="main-content">
          <div className="materials-header">
            <AppButton
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setMaterialFormOpen(true)}
              disabled={topics.length === 0 && !selectedTopicId}
            >
              {t('learning.newMaterial')}
            </AppButton>
          </div>
          {filteredMaterials.length > 0 ? (
            <MaterialTable
              materials={filteredMaterials}
              selectedId={selectedMaterialId}
              showTopics={!selectedTopicId}
              onSelect={setSelectedMaterialId}
              onDelete={handleDeleteMaterial}
              onStatusChange={handleStatusChange}
            />
          ) : (
            <div className="empty-state">{t('learning.emptyState')}</div>
          )}
        </main>
        {selectedMaterial && (
          <div className="medical-detail">
            <MaterialDetail
              material={selectedMaterial}
              onMaterialUpdated={handleMaterialUpdate}
              onSelectMaterial={setSelectedMaterialId}
            />
          </div>
        )}
      </div>

      <TopicModal
        open={topicModalOpen}
        tags={tags}
        onCancel={() => {
          setTopicCreateParentId(null);
          setTopicModalOpen(false);
        }}
        onOk={handleCreateTopic}
        onCreateTag={handleCreateTag}
      />

      <MaterialForm
        open={materialFormOpen}
        onCancel={() => setMaterialFormOpen(false)}
        onSubmit={handleCreateMaterial}
      />
    </div>
  );
}
