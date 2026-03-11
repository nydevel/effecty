import { useState } from 'react';
import { isAuthenticated, clearToken } from './api/client';
import IconBar from './components/IconBar';
import NotesFeature from './features/NotesFeature';
import LoginPage from './pages/LoginPage';
import './App.css';

type Feature = 'notes';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [activeFeature, setActiveFeature] = useState<Feature>('notes');

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="app-layout">
      <IconBar
        activeFeature={activeFeature}
        onSelectFeature={setActiveFeature}
        onLogout={handleLogout}
      />
      <div className="feature-content">
        {activeFeature === 'notes' && <NotesFeature />}
      </div>
    </div>
  );
}
