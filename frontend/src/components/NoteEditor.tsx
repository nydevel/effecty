import { useEffect, useMemo } from 'react';
import { Input } from 'antd';
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
      <Input
        variant="borderless"
        defaultValue={title}
        placeholder="Untitled"
        style={{ fontSize: 28, fontWeight: 700, padding: '8px 0 12px' }}
        onBlur={(e) => {
          const val = e.currentTarget.value.trim();
          if (val && val !== title) onTitleChange(val);
        }}
        onPressEnter={(e) => e.currentTarget.blur()}
      />
      <BlockNoteView editor={editor} onChange={handleChange} theme="light" />
    </div>
  );
}
