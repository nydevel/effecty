import { useCallback, useEffect, useState } from 'react';
import { Button, Segmented } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as learningApi from '../api/learning';
import type { Topic, Material } from '../api/learning';
import type { Tag } from '../api/thoughts';
import TopicSidebar from '../components/TopicSidebar';
import TopicModal from '../components/TopicModal';
import MaterialCard from '../components/MaterialCard';
import MaterialForm from '../components/MaterialForm';

type Tab = 'materials' | 'roadmap';

export default function LearningFeature() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('materials');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [materialFormOpen, setMaterialFormOpen] = useState(false);

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
      await learningApi.createTopic({ name, tag_ids: tagIds });
      await loadTopics();
      setTopicModalOpen(false);
    } catch (err) {
      console.error('Failed to create topic:', err);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    await learningApi.deleteTopic(id);
    if (selectedTopicId === id) setSelectedTopicId(null);
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
    await loadMaterials();
  };

  const handleToggleDone = async (id: string) => {
    try {
      const updated = await learningApi.toggleMaterialDone(id);
      setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err) {
      console.error('Failed to toggle material done:', err);
    }
  };

  const handleEditMaterial = (id: string) => {
    // TODO: open edit form
    console.log('Edit material:', id);
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
              selectedId={selectedTopicId}
              onSelect={setSelectedTopicId}
              onCreate={() => setTopicModalOpen(true)}
              onDelete={handleDeleteTopic}
            />
            <main className="main-content">
              <div className="materials-header">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setMaterialFormOpen(true)}
                  disabled={topics.length === 0 && !selectedTopicId}
                >
                  {t('learning.newMaterial')}
                </Button>
              </div>
              {materials.length > 0 ? (
                <div className="materials-grid">
                  {materials.map((m) => (
                    <MaterialCard
                      key={m.id}
                      material={m}
                      onEdit={handleEditMaterial}
                      onDelete={handleDeleteMaterial}
                      onToggleDone={handleToggleDone}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">{t('learning.emptyState')}</div>
              )}
            </main>
          </>
        )}
        {tab === 'roadmap' && (
          <main className="main-content">
            <div className="empty-state">{t('learning.roadmapPlaceholder')}</div>
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
