import { useState } from 'react';
import { Modal, Input, Radio, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { MaterialType } from '../api/learning';

interface Props {
  open: boolean;
  onCancel: () => void;
  onSubmit: (data: {
    material_type: MaterialType;
    title: string;
    url?: string;
    content?: string;
    file?: File;
  }) => void;
}

const URL_REGEX = /^https?:\/\/.+/;

export default function MaterialForm({ open, onCancel, onSubmit }: Props) {
  const { t } = useTranslation();
  const [materialType, setMaterialType] = useState<MaterialType>('article_link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const reset = () => {
    setMaterialType('article_link');
    setTitle('');
    setUrl('');
    setContent('');
    setFile(null);
  };

  const handleOk = () => {
    onSubmit({
      material_type: materialType,
      title: title.trim(),
      url: url.trim() || undefined,
      content: content.trim() || undefined,
      file: file ?? undefined,
    });
    reset();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const isLinkType = materialType === 'article_link' || materialType === 'video_link';
  const isFileType = materialType === 'image' || materialType === 'document';
  const isTextType = materialType === 'text';

  const isValid = (() => {
    if (!title.trim()) return false;
    if (isLinkType && !URL_REGEX.test(url.trim())) return false;
    if (isFileType && !file) return false;
    return true;
  })();

  const acceptTypes =
    materialType === 'image'
      ? 'image/*'
      : materialType === 'document'
        ? 'application/pdf'
        : undefined;

  return (
    <Modal
      title={t('learning.newMaterial')}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={t('learning.save')}
      cancelText={t('learning.cancel')}
      okButtonProps={{ disabled: !isValid }}
      width={520}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        <Radio.Group
          value={materialType}
          onChange={(e) => {
            setMaterialType(e.target.value);
            setUrl('');
            setContent('');
            setFile(null);
          }}
          optionType="button"
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="article_link">{t('learning.article_link')}</Radio.Button>
          <Radio.Button value="video_link">{t('learning.video_link')}</Radio.Button>
          <Radio.Button value="text">{t('learning.text')}</Radio.Button>
          <Radio.Button value="image">{t('learning.image')}</Radio.Button>
          <Radio.Button value="document">{t('learning.document')}</Radio.Button>
        </Radio.Group>

        <Input
          placeholder={t('learning.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {isLinkType && (
          <Input
            placeholder={t('learning.url')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            status={url && !URL_REGEX.test(url) ? 'error' : undefined}
          />
        )}

        {isTextType && (
          <Input.TextArea
            placeholder={t('learning.contentPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoSize={{ minRows: 4, maxRows: 12 }}
          />
        )}

        {isFileType && (
          <Upload
            accept={acceptTypes}
            maxCount={1}
            beforeUpload={(f) => {
              setFile(f);
              return false;
            }}
            onRemove={() => setFile(null)}
            fileList={file ? [{ uid: '-1', name: file.name, status: 'done' }] : []}
          >
            <Button icon={<UploadOutlined />}>{t('learning.uploadFile')}</Button>
          </Upload>
        )}
      </div>
    </Modal>
  );
}
