import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/api.client.js';
import { BookmarkEditor } from '../components/BookmarkEditor.js';
import { BookmarkGrid } from '../components/BookmarkGrid.js';
import { DashboardHeader } from '../components/DashboardHeader.js';
import { FolderPanel } from '../components/FolderPanel.js';
import { GridFilters } from '../components/GridFilters.js';
import { NewsCarousel } from '../components/NewsCarousel.js';
import { QuickAccessFolders } from '../components/QuickAccessFolders.js';
import {
  buildTagMap,
  resolveBookmarkTags,
} from '../utils/bookmarks.js';
import { buildNewsItems } from '../utils/news.js';

export function Dashboard({
  refreshKey = 0,
  dashboardMode = 'dashboard',
  onDashboardModeChange,
  onRegisterCreate,
}) {
  const [bookmarks, setBookmarks] = useState([]);
  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [folderPanelOpen, setFolderPanelOpen] = useState(false);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [gridFilter, setGridFilter] = useState('recent');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [bookmarksData, tagsData, eventsData] = await Promise.all([
        apiClient.bookmarks.getAll(),
        apiClient.tags.getAll(),
        apiClient.events.getAll(),
      ]);

      const foldersData = await apiClient.folders.getAll();

      setBookmarks(bookmarksData);
      setTags(tagsData);
      setFolders(foldersData);
      setEvents(eventsData);
    } catch (err) {
      setError(err?.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onRegisterCreate?.(() => setShowAddForm(true));
  }, [onRegisterCreate]);

  useEffect(() => {
    void loadData();
  }, [loadData, refreshKey]);

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
  const folderMap = Object.fromEntries(folders.map((f) => [f.id, f.name]));
  const newsItems = buildNewsItems(bookmarks, events).map((item) => ({
    ...item,
    tags: resolveBookmarkTags(item.bookmark, tagMap),
    folderName: item.bookmark.folderId ? folderMap[item.bookmark.folderId] : null,
  }));

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
      {loading && bookmarks.length === 0 && <p className="muted">Cargando…</p>}

      {!loading && bookmarks.length === 0 && !error && (
        <div className="empty-state empty-state--dark">
          <h2>Sin bookmarks todavía</h2>
          <p className="muted">Pulsa + en la barra lateral para añadir tu primer enlace.</p>
        </div>
      )}

      {bookmarks.length > 0 && (
        <>
          <NewsCarousel
            items={newsItems}
            onOpen={handleOpen}
            onEdit={(bookmark) => setEditingId(bookmark.id)}
          />

          <QuickAccessFolders
            folders={folders}
            onSelectFolder={(id) => {
              setSelectedFolderId(id);
              setFolderPanelOpen(false);
            }}
          />

          <section className="dashboard-section dashboard-section--grid">
            <GridFilters value={gridFilter} onChange={setGridFilter} />

            <BookmarkGrid
              bookmarks={bookmarks}
              tags={tags}
              folders={folders}
              selectedFolderId={selectedFolderId}
              filters={{ query, typeFilter, statusFilter, tagFilter }}
              events={events}
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
