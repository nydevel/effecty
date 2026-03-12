import { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import ruRU from 'antd/locale/ru_RU';
import { useTranslation } from 'react-i18next';
import { isAuthenticated, clearToken } from './api/client';
import { getProfile } from './api/profile';
import IconBar from './components/IconBar';
import NotesFeature from './features/NotesFeature';
import CalendarFeature from './features/CalendarFeature';
import WorkoutsFeature from './features/WorkoutsFeature';
import ThoughtsFeature from './features/ThoughtsFeature';
import SettingsFeature from './features/SettingsFeature';
import LoginPage from './pages/LoginPage';
import './App.css';

type Feature = 'notes' | 'calendar' | 'workouts' | 'thoughts' | 'settings';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [activeFeature, setActiveFeature] = useState<Feature>('notes');
  const { i18n } = useTranslation();

  const antLocale = i18n.language === 'ru' ? ruRU : enUS;

  useEffect(() => {
    if (!loggedIn) return;

    getProfile()
      .then((profile) => {
        if (profile.locale !== i18n.language) {
          i18n.changeLanguage(profile.locale);
        }
      })
      .catch((err) => {
        console.warn('Failed to load user profile:', err);
      });
  }, [loggedIn, i18n]);

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <ConfigProvider
        locale={antLocale}
        theme={{ token: { colorPrimary: '#1a1a2e', borderRadius: 8 } }}
      >
        <LoginPage onLogin={() => setLoggedIn(true)} />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      locale={antLocale}
      theme={{ token: { colorPrimary: '#1a1a2e', borderRadius: 8 } }}
    >
      <div className="app-layout">
        <IconBar
          activeFeature={activeFeature}
          onSelectFeature={setActiveFeature}
          onLogout={handleLogout}
        />
        <div className="feature-content">
          {activeFeature === 'notes' && <NotesFeature />}
          {activeFeature === 'calendar' && <CalendarFeature />}
          {activeFeature === 'workouts' && <WorkoutsFeature />}
          {activeFeature === 'thoughts' && <ThoughtsFeature />}
          {activeFeature === 'settings' && <SettingsFeature />}
        </div>
      </div>
    </ConfigProvider>
  );
}
