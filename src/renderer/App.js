import { useCallback, useState } from 'react';
import { apiClient } from './services/api.client.js';
import { AddBookmark } from './components/AddBookmark.js';
import { BookmarkEditor } from './components/BookmarkEditor.js';
import { useBookmarksChanged } from './hooks/useBookmarksChanged.js';
import { Dashboard } from './pages/Dashboard.js';
import { FoldersView } from './pages/FoldersView.js';
import { Settings } from './pages/Settings.js';
import { Sidebar } from './components/Sidebar.js';

export function App() {
  const [view, setView] = useState('dashboard');
  const [dashboardMode, setDashboardMode] = useState('dashboard');
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [editingBookmarkId, setEditingBookmarkId] = useState(null);
  const [editorTags, setEditorTags] = useState([]);
  const [editorFolders, setEditorFolders] = useState([]);

  const refreshDashboard = useCallback(() => {
    setDashboardRefreshKey((key) => key + 1);
  }, []);

  useBookmarksChanged(refreshDashboard);

  function handleNavigate(mode) {
    setView('dashboard');
    setDashboardMode(mode);
  }

  function handleCreateBookmark() {
    setShowAddBookmark(true);
  }

  async function handleBookmarkCreated(created) {
    refreshDashboard();

    const [tags, folders] = await Promise.all([
      apiClient.tags.getAll(),
      apiClient.folders.getAll(),
    ]);

    setEditorTags(tags);
    setEditorFolders(folders);
    setEditingBookmarkId(created.id);
  }

  function handleTagCreated(tag) {
    setEditorTags((current) => [...current, tag].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function handleFolderCreated(folder) {
    setEditorFolders((current) => [...current, folder].sort((a, b) => a.name.localeCompare(b.name)));
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
          dashboardMode === 'folders' ? (
            <FoldersView refreshKey={dashboardRefreshKey} />
          ) : (
            <Dashboard
              refreshKey={dashboardRefreshKey}
              dashboardMode={dashboardMode}
              onDashboardModeChange={setDashboardMode}
            />
          )
        ) : (
          <Settings onDataChanged={refreshDashboard} />
        )}
      </div>

      <AddBookmark
        open={showAddBookmark}
        onClose={() => setShowAddBookmark(false)}
        onCreated={handleBookmarkCreated}
      />

      {editingBookmarkId && (
        <BookmarkEditor
          bookmarkId={editingBookmarkId}
          allTags={editorTags}
          allFolders={editorFolders}
          onSaved={refreshDashboard}
          onTagCreated={handleTagCreated}
          onFolderCreated={handleFolderCreated}
          onClose={() => setEditingBookmarkId(null)}
        />
      )}
    </div>
  );
}
