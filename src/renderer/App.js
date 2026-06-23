import { useCallback, useEffect, useState } from 'react';
import { QuickAddBookmark } from './components/QuickAddBookmark.js';
import { Dashboard } from './pages/Dashboard.js';
import { Settings } from './pages/Settings.js';
import { apiClient } from './services/api.client.js';

export function App() {
  const [view, setView] = useState('dashboard');
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const refreshDashboard = useCallback(() => {
    setDashboardRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const unsubscribeQuickAdd = apiClient.ingestion.onOpenQuickAdd(() => {
      setQuickAddOpen(true);
    });

    const unsubscribeCreated = apiClient.ingestion.onBookmarkCreated(() => {
      refreshDashboard();
    });

    return () => {
      unsubscribeQuickAdd();
      unsubscribeCreated();
    };
  }, [refreshDashboard]);

  function openDashboard() {
    setView('dashboard');
    refreshDashboard();
  }

  function handleQuickAddCreated() {
    refreshDashboard();
    setView('dashboard');
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
          <button
            type="button"
            className="app-nav__tab app-nav__tab--action"
            onClick={() => setQuickAddOpen(true)}
            title="Ctrl+Shift+A"
          >
            + Quick Add
          </button>
        </div>
      </nav>

      {view === 'dashboard' ? (
        <Dashboard refreshKey={dashboardRefreshKey} />
      ) : (
        <Settings onDataChanged={refreshDashboard} />
      )}

      <QuickAddBookmark
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onCreated={handleQuickAddCreated}
      />
    </div>
  );
}
