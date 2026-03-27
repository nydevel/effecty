import { useState, useRef } from 'react';
import AppButton from './ui/AppButton';
import { Modal, Input, Radio, Upload, Spin } from 'antd';
import { UploadOutlined, LoadingOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { MaterialType } from '../api/learning';
import { fetchUrlTitle } from '../api/learning';

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
  const [titleManuallySet, setTitleManuallySet] = useState(false);
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    setMaterialType('article_link');
    setTitle('');
    setTitleManuallySet(false);
    setUrl('');
    setContent('');
    setFile(null);
    setFetchingTitle(false);
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
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

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);

    if (materialType !== 'article_link' || titleManuallySet) return;

    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);

    if (!URL_REGEX.test(newUrl.trim())) return;

    fetchTimerRef.current = setTimeout(async () => {
      setFetchingTitle(true);
      try {
        const fetched = await fetchUrlTitle(newUrl.trim());
        if (fetched) {
          setTitle(fetched);
        }
      } catch (err) {
        console.error('Failed to fetch title:', err);
      } finally {
        setFetchingTitle(false);
      }
    }, 600);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setTitleManuallySet(true);
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
      <div className="material-form-body">
        <Radio.Group
          value={materialType}
          onChange={(e) => {
            setMaterialType(e.target.value);
            setUrl('');
            setContent('');
            setFile(null);
            setTitleManuallySet(false);
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

        {isLinkType && (
          <Input
            placeholder={t('learning.url')}
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            status={url && !URL_REGEX.test(url) ? 'error' : undefined}
          />
        )}

        <Input
          placeholder={t('learning.title')}
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          suffix={fetchingTitle ? <Spin indicator={<LoadingOutlined spin />} size="small" /> : undefined}
        />

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
            <AppButton icon={<UploadOutlined />}>{t('learning.uploadFile')}</AppButton>
          </Upload>
        )}
      </div>
    </Modal>
  );
}
