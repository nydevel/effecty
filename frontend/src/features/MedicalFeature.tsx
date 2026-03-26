import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Segmented } from 'antd';
import * as medicalApi from '../api/medical';
import type { Specialty, DoctorVisit, Analysis, MedicalImage } from '../api/medical';
import SpecialtySidebar from '../components/SpecialtySidebar';
import VisitList from '../components/VisitList';
import VisitDetail from '../components/VisitDetail';
import AnalysesList from '../components/AnalysesList';
import AnalysisDetail from '../components/AnalysisDetail';

type MedicalTab = 'visits' | 'analyses';

export default function MedicalFeature() {
  const { t } = useTranslation();
  const { id: selectedId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tab, setTab] = useState<MedicalTab>('visits');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [images, setImages] = useState<MedicalImage[]>([]);

  const setSelectedId = (id: string | null) => {
    if (id) {
      navigate(`/app/medical/${id}`);
    } else {
      navigate('/app/medical');
    }
  };

  const selectedVisit = visits.find((v) => v.id === selectedId) ?? null;
  const selectedAnalysis = analyses.find((a) => a.id === selectedId) ?? null;

  const loadSpecialties = useCallback(async () => {
    try {
      const list = await medicalApi.listSpecialties();
      setSpecialties(list);
    } catch (err) {
      console.error('Failed to load specialties:', err);
    }
  }, []);

  const loadVisits = useCallback(async (specialtyId?: string) => {
    try {
      const list = await medicalApi.listVisits(specialtyId);
      setVisits(list);
    } catch (err) {
      console.error('Failed to load visits:', err);
    }
  }, []);

  const loadAnalyses = useCallback(async () => {
    try {
      const list = await medicalApi.listAnalyses();
      setAnalyses(list);
    } catch (err) {
      console.error('Failed to load analyses:', err);
    }
  }, []);

  const loadImages = useCallback(async (ownerType: string, ownerId: string) => {
    try {
      const list = await medicalApi.listImages(ownerType, ownerId);
      setImages(list);
    } catch (err) {
      console.error('Failed to load images:', err);
    }
  }, []);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  useEffect(() => {
    if (tab === 'visits') {
      loadVisits(selectedSpecialtyId ?? undefined);
    } else {
      loadAnalyses();
    }
  }, [tab, selectedSpecialtyId, loadVisits, loadAnalyses]);

  useEffect(() => {
    if (selectedId) {
      const ownerType = tab === 'visits' ? 'visit' : 'analysis';
      loadImages(ownerType, selectedId);
    } else {
      setImages([]);
    }
  }, [selectedId, tab, loadImages]);

  // --- Specialty handlers ---
  const handleCreateSpecialty = async (name: string) => {
    await medicalApi.createSpecialty({ name });
    await loadSpecialties();
  };

  const handleDeleteSpecialty = async (id: string) => {
    await medicalApi.deleteSpecialty(id);
    if (selectedSpecialtyId === id) {
      setSelectedSpecialtyId(null);
    }
    await loadSpecialties();
    await loadVisits(selectedSpecialtyId === id ? undefined : selectedSpecialtyId ?? undefined);
  };

  const handleSelectSpecialty = (id: string | null) => {
    setSelectedSpecialtyId(id);
    setSelectedId(null);
  };

  // --- Visit handlers ---
  const handleCreateVisit = async (data: {
    specialty_id: string;
    doctor_name: string;
    clinic: string;
    visit_date: string;
  }) => {
    const visit = await medicalApi.createVisit(data);
    await loadVisits(selectedSpecialtyId ?? undefined);
    setSelectedId(visit.id);
  };

  const handleUpdateVisit = async (id: string, data: {
    specialty_id?: string;
    doctor_name?: string;
    clinic?: string;
    visit_date?: string;
    notes?: string;
  }) => {
    await medicalApi.updateVisit(id, data);
    await loadVisits(selectedSpecialtyId ?? undefined);
  };

  const handleDuplicateVisit = async (visit: DoctorVisit) => {
    const created = await medicalApi.createVisit({
      specialty_id: visit.specialty_id,
      doctor_name: visit.doctor_name,
      clinic: visit.clinic,
      visit_date: new Date().toISOString().slice(0, 10),
    });
    await loadVisits(selectedSpecialtyId ?? undefined);
    setSelectedId(created.id);
  };

  const handleDeleteVisit = async (id: string) => {
    await medicalApi.deleteVisit(id);
    if (selectedId === id) setSelectedId(null);
    await loadVisits(selectedSpecialtyId ?? undefined);
  };

  const handleUploadImage = async (ownerType: string, ownerId: string, file: File) => {
    await medicalApi.uploadImage(ownerType, ownerId, file);
    await loadImages(ownerType, ownerId);
  };

  const handleDeleteImage = async (imageId: string) => {
    await medicalApi.deleteImage(imageId);
    if (selectedId) {
      const ownerType = tab === 'visits' ? 'visit' : 'analysis';
      await loadImages(ownerType, selectedId);
    }
  };

  // --- Analysis handlers ---
  const handleCreateAnalysis = async (data: { title: string; analysis_date: string }) => {
    const analysis = await medicalApi.createAnalysis(data);
    await loadAnalyses();
    setSelectedId(analysis.id);
  };

  const handleUpdateAnalysis = async (id: string, data: {
    title?: string;
    analysis_date?: string;
    notes?: string;
  }) => {
    await medicalApi.updateAnalysis(id, data);
    await loadAnalyses();
  };

  const handleDeleteAnalysis = async (id: string) => {
    await medicalApi.deleteAnalysis(id);
    if (selectedId === id) setSelectedId(null);
    await loadAnalyses();
  };

  return (
    <div className="feature-layout">
      {tab === 'visits' && (
        <SpecialtySidebar
          specialties={specialties}
          selectedId={selectedSpecialtyId}
          onSelect={handleSelectSpecialty}
          onCreate={handleCreateSpecialty}
          onDelete={handleDeleteSpecialty}
        />
      )}
      <div className="medical-main">
        <div className="medical-tabs">
          <Segmented
            value={tab}
            onChange={(val) => {
              setTab(val as MedicalTab);
              setSelectedId(null);
            }}
            options={[
              { label: t('medical.visits'), value: 'visits' },
              { label: t('medical.analyses'), value: 'analyses' },
            ]}
          />
        </div>
        {tab === 'visits' ? (
          <VisitList
            visits={visits}
            selectedId={selectedId ?? null}
            specialties={specialties}
            onSelect={setSelectedId}
            onCreate={handleCreateVisit}
            onDelete={handleDeleteVisit}
            onDuplicate={handleDuplicateVisit}
          />
        ) : (
          <AnalysesList
            analyses={analyses}
            selectedId={selectedId ?? null}
            onSelect={setSelectedId}
            onCreate={handleCreateAnalysis}
            onDelete={handleDeleteAnalysis}
          />
        )}
      </div>
      <div className="medical-detail">
        {tab === 'visits' && selectedVisit ? (
          <VisitDetail
            visit={selectedVisit}
            specialties={specialties}
            images={images}
            onUpdate={(data) => handleUpdateVisit(selectedVisit.id, data)}
            onUploadImage={(file) => handleUploadImage('visit', selectedVisit.id, file)}
            onDeleteImage={handleDeleteImage}
          />
        ) : tab === 'analyses' && selectedAnalysis ? (
          <AnalysisDetail
            analysis={selectedAnalysis}
            images={images}
            onUpdate={(data) => handleUpdateAnalysis(selectedAnalysis.id, data)}
            onUploadImage={(file) => handleUploadImage('analysis', selectedAnalysis.id, file)}
            onDeleteImage={handleDeleteImage}
          />
        ) : (
          <div className="empty-state">{t('medical.emptyState')}</div>
        )}
      </div>
    </div>
  );
}
