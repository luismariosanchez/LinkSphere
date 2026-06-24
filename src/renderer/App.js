import { useCallback, useRef, useState } from 'react';
import { Dashboard } from './pages/Dashboard.js';
import { Settings } from './pages/Settings.js';
import { Sidebar } from './components/Sidebar.js';

export function App() {
  const [view, setView] = useState('dashboard');
  const [dashboardMode, setDashboardMode] = useState('dashboard');
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const createBookmarkRef = useRef(null);

  const registerCreate = useCallback((fn) => {
    createBookmarkRef.current = fn;
  }, []);

  const refreshDashboard = useCallback(() => {
    setDashboardRefreshKey((key) => key + 1);
  }, []);

  function handleNavigate(mode) {
    setView('dashboard');
    setDashboardMode(mode);
  }

  function handleCreateBookmark() {
    setView('dashboard');
    setDashboardMode('dashboard');
    createBookmarkRef.current?.();
  }

  return (
    <div className="app app--figma">
      <Sidebar
        activeView={view}
        dashboardMode={dashboardMode}
        onNavigate={handleNavigate}
        onOpenSettings={() => setView('settings')}
        onCreateBookmark={handleCreateBookmark}
      />

      <div className="app__main scrollbar-hidden">
        {view === 'dashboard' ? (
          <Dashboard
            refreshKey={dashboardRefreshKey}
            dashboardMode={dashboardMode}
            onDashboardModeChange={setDashboardMode}
            onRegisterCreate={registerCreate}
          />
        ) : (
          <Settings onDataChanged={refreshDashboard} />
        )}
      </div>
    </div>
  );
}
