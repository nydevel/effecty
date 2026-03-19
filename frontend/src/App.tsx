import { useCallback, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, Modal, Input, message } from 'antd';
import enUS from 'antd/locale/en_US';
import ruRU from 'antd/locale/ru_RU';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, clearToken } from './api/client';
import { getProfile } from './api/profile';
import type { UserProfile } from './api/profile';
import { getEncryptionPassphrase, setEncryptionPassphrase, setUserId } from './crypto';
import IconBar from './components/IconBar';
import NotesFeature from './features/NotesFeature';
import CalendarFeature from './features/CalendarFeature';
import WorkoutsFeature from './features/WorkoutsFeature';
import ThoughtsFeature from './features/ThoughtsFeature';
import LearningFeature from './features/LearningFeature';
import SettingsFeature from './features/SettingsFeature';
import LoginPage from './pages/LoginPage';
import './App.css';

type Feature = 'notes' | 'calendar' | 'workouts' | 'thoughts' | 'learning' | 'settings';

function BlankPage() {
  return <div style={{ background: '#fff', minHeight: '100vh' }} />;
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [activeFeature, setActiveFeature] = useState<Feature>('notes');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState('');
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
      if ((p.encrypt_notes || p.encrypt_thoughts) && !getEncryptionPassphrase()) {
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
    navigate('/app');
  };

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    setProfile(null);
    navigate('/');
  };

  const handleKeySubmit = () => {
    if (!keyInput.trim()) return;
    setEncryptionPassphrase(keyInput.trim());
    setKeyInput('');
    setShowKeyModal(false);
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
              ? <Navigate to="/app" replace />
              : <LoginPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/app"
          element={
            loggedIn
              ? (
                <div className="app-layout">
                  <IconBar
                    activeFeature={activeFeature}
                    onSelectFeature={setActiveFeature}
                    onLogout={handleLogout}
                  />
                  <div className="feature-content">
                    {activeFeature === 'notes' && <NotesFeature profile={profile} />}
                    {activeFeature === 'calendar' && <CalendarFeature />}
                    {activeFeature === 'workouts' && <WorkoutsFeature />}
                    {activeFeature === 'thoughts' && <ThoughtsFeature profile={profile} />}
                    {activeFeature === 'learning' && <LearningFeature />}
                    {activeFeature === 'settings' && (
                      <SettingsFeature profile={profile} onProfileUpdate={loadProfile} />
                    )}
                  </div>
                </div>
              )
              : <Navigate to="/auttth" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}
