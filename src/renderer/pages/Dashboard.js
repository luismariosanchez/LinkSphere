import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/api.client.js';
import { BookmarkEditor } from '../components/BookmarkEditor.js';
import { BookmarkGrid } from '../components/BookmarkGrid.js';
import { FolderSidebar } from '../components/FolderSidebar.js';
import { SearchBar } from '../components/SearchBar.js';

export function Dashboard({ refreshKey = 0 }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState('all');

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [bookmarksData, tagsData] = await Promise.all([
        apiClient.bookmarks.getAll(),
        apiClient.tags.getAll(),
      ]);

      const foldersData = await apiClient.folders.getAll();

      setBookmarks(bookmarksData);
      setTags(tagsData);
      setFolders(foldersData);
    } catch (err) {
      setError(err?.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedFolderId('all');
    void loadData();
  }, [loadData, refreshKey]);

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

  async function handleDelete(bookmark) {
    if (!window.confirm(`¿Eliminar "${bookmark.title}"?`)) {
      return;
    }

    setError(null);

    try {
      await apiClient.bookmarks.delete(bookmark.id);
      setBookmarks((current) => current.filter((item) => item.id !== bookmark.id));
    } catch (err) {
      setError(err?.message ?? 'Error al eliminar bookmark');
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

  return (
    <div className="dashboard-layout">
      <FolderSidebar
        folders={folders}
        bookmarks={bookmarks}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onFolderCreated={handleFolderCreated}
        onFolderDeleted={handleFolderDeleted}
      />

      <main className="page page--dashboard dashboard-main">
        <header className="page__header">
          <div>
            <h1>Marcadores</h1>
            <p className="muted">Tus enlaces organizados por carpetas</p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowAddForm((value) => !value)}
          >
            {showAddForm ? 'Cancelar' : '+ Añadir'}
          </button>
        </header>

        {showAddForm && (
          <section className="add-bookmark">
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
                {creating ? 'Añadiendo…' : 'Añadir bookmark'}
              </button>
            </form>
          </section>
        )}

        <SearchBar
          query={query}
          onQueryChange={setQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          tags={tags}
        />

        {error && <p className="error">{error}</p>}
        {loading && bookmarks.length === 0 && <p className="muted">Cargando bookmarks…</p>}

        {!loading && bookmarks.length === 0 && !error && (
          <div className="empty-state">
            <h2>Sin bookmarks todavía</h2>
            <p className="muted">Añade tu primer enlace para empezar.</p>
          </div>
        )}

        <BookmarkGrid
          bookmarks={bookmarks}
          tags={tags}
          folders={folders}
          selectedFolderId={selectedFolderId}
          filters={{ query, typeFilter, statusFilter, tagFilter }}
          onEdit={(bookmark) => setEditingId(bookmark.id)}
          onDelete={handleDelete}
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
      </main>
    </div>
  );
}
