import { useRef, useState } from 'react';
import { Button, DatePicker, Input, Select } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import dayjs from 'dayjs';
import type { DoctorVisit, Specialty, MedicalImage } from '../api/medical';
import { useAuthImages } from '../hooks/useAuthImages';

const { TextArea } = Input;

interface Props {
  visit: DoctorVisit;
  specialties: Specialty[];
  images: MedicalImage[];
  onUpdate: (data: {
    specialty_id?: string;
    doctor_name?: string;
    clinic?: string;
    visit_date?: string;
    notes?: string;
  }) => Promise<void>;
  onUploadImage: (file: File) => Promise<void>;
  onDeleteImage: (imageId: string) => Promise<void>;
}

export default function VisitDetail({ visit, specialties, images, onUpdate, onUploadImage, onDeleteImage }: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const imageUrls = useAuthImages(images);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await onUploadImage(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          <DatePicker
            value={visit.visit_date ? dayjs(visit.visit_date) : null}
            key={`date-${visit.id}`}
            style={{ width: '100%' }}
            onChange={(d) => {
              const val = d ? d.format('YYYY-MM-DD') : '';
              if (val !== visit.visit_date) {
                onUpdate({ visit_date: val });
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
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        <div className="visit-images-grid">
          {imageUrls.map((img, idx) => (
            <div key={img.id} className="visit-image-wrapper">
              <img
                src={img.url}
                alt={t('medical.results')}
                className="visit-result-image"
                onClick={() => {
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
              />
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                className="visit-image-delete-btn"
                onClick={() => onDeleteImage(img.id)}
              />
            </div>
          ))}
        </div>
        {imageUrls.length > 0 && (
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={lightboxIndex}
            slides={imageUrls.map((img) => ({ src: img.url }))}
            plugins={[Zoom]}
            zoom={{
              maxZoomPixelRatio: 3,
              scrollToZoom: true,
            }}
          />
        )}
      </div>
    </div>
  );
}
