import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import ruRU from 'antd/locale/ru_RU';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, clearToken } from './api/client';
import { getMe } from './api/auth';
import { getProfile } from './api/profile';
import type { UserProfile } from './api/profile';
import IconBar from './components/IconBar';
import NotesFeature from './features/NotesFeature';
import CalendarFeature from './features/CalendarFeature';
import WorkoutsFeature from './features/WorkoutsFeature';
import ThoughtsFeature from './features/ThoughtsFeature';
import LearningFeature from './features/LearningFeature';
import DashboardFeature from './features/DashboardFeature';
import MedicalFeature from './features/MedicalFeature';
import SettingsFeature from './features/SettingsFeature';
import LoginPage from './pages/LoginPage';
import './App.css';

type Feature = 'dashboard' | 'notes' | 'calendar' | 'workouts' | 'thoughts' | 'learning' | 'medical' | 'settings';

const FEATURES: Feature[] = ['dashboard', 'notes', 'calendar', 'workouts', 'thoughts', 'learning', 'medical', 'settings'];

function useActiveFeature(): Feature {
  const location = useLocation();
  const segment = location.pathname.split('/')[2];
  if (FEATURES.includes(segment as Feature)) return segment as Feature;
  return 'notes';
}

function AppLayout({ profile, loadProfile }: {
  profile: UserProfile | null;
  loadProfile: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const activeFeature = useActiveFeature();

  const handleSelectFeature = (feature: Feature) => {
    navigate(`/app/${feature}`);
  };

  const handleLogout = () => {
    clearToken();
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="app-layout">
      <IconBar
        activeFeature={activeFeature}
        onSelectFeature={handleSelectFeature}
        onLogout={handleLogout}
      />
      <div className="feature-content">
        <Routes>
          <Route path="dashboard" element={<DashboardFeature />} />
          <Route path="notes" element={<NotesFeature />} />
          <Route path="notes/:id" element={<NotesFeature />} />
          <Route path="calendar" element={<CalendarFeature />} />
          <Route path="workouts" element={<WorkoutsFeature />} />
          <Route path="workouts/:id" element={<WorkoutsFeature />} />
          <Route path="thoughts" element={<ThoughtsFeature />} />
          <Route path="thoughts/:id" element={<ThoughtsFeature />} />
          <Route path="learning" element={<LearningFeature />} />
          <Route path="learning/:id" element={<LearningFeature />} />
          <Route path="medical" element={<MedicalFeature />} />
          <Route path="medical/:id" element={<MedicalFeature />} />
          <Route path="settings" element={
            <SettingsFeature profile={profile} onProfileUpdate={loadProfile} />
          } />
          <Route path="" element={<Navigate to="notes" replace />} />
          <Route path="*" element={<Navigate to="notes" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const antLocale = i18n.language === 'ru' ? ruRU : enUS;

  const loadProfile = useCallback(async () => {
    try {
      const p = await getProfile();
      setProfile(p);
      if (p.locale !== i18n.language) {
        i18n.changeLanguage(p.locale);
      }
      const fontScale = p.ui_settings?.font_scale ?? 1.0;
      document.documentElement.style.setProperty('--font-scale', String(fontScale));
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    }
  }, [i18n]);

  useEffect(() => {
    if (!loggedIn) return;

    // Validate token with backend before loading app
    getMe()
      .then(() => loadProfile())
      .catch(() => {
        clearToken();
        setLoggedIn(false);
      });
  }, [loggedIn, loadProfile]);

  const handleLogin = () => {
    setLoggedIn(true);
    navigate('/app/notes');
  };

  return (
    <ConfigProvider
      locale={antLocale}
      theme={{ token: { colorPrimary: '#1a1a2e', borderRadius: 8 } }}
    >
      <Routes>
        <Route
          path="/"
          element={
            loggedIn
              ? <Navigate to="/app/notes" replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/app/*"
          element={
            loggedIn
              ? <AppLayout profile={profile} loadProfile={loadProfile} />
              : <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}
