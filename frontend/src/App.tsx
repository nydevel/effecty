import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Modal, Input, message } from 'antd';
import enUS from 'antd/locale/en_US';
import ruRU from 'antd/locale/ru_RU';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, clearToken } from './api/client';
import { getProfile, hasAnyEncryption, DEFAULT_ENCRYPTION_SETTINGS } from './api/profile';
import type { UserProfile } from './api/profile';
import { getEncryptionPassphrase, setEncryptionPassphrase, setUserId } from './crypto';
import IconBar from './components/IconBar';
import NotesFeature from './features/NotesFeature';
import CalendarFeature from './features/CalendarFeature';
import WorkoutsFeature from './features/WorkoutsFeature';
import ThoughtsFeature from './features/ThoughtsFeature';
import LearningFeature from './features/LearningFeature';
import DashboardFeature from './features/DashboardFeature';
import SettingsFeature from './features/SettingsFeature';
import LoginPage from './pages/LoginPage';
import './App.css';

type Feature = 'dashboard' | 'notes' | 'calendar' | 'workouts' | 'thoughts' | 'learning' | 'settings';

const FEATURES: Feature[] = ['dashboard', 'notes', 'calendar', 'workouts', 'thoughts', 'learning', 'settings'];

function useActiveFeature(): Feature {
  const location = useLocation();
  const segment = location.pathname.split('/')[2];
  if (FEATURES.includes(segment as Feature)) return segment as Feature;
  return 'notes';
}

function BlankPage() {
  return <div style={{ background: '#fff', minHeight: '100vh' }} />;
}

function AppLayout({ profile, loadProfile, keyVersion }: {
  profile: UserProfile | null;
  loadProfile: () => Promise<void>;
  keyVersion: number;
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
          <Route path="notes" element={<NotesFeature key={keyVersion} profile={profile} />} />
          <Route path="notes/:id" element={<NotesFeature key={keyVersion} profile={profile} />} />
          <Route path="calendar" element={<CalendarFeature />} />
          <Route path="workouts" element={<WorkoutsFeature />} />
          <Route path="workouts/:id" element={<WorkoutsFeature />} />
          <Route path="thoughts" element={<ThoughtsFeature key={keyVersion} profile={profile} />} />
          <Route path="thoughts/:id" element={<ThoughtsFeature key={keyVersion} profile={profile} />} />
          <Route path="learning" element={<LearningFeature />} />
          <Route path="learning/:id" element={<LearningFeature />} />
          <Route path="settings" element={
            <SettingsFeature profile={profile} onProfileUpdate={loadProfile} keyVersion={keyVersion} />
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
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyVersion, setKeyVersion] = useState(0);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const antLocale = i18n.language === 'ru' ? ruRU : enUS;

  const loadProfile = useCallback(async () => {
    try {
      const p = await getProfile();
      setProfile(p);
      setUserId(p.user_id);
      if (p.locale !== i18n.language) {
        i18n.changeLanguage(p.locale);
      }
      const fontScale = p.ui_settings?.font_scale ?? 1.0;
      document.documentElement.style.setProperty('--font-scale', String(fontScale));
      if (hasAnyEncryption(p.encryption_settings ?? DEFAULT_ENCRYPTION_SETTINGS) && !getEncryptionPassphrase()) {
        setShowKeyModal(true);
      }
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    }
  }, [i18n]);

  useEffect(() => {
    if (!loggedIn) return;
    loadProfile();
  }, [loggedIn, loadProfile]);

  const handleLogin = () => {
    setLoggedIn(true);
    navigate('/app/notes');
  };

  const handleKeySubmit = () => {
    if (!keyInput.trim()) return;
    setEncryptionPassphrase(keyInput.trim());
    setKeyInput('');
    setShowKeyModal(false);
    setKeyVersion((v) => v + 1);
    message.success(t('settings.keyLoaded'));
  };

  const handleKeySkip = () => {
    setKeyInput('');
    setShowKeyModal(false);
  };

  return (
    <ConfigProvider
      locale={antLocale}
      theme={{ token: { colorPrimary: '#1a1a2e', borderRadius: 8 } }}
    >
      <Modal
        title={t('settings.enterEncryptionKey')}
        open={showKeyModal}
        onOk={handleKeySubmit}
        onCancel={handleKeySkip}
        cancelText={t('settings.skipKeyEntry')}
        okText={t('settings.setKey')}
        closable={false}
        maskClosable={false}
      >
        <p style={{ marginBottom: 12 }}>{t('settings.encryptionKeyRequired')}</p>
        <Input.Password
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onPressEnter={handleKeySubmit}
          placeholder={t('settings.encryptionKey')}
          autoFocus
        />
      </Modal>

      <Routes>
        <Route path="/" element={<BlankPage />} />
        <Route
          path="/auttth"
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
              ? <AppLayout profile={profile} loadProfile={loadProfile} keyVersion={keyVersion} />
              : <Navigate to="/auttth" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}
