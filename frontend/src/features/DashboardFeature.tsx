import { useTranslation } from 'react-i18next';

export default function DashboardFeature() {
  const { t } = useTranslation();

  return (
    <div className="dashboard-page">
      <div className="empty-state">{t('dashboard.emptyState')}</div>
    </div>
  );
}
