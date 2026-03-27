import { useState, useEffect, useCallback } from 'react';
import AppButton from '../components/ui/AppButton';
import { useParams, useNavigate } from 'react-router-dom';
import { Segmented } from 'antd';
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
import RoadmapCanvas from '../components/RoadmapCanvas';

type Tab = 'materials' | 'roadmap';

export default function LearningFeature() {
  const { t } = useTranslation();
  const { id: selectedTopicId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('materials');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);

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

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId) ?? null;

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
        parent_id: selectedTopicId ?? null,
      });
      await loadTopics();
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

  return (
    <div className="learning-feature">
      <div className="learning-toolbar">
        <Segmented
          value={tab}
          onChange={(val) => setTab(val as Tab)}
          options={[
            { label: t('learning.materials'), value: 'materials' },
            { label: t('learning.roadmap'), value: 'roadmap' },
          ]}
        />
      </div>
      <div className="feature-layout">
        {tab === 'materials' && (
          <>
            <TopicSidebar
              topics={topics}
              selectedId={selectedTopicId ?? null}
              onSelect={setSelectedTopicId}
              onCreate={() => setTopicModalOpen(true)}
              onMove={handleMoveTopic}
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
              {materials.length > 0 ? (
                <MaterialTable
                  materials={materials}
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
                  onSelectMaterial={setSelectedMaterialId}
                />
              </div>
            )}
          </>
        )}
        {tab === 'roadmap' && (
          <main className="main-content roadmap-main">
            <RoadmapCanvas />
          </main>
        )}
      </div>

      <TopicModal
        open={topicModalOpen}
        tags={tags}
        onCancel={() => setTopicModalOpen(false)}
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
