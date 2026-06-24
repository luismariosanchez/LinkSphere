import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/api.client.js';
import { BookmarkEditor } from '../components/BookmarkEditor.js';
import { BookmarkGrid } from '../components/BookmarkGrid.js';
import { DashboardHeader } from '../components/DashboardHeader.js';
import { FolderPanel } from '../components/FolderPanel.js';
import { GridFilters } from '../components/GridFilters.js';
import { NewsCarousel } from '../components/NewsCarousel.js';
import { QuickAccessFolders } from '../components/QuickAccessFolders.js';
import { buildTagMap } from '../utils/bookmarks.js';

const NEWS_LIMIT = 12;

export function Dashboard({
  refreshKey = 0,
  dashboardMode = 'dashboard',
  onDashboardModeChange,
  onRegisterCreate,
}) {
  const [bookmarks, setBookmarks] = useState([]);
  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [pinnedBookmarks, setPinnedBookmarks] = useState([]);
  const [gridBookmarks, setGridBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [folderPanelOpen, setFolderPanelOpen] = useState(false);
  const [gridFilter, setGridFilter] = useState('recent');

  const [query, setQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const loadGridBookmarks = useCallback(async (filter) => {
    const data = filter === 'favorites'
      ? await apiClient.bookmarks.getFavorites()
      : await apiClient.bookmarks.getRecent();

    setGridBookmarks(data);
  }, []);

  const loadDashboardSections = useCallback(async (filter) => {
    const [newsData, pinnedData] = await Promise.all([
      apiClient.events.getLatest(NEWS_LIMIT),
      apiClient.bookmarks.getPinned(),
    ]);

    setNewsItems(newsData);
    setPinnedBookmarks(pinnedData);
    await loadGridBookmarks(filter);
  }, [loadGridBookmarks]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [bookmarksData, tagsData, foldersData] = await Promise.all([
        apiClient.bookmarks.getAll(),
        apiClient.tags.getAll(),
        apiClient.folders.getAll(),
      ]);

      setBookmarks(bookmarksData);
      setTags(tagsData);
      setFolders(foldersData);
      await loadDashboardSections(gridFilter);
    } catch (err) {
      setError(err?.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [gridFilter, loadDashboardSections]);

  useEffect(() => {
    onRegisterCreate?.(() => setShowAddForm(true));
  }, [onRegisterCreate]);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshKey]);

  useEffect(() => {
    if (loading) {
      return;
    }

    void loadGridBookmarks(gridFilter);
  }, [gridFilter, loading, loadGridBookmarks]);

  useEffect(() => {
    if (dashboardMode === 'folders') {
      setFolderPanelOpen(true);
      onDashboardModeChange?.('dashboard');
    }

    if (dashboardMode === 'bookmarks') {
      setSelectedFolderId('all');
      setGridFilter('recent');
      onDashboardModeChange?.('dashboard');
    }
  }, [dashboardMode, onDashboardModeChange]);

  async function handleCreate(event) {
    event.preventDefault();

    const url = newUrl.trim();
    if (!url) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const created = await apiClient.bookmarks.create({ url });
      setNewUrl('');
      setShowAddForm(false);
      await loadData();
      setEditingId(created.id);
    } catch (err) {
      setError(err?.message ?? 'Error al crear bookmark');
    } finally {
      setCreating(false);
    }
  }

  function handleSaved() {
    void loadData();
  }

  function handleTagCreated(tag) {
    setTags((current) => [...current, tag].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function handleFolderCreated(folder) {
    setFolders((current) => [...current, folder].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function handleFolderDeleted(folderId) {
    setFolders((current) => current.filter((folder) => folder.id !== folderId));
    setBookmarks((current) => current.map((bookmark) => (
      bookmark.folderId === folderId
        ? { ...bookmark, folderId: null }
        : bookmark
    )));
  }

  const tagMap = buildTagMap(tags);

  function handleOpen(url) {
    void apiClient.app.openExternal(url);
  }

  return (
    <div className="dashboard-figma">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      {showAddForm && (
        <section className="add-bookmark add-bookmark--dark">
          <form className="add-bookmark__form" onSubmit={handleCreate}>
            <input
              type="url"
              value={newUrl}
              onChange={(event) => setNewUrl(event.target.value)}
              placeholder="https://youtube.com/… o https://twitch.tv/…"
              disabled={creating}
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={creating || !newUrl.trim()}>
              {creating ? 'Añadiendo…' : 'Añadir'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
              Cancelar
            </button>
          </form>
        </section>
      )}

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Cargando…</p>}

      {!loading && bookmarks.length === 0 && !error && (
        <div className="empty-state empty-state--dark">
          <h2>Sin bookmarks todavía</h2>
          <p className="muted">Pulsa + en la barra lateral para añadir tu primer enlace.</p>
        </div>
      )}

      {!loading && (
        <>
          <NewsCarousel
            items={newsItems}
            tagMap={tagMap}
            onOpen={handleOpen}
            onEdit={(bookmark) => setEditingId(bookmark.id)}
          />

          <QuickAccessFolders
            bookmarks={pinnedBookmarks}
            onOpen={handleOpen}
          />

          <section className="dashboard-section dashboard-section--grid">
            <GridFilters value={gridFilter} onChange={setGridFilter} />

            <BookmarkGrid
              bookmarks={gridBookmarks}
              tags={tags}
              folders={folders}
              onEdit={(bookmark) => setEditingId(bookmark.id)}
            />
          </section>
        </>
      )}

      <FolderPanel
        open={folderPanelOpen}
        onClose={() => setFolderPanelOpen(false)}
        folders={folders}
        bookmarks={bookmarks}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onFolderCreated={handleFolderCreated}
        onFolderDeleted={handleFolderDeleted}
      />

      {editingId && (
        <BookmarkEditor
          bookmarkId={editingId}
          allTags={tags}
          allFolders={folders}
          onSaved={handleSaved}
          onTagCreated={handleTagCreated}
          onFolderCreated={handleFolderCreated}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
