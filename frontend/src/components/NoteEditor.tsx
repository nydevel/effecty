import { useEffect, useMemo } from 'react';
import { Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

interface Props {
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

export default function NoteEditor({ title, content, onTitleChange, onChange, readOnly }: Props) {
  const { t } = useTranslation();
  const editor = useCreateBlockNote();

  useEffect(() => {
    const loadContent = async () => {
      if (content && !content.startsWith('ENC:')) {
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
      if (readOnly) return;
      const blocks = editor.document;
      onChange(JSON.stringify(blocks));
    },
    [editor, onChange, readOnly],
  );

  return (
    <div className="note-editor">
      <Input
        variant="borderless"
        defaultValue={title}
        placeholder={t('notes.untitled')}
        className="editor-title-input"
        disabled={readOnly}
        onBlur={(e) => {
          const val = e.currentTarget.value.trim();
          if (val && val !== title) onTitleChange(val);
        }}
        onPressEnter={(e) => e.currentTarget.blur()}
      />
      <BlockNoteView editor={editor} onChange={handleChange} theme="light" editable={!readOnly} />
    </div>
  );
}
