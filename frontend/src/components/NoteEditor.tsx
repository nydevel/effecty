import { useEffect, useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

interface Props {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onChange: (content: string) => void;
}

export default function NoteEditor({ title, content, onTitleChange, onChange }: Props) {
  const editor = useCreateBlockNote();

  useEffect(() => {
    const loadContent = async () => {
      if (content) {
        try {
          const blocks = JSON.parse(content);
          editor.replaceBlocks(editor.document, blocks);
        } catch {
          // Content is not JSON — treat as markdown
          const blocks = await editor.tryParseMarkdownToBlocks(content);
          editor.replaceBlocks(editor.document, blocks);
        }
      } else {
        editor.replaceBlocks(editor.document, []);
      }
    };
    loadContent();
  }, [content, editor]);

  const handleChange = useMemo(
    () => () => {
      const blocks = editor.document;
      onChange(JSON.stringify(blocks));
    },
    [editor, onChange],
  );

  return (
    <div className="note-editor">
      <input
        className="note-title"
        type="text"
        defaultValue={title}
        placeholder="Untitled"
        onBlur={(e) => {
          const val = e.currentTarget.value.trim();
          if (val && val !== title) onTitleChange(val);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
      <BlockNoteView editor={editor} onChange={handleChange} theme="light" />
    </div>
  );
}
