import { useRef, useState } from 'react';
import { Button, Input, Select } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import type { DoctorVisit, Specialty } from '../api/medical';
import { useAuthImage } from '../hooks/useAuthImage';

const { TextArea } = Input;

interface Props {
  visit: DoctorVisit;
  specialties: Specialty[];
  onUpdate: (data: {
    specialty_id?: string;
    doctor_name?: string;
    clinic?: string;
    visit_date?: string;
    notes?: string;
  }) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
  onDeleteImage: () => Promise<void>;
}

export default function VisitDetail({ visit, specialties, onUpdate, onUploadImage, onDeleteImage }: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageUrl = useAuthImage(visit.image_path);

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
          <label>{t('medical.doctorName')}</label>
          <Input
            defaultValue={visit.doctor_name}
            key={`name-${visit.id}`}
            onBlur={(e) => {
              if (e.target.value !== visit.doctor_name) {
                onUpdate({ doctor_name: e.target.value });
              }
            }}
          />
        </div>
        <div className="visit-detail-row">
          <label>{t('medical.specialty')}</label>
          <Select
            value={visit.specialty_id}
            onChange={(val) => onUpdate({ specialty_id: val })}
            style={{ width: '100%' }}
            options={specialties.map((s) => ({ label: s.name, value: s.id }))}
          />
        </div>
        <div className="visit-detail-row">
          <label>{t('medical.clinic')}</label>
          <Input
            defaultValue={visit.clinic}
            key={`clinic-${visit.id}`}
            onBlur={(e) => {
              if (e.target.value !== visit.clinic) {
                onUpdate({ clinic: e.target.value });
              }
            }}
          />
        </div>
        <div className="visit-detail-row">
          <label>{t('medical.visitDate')}</label>
          <Input
            defaultValue={visit.visit_date}
            key={`date-${visit.id}`}
            onBlur={(e) => {
              if (e.target.value !== visit.visit_date) {
                onUpdate({ visit_date: e.target.value });
              }
            }}
          />
        </div>
      </div>

      <div className="visit-detail-notes">
        <label>{t('medical.notes')}</label>
        <TextArea
          defaultValue={visit.notes}
          key={`notes-${visit.id}`}
          rows={6}
          onBlur={(e) => {
            if (e.target.value !== visit.notes) {
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
