import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as notesApi from '../api/notes';
import type { Note } from '../api/notes';
import type { UserProfile } from '../api/profile';
import { useEncryption } from '../hooks/useEncryption';
import Sidebar from '../components/Sidebar';
import NoteEditor from '../components/NoteEditor';
import MemoListEditor from '../components/MemoListEditor';

interface Props {
  profile: UserProfile | null;
}

export default function NotesFeature({ profile }: Props) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const { encryptField, decryptField, shouldEncrypt } = useEncryption(profile);

  const loadTree = useCallback(async () => {
    try {
      const tree = await notesApi.getTree();
      const decrypted = await Promise.all(
        tree.map(async (n) => ({
          ...n,
          title: await decryptField(n.title),
        })),
      );
      setNotes(decrypted);
    } catch (err) {
      console.error('Failed to load notes tree:', err);
    }
  }, [decryptField]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (selectedId) {
      const note = notes.find((n) => n.id === selectedId);
      if (note && (note.node_type === 'file' || note.node_type === 'memolist')) {
        notesApi.getNote(selectedId).then(async (n) => {
          setActiveNote({
            ...n,
            title: await decryptField(n.title),
            content: await decryptField(n.content),
          });
        }).catch((err) => {
          console.error('Failed to load note:', err);
        });
      } else {
        setActiveNote(null);
      }
    } else {
      setActiveNote(null);
    }
  }, [selectedId, notes, decryptField]);

  const handleCreateFolder = async () => {
    await notesApi.createNote({
      parent_id: selectedId,
      title: t('notes.newFolder'),
      node_type: 'folder',
    });
    await loadTree();
  };

  const handleCreateFile = async () => {
    await notesApi.createNote({
      parent_id: selectedId,
      title: t('notes.newNote'),
      node_type: 'file',
    });
    await loadTree();
  };

  const handleCreateMemolist = async () => {
    await notesApi.createNote({
      parent_id: selectedId,
      title: t('notes.newMemolist'),
      node_type: 'memolist',
    });
    await loadTree();
  };

  const handleMove = async (id: string, parentId: string | null, index: number) => {
    await notesApi.moveNote(id, { parent_id: parentId, sort_order: index });
    await loadTree();
  };

  const handleRename = async (id: string, name: string) => {
    const encTitle = await encryptField('notes', 'title', name);
    const isEnc = shouldEncrypt('notes', 'title');
    await notesApi.updateNote(id, { title: encTitle, is_encrypted: isEnc });
    await loadTree();
  };

  const handleDelete = async (id: string) => {
    await notesApi.deleteNote(id);
    if (selectedId === id) setSelectedId(null);
    await loadTree();
  };

  const handleContentChange = useCallback(
    async (content: string) => {
      if (activeNote) {
        const encContent = await encryptField('notes', 'content', content);
        const isEnc = shouldEncrypt('notes', 'title') || shouldEncrypt('notes', 'content');
        await notesApi.updateNote(activeNote.id, { content: encContent, is_encrypted: isEnc });
      }
    },
    [activeNote, encryptField, shouldEncrypt],
  );

  const renderContent = () => {
    if (!activeNote) {
      return <div className="empty-state">{t('notes.emptyState')}</div>;
    }

    if (activeNote.node_type === 'memolist') {
      return (
        <MemoListEditor
          key={activeNote.id}
          noteId={activeNote.id}
          title={activeNote.title}
          onTitleChange={(title) => handleRename(activeNote.id, title)}
          profile={profile}
        />
      );
    }

    return (
      <NoteEditor
        key={activeNote.id}
        title={activeNote.title}
        content={activeNote.content}
        onTitleChange={(title) => handleRename(activeNote.id, title)}
        onChange={handleContentChange}
      />
    );
  };

  return (
    <div className="feature-layout">
      <Sidebar
        notes={notes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreateFolder={handleCreateFolder}
        onCreateFile={handleCreateFile}
        onCreateMemolist={handleCreateMemolist}
        onMove={handleMove}
        onRename={handleRename}
        onDelete={handleDelete}
      />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
