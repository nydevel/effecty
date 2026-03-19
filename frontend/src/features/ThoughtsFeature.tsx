import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as thoughtsApi from '../api/thoughts';
import type { Thought, Tag, ThoughtTag, ThoughtComment } from '../api/thoughts';
import type { UserProfile } from '../api/profile';
import { useEncryption } from '../hooks/useEncryption';
import ThoughtSidebar from '../components/ThoughtSidebar';
import ThoughtEditor from '../components/ThoughtEditor';
import TagsCatalog from '../components/TagsCatalog';

interface Props {
  profile: UserProfile | null;
}

export default function ThoughtsFeature({ profile }: Props) {
  const { t } = useTranslation();
  const { encryptField, decryptField, shouldEncrypt } = useEncryption(profile);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thoughtTags, setThoughtTags] = useState<ThoughtTag[]>([]);
  const [comments, setComments] = useState<ThoughtComment[]>([]);

  const selectedThought = thoughts.find((th) => th.id === selectedId) ?? null;

  const loadThoughts = useCallback(async () => {
    try {
      const list = await thoughtsApi.listThoughts();
      const decrypted = await Promise.all(
        list.map(async (th) => ({
          ...th,
          title: await decryptField(th.title),
          content: await decryptField(th.content),
        })),
      );
      setThoughts(decrypted);
    } catch (err) {
      console.error('Failed to load thoughts:', err);
    }
  }, [decryptField]);

  const loadTags = useCallback(async () => {
    try {
      const list = await thoughtsApi.listTags();
      setTags(list);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  const loadThoughtTags = useCallback(async (thoughtId: string) => {
    try {
      const list = await thoughtsApi.listThoughtTags(thoughtId);
      setThoughtTags(list);
    } catch (err) {
      console.error('Failed to load thought tags:', err);
    }
  }, []);

  const loadComments = useCallback(async (thoughtId: string) => {
    try {
      const list = await thoughtsApi.listComments(thoughtId);
      const decrypted = await Promise.all(
        list.map(async (c) => ({
          ...c,
          content: await decryptField(c.content),
        })),
      );
      setComments(decrypted);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  }, [decryptField]);

  useEffect(() => {
    loadThoughts();
    loadTags();
  }, [loadThoughts, loadTags]);

  useEffect(() => {
    if (selectedId) {
      loadThoughtTags(selectedId);
      loadComments(selectedId);
    } else {
      setThoughtTags([]);
      setComments([]);
    }
  }, [selectedId, loadThoughtTags, loadComments]);

  const handleCreate = async () => {
    const thought = await thoughtsApi.createThought({ title: '' });
    await loadThoughts();
    setSelectedId(thought.id);
  };

  const handleDelete = async (id: string) => {
    await thoughtsApi.deleteThought(id);
    if (selectedId === id) setSelectedId(null);
    await loadThoughts();
  };

  const handleMove = async (id: string, position: number) => {
    await thoughtsApi.moveThought(id, { position });
    await loadThoughts();
  };

  const handleTitleChange = async (title: string) => {
    if (!selectedId) return;
    const encTitle = await encryptField('thoughts', 'title', title);
    const isEnc = shouldEncrypt('thoughts', 'title') || shouldEncrypt('thoughts', 'content');
    await thoughtsApi.updateThought(selectedId, { title: encTitle, is_encrypted: isEnc });
    await loadThoughts();
  };

  const handleContentChange = async (content: string) => {
    if (!selectedId) return;
    const encContent = await encryptField('thoughts', 'content', content);
    const isEnc = shouldEncrypt('thoughts', 'title') || shouldEncrypt('thoughts', 'content');
    await thoughtsApi.updateThought(selectedId, { content: encContent, is_encrypted: isEnc });
  };

  const handleDropTag = async (tagId: string) => {
    if (!selectedId) return;
    try {
      await thoughtsApi.linkTag(selectedId, { tag_id: tagId });
      await loadThoughtTags(selectedId);
    } catch (err) {
      console.error('Failed to link tag:', err);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!selectedId) return;
    await thoughtsApi.unlinkTag(selectedId, tagId);
    await loadThoughtTags(selectedId);
  };

  const handleAddComment = async (content: string) => {
    if (!selectedId) return;
    const encContent = await encryptField('thought_comments', 'content', content);
    const isEnc = shouldEncrypt('thought_comments', 'content');
    await thoughtsApi.createComment(selectedId, { content: encContent, is_encrypted: isEnc });
    await loadComments(selectedId);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedId) return;
    await thoughtsApi.deleteComment(selectedId, commentId);
    await loadComments(selectedId);
  };

  const handleCreateTag = async (name: string) => {
    await thoughtsApi.createTag({ name });
    await loadTags();
  };

  return (
    <div className="feature-layout">
      <ThoughtSidebar
        thoughts={thoughts}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onDelete={handleDelete}
        onMove={handleMove}
      />
      <main className="main-content">
        {selectedThought ? (
          <ThoughtEditor
            thought={selectedThought}
            tags={thoughtTags}
            comments={comments}
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
            onDropTag={handleDropTag}
            onRemoveTag={handleRemoveTag}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
          />
        ) : (
          <div className="empty-state">{t('thoughts.emptyState')}</div>
        )}
      </main>
      <TagsCatalog
        tags={tags}
        onCreateTag={handleCreateTag}
      />
    </div>
  );
}
