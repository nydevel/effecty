import { useState } from 'react';
import { Button, Modal, Input, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Analysis } from '../api/medical';

interface Props {
  analyses: Analysis[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (data: { title: string; analysis_date: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function AnalysesList({ analyses, selectedId, onSelect, onCreate, onDelete }: Props) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [analysisDate, setAnalysisDate] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) return;
    await onCreate({
      title: title.trim(),
      analysis_date: analysisDate || new Date().toISOString().slice(0, 10),
    });
    setModalOpen(false);
    setTitle('');
    setAnalysisDate('');
  };

  return (
    <div className="visit-list">
      <div className="visit-list-header">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => setModalOpen(true)}
        >
          {t('medical.newAnalysis')}
        </Button>
      </div>
      <div className="visit-list-items">
        {analyses.map((item) => (
          <div
            key={item.id}
            className={`visit-list-item ${selectedId === item.id ? 'selected' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <div className="visit-item-main">
              <span className="visit-doctor">{item.title || t('medical.untitled')}</span>
            </div>
            <div className="visit-item-meta">
              <span className="visit-date">{item.analysis_date}</span>
            </div>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              className="visit-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
            />
          </div>
        ))}
        {analyses.length === 0 && (
          <div className="empty-state-small">{t('medical.noAnalyses')}</div>
        )}
      </div>

      <Modal
        title={t('medical.newAnalysis')}
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        okText={t('medical.save')}
        cancelText={t('medical.cancel')}
      >
        <div className="medical-form">
          <label>{t('medical.analysisTitle')}</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('medical.analysisTitle')}
          />
          <label>{t('medical.analysisDate')}</label>
          <DatePicker
            style={{ width: '100%' }}
            value={analysisDate ? dayjs(analysisDate) : null}
            onChange={(d) => setAnalysisDate(d ? d.format('YYYY-MM-DD') : '')}
          />
        </div>
      </Modal>
    </div>
  );
}
