import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as notesApi from '../api/notes';
import type { Note } from '../api/notes';
import Sidebar from '../components/Sidebar';
import NoteEditor from '../components/NoteEditor';
import MemoListEditor from '../components/MemoListEditor';

export default function NotesFeature() {
  const { t } = useTranslation();
  const { id: selectedId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const setSelectedId = (id: string | null) => {
    if (id) {
      navigate(`/app/notes/${id}`);
    } else {
      navigate('/app/notes');
    }
  };

  const loadTree = useCallback(async () => {
    try {
      const tree = await notesApi.getTree();
      setNotes(tree);
    } catch (err) {
      console.error('Failed to load notes tree:', err);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (selectedId) {
      const note = notes.find((n) => n.id === selectedId);
      if (note && (note.node_type === 'file' || note.node_type === 'memolist')) {
        notesApi.getNote(selectedId).then((n) => {
          setActiveNote(n);
        }).catch((err) => {
          console.error('Failed to load note:', err);
        });
      } else {
        setActiveNote(null);
      }
    } else {
      setActiveNote(null);
    }
  }, [selectedId, notes]);

  const getParentId = (): string | null => {
    if (!selectedId) return null;
    const selected = notes.find((n) => n.id === selectedId);
    if (selected?.node_type === 'folder') return selectedId;
    return selected?.parent_id ?? null;
  };

  const handleCreateFolder = async () => {
    await notesApi.createNote({
      parent_id: getParentId(),
      title: t('notes.newFolder'),
      node_type: 'folder',
    });
    await loadTree();
  };

  const handleCreateFile = async () => {
    await notesApi.createNote({
      parent_id: getParentId(),
      title: t('notes.newNote'),
      node_type: 'file',
    });
    await loadTree();
  };

  const handleCreateMemolist = async () => {
    await notesApi.createNote({
      parent_id: getParentId(),
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
    await notesApi.updateNote(id, { title: name });
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
        await notesApi.updateNote(activeNote.id, { content });
      }
    },
    [activeNote],
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
        selectedId={selectedId ?? null}
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
