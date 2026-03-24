import { useRef, useState } from 'react';
import { Button, Input } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import type { Analysis } from '../api/medical';
import { useAuthImage } from '../hooks/useAuthImage';

const { TextArea } = Input;

interface Props {
  analysis: Analysis;
  onUpdate: (data: {
    title?: string;
    analysis_date?: string;
    notes?: string;
  }) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
  onDeleteImage: () => Promise<void>;
}

export default function AnalysisDetail({ analysis, onUpdate, onUploadImage, onDeleteImage }: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageUrl = useAuthImage(analysis.image_path);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadImage(file);
    }
  };

  return (
    <div className="visit-detail">
      <div className="visit-detail-fields">
        <div className="visit-detail-row">
          <label>{t('medical.analysisTitle')}</label>
          <Input
            defaultValue={analysis.title}
            key={`title-${analysis.id}`}
            onBlur={(e) => {
              if (e.target.value !== analysis.title) {
                onUpdate({ title: e.target.value });
              }
            }}
          />
        </div>
        <div className="visit-detail-row">
          <label>{t('medical.analysisDate')}</label>
          <Input
            defaultValue={analysis.analysis_date}
            key={`date-${analysis.id}`}
            onBlur={(e) => {
              if (e.target.value !== analysis.analysis_date) {
                onUpdate({ analysis_date: e.target.value });
              }
            }}
          />
        </div>
      </div>

      <div className="visit-detail-notes">
        <label>{t('medical.notes')}</label>
        <TextArea
          defaultValue={analysis.notes}
          key={`notes-${analysis.id}`}
          rows={6}
          onBlur={(e) => {
            if (e.target.value !== analysis.notes) {
              onUpdate({ notes: e.target.value });
            }
          }}
          placeholder={t('medical.notesPlaceholder')}
        />
      </div>

      <div className="visit-detail-image">
        <label>{t('medical.results')}</label>
        <div className="visit-image-actions">
          <Button
            icon={<UploadOutlined />}
            size="small"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('medical.uploadImage')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        {imageUrl && (
          <>
            <div className="visit-image-wrapper">
              <img
                src={imageUrl}
                alt={t('medical.results')}
                className="visit-result-image"
                onClick={() => setLightboxOpen(true)}
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                className="visit-image-delete-btn"
                onClick={onDeleteImage}
              />
            </div>
            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              slides={[{ src: imageUrl }]}
              plugins={[Zoom]}
              carousel={{ finite: true }}
              render={{
                buttonPrev: () => null,
                buttonNext: () => null,
              }}
              zoom={{
                maxZoomPixelRatio: 3,
                scrollToZoom: true,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
