import { useState } from 'react';
import { Button, Modal, Input, Select, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { DoctorVisit, Specialty } from '../api/medical';

interface Props {
  visits: DoctorVisit[];
  selectedId: string | null;
  specialties: Specialty[];
  onSelect: (id: string | null) => void;
  onCreate: (data: {
    specialty_id: string;
    doctor_name: string;
    clinic: string;
    visit_date: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function VisitList({ visits, selectedId, specialties, onSelect, onCreate, onDelete }: Props) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [clinic, setClinic] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');

  const handleCreate = async () => {
    if (!specialtyId || !doctorName.trim()) return;
    await onCreate({
      specialty_id: specialtyId,
      doctor_name: doctorName.trim(),
      clinic: clinic.trim(),
      visit_date: visitDate || new Date().toISOString().slice(0, 10),
    });
    setModalOpen(false);
    setDoctorName('');
    setClinic('');
    setVisitDate('');
    setSpecialtyId('');
  };

  return (
    <div className="visit-list">
      <div className="visit-list-header">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setModalOpen(true)}
          disabled={specialties.length === 0}
        >
          {t('medical.newVisit')}
        </Button>
      </div>
      <div className="visit-list-items">
        {visits.map((visit) => (
          <div
            key={visit.id}
            className={`visit-list-item ${selectedId === visit.id ? 'selected' : ''}`}
            onClick={() => onSelect(visit.id)}
          >
            <div className="visit-item-main">
              <span className="visit-doctor">{visit.doctor_name || t('medical.untitled')}</span>
              <span className="visit-specialty">{visit.specialty_name}</span>
            </div>
            <div className="visit-item-meta">
              <span className="visit-date">{visit.visit_date}</span>
              <span className="visit-clinic">{visit.clinic}</span>
            </div>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              className="visit-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(visit.id);
              }}
            />
          </div>
        ))}
        {visits.length === 0 && (
          <div className="empty-state-small">{t('medical.noVisits')}</div>
        )}
      </div>

      <Modal
        title={t('medical.newVisit')}
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        okText={t('medical.save')}
        cancelText={t('medical.cancel')}
      >
        <div className="medical-form">
          <label>{t('medical.specialty')}</label>
          <Select
            value={specialtyId || undefined}
            onChange={setSpecialtyId}
            placeholder={t('medical.selectSpecialty')}
            style={{ width: '100%' }}
            options={specialties.map((s) => ({ label: s.name, value: s.id }))}
          />
          <label>{t('medical.doctorName')}</label>
          <Input
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder={t('medical.doctorName')}
          />
          <label>{t('medical.clinic')}</label>
          <Input
            value={clinic}
            onChange={(e) => setClinic(e.target.value)}
            placeholder={t('medical.clinic')}
          />
          <label>{t('medical.visitDate')}</label>
          <DatePicker
            style={{ width: '100%' }}
            value={visitDate ? dayjs(visitDate) : null}
            onChange={(d) => setVisitDate(d ? d.format('YYYY-MM-DD') : '')}
          />
        </div>
      </Modal>
    </div>
  );
}
