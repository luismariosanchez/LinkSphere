import { useCallback, useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard.js';
import { Settings } from './pages/Settings.js';

export function App() {
  const [view, setView] = useState('dashboard');
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const refreshDashboard = useCallback(() => {
    setDashboardRefreshKey((key) => key + 1);
  }, []);

  function openDashboard() {
    setView('dashboard');
    refreshDashboard();
  }

  return (
    <div className="app">
      <nav className="app-nav">
        <span className="app-nav__brand">Marcadores</span>
        <div className="app-nav__tabs">
          <button
            type="button"
            className={view === 'dashboard' ? 'app-nav__tab app-nav__tab--active' : 'app-nav__tab'}
            onClick={openDashboard}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={view === 'settings' ? 'app-nav__tab app-nav__tab--active' : 'app-nav__tab'}
            onClick={() => setView('settings')}
          >
            Settings
          </button>
        </div>
      </nav>

      {view === 'dashboard' ? (
        <Dashboard refreshKey={dashboardRefreshKey} />
      ) : (
        <Settings onDataChanged={refreshDashboard} />
      )}
    </div>
  );
}
