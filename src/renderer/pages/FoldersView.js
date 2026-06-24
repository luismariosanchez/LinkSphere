import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../services/api.client.js';
import { BookmarkEditor } from '../components/BookmarkEditor.js';
import { BookmarkGrid } from '../components/BookmarkGrid.js';
import { DashboardHeader } from '../components/DashboardHeader.js';
import { FolderTile } from '../components/FolderTile.js';
import { useDragScroll } from '../hooks/useDragScroll.js';

const BOOKMARKS_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;

const EMPTY_BOOKMARKS_PAGE = {
  items: [],
  total: 0,
  hasMore: false,
  offset: 0,
};

export function FoldersView({ refreshKey = 0 }) {
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [bookmarksPage, setBookmarksPage] = useState(EMPTY_BOOKMARKS_PAGE);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  const quickAccessRef = useDragScroll();

  const loadFolders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [foldersData, tagsData] = await Promise.all([
        apiClient.folders.getAllWithStats(),
        apiClient.tags.getAll(),
      ]);

      setFolders(foldersData);
      setTags(tagsData);
    } catch (err) {
      setError(err?.message ?? 'Error al cargar carpetas');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFolderContent = useCallback(async (folderId, { reset = true, offset: offsetOverride, search } = {}) => {
    setContentLoading(true);
    setError(null);

    try {
      const folder = await apiClient.folders.getById(folderId);

      if (!folder) {
        setError('Carpeta no encontrada');
        setActiveFolderId(null);
        return;
      }

      const offset = reset ? 0 : (offsetOverride ?? 0);
      const bookmarksResult = await apiClient.bookmarks.getByFolder(folderId, {
        offset,
        limit: BOOKMARKS_PAGE_SIZE,
        sortBy: 'title',
        sortDir: 'asc',
        search: search?.trim() || undefined,
      });

      setActiveFolder(folder);
      setBookmarksPage((current) => ({
        items: reset ? bookmarksResult.items : [...current.items, ...bookmarksResult.items],
        total: bookmarksResult.total,
        hasMore: bookmarksResult.hasMore,
        offset: offset + bookmarksResult.items.length,
      }));
    } catch (err) {
      setError(err?.message ?? 'Error al cargar contenido de carpeta');
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders, refreshKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!activeFolderId) {
      setActiveFolder(null);
      setBookmarksPage(EMPTY_BOOKMARKS_PAGE);
      return;
    }

    void loadFolderContent(activeFolderId, { reset: true, search: debouncedQuery });
  }, [activeFolderId, debouncedQuery, loadFolderContent, refreshKey]);

  const pinnedFolders = useMemo(
    () => folders.filter((folder) => folder.pinOrder != null),
    [folders],
  );

  const filteredFolders = useMemo(() => {
    const normalized = debouncedQuery.trim().toLowerCase();

    let list = folders;

    if (normalized) {
      list = list.filter((folder) => folder.name.toLowerCase().includes(normalized));
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'count') {
        const diff = (b.stats?.bookmarkCount ?? 0) - (a.stats?.bookmarkCount ?? 0);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }

      return a.name.localeCompare(b.name);
    });
  }, [debouncedQuery, folders, sortBy]);

  function handleSelectFolder(folder) {
    setActiveFolderId(folder.id);
    setQuery('');
    setDebouncedQuery('');
  }

  function handleBackToList() {
    setActiveFolderId(null);
    setQuery('');
    setDebouncedQuery('');
  }

  function handleOpenBookmark(bookmark) {
    void apiClient.app.openExternal(bookmark.url);

    const openedAt = new Date().toISOString();

    setBookmarksPage((current) => ({
      ...current,
      items: current.items.map((item) => (
        item.id === bookmark.id
          ? { ...item, lastOpenedAt: openedAt, openCount: (item.openCount ?? 0) + 1 }
          : item
      )),
    }));
  }

  function handleSaved() {
    void loadFolders();

    if (activeFolderId) {
      void loadFolderContent(activeFolderId, { reset: true, search: debouncedQuery });
    }
  }

  function handleTagCreated(tag) {
    setTags((current) => [...current, tag].sort((a, b) => a.name.localeCompare(b.name)));
  }

  function handleFolderCreated(folder) {
    setFolders((current) => [...current, { ...folder, stats: { bookmarkCount: 0, favoritesCount: 0, pinnedCount: 0 } }]
      .sort((a, b) => a.name.localeCompare(b.name)));
  }

  const isListView = !activeFolderId;

  return (
    <div className="dashboard-figma folders-page">
      <DashboardHeader
        query={query}
        onQueryChange={setQuery}
        filtersActive={showFilters}
        onFiltersClick={() => setShowFilters((current) => !current)}
      />

      {showFilters && isListView && (
        <div className="search-bar search-bar--dark">
          <div className="search-bar__filters">
            <select
              className="search-bar__select"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="name">Nombre</option>
              <option value="count">Cantidad de bookmarks</option>
            </select>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {isListView && (
        <>
          {loading && <p className="muted">Cargando…</p>}

          {!loading && pinnedFolders.length > 0 && (
            <section className="dashboard-section">
              <h2 className="dashboard-section__title">Acceso rápido</h2>
              <div
                ref={quickAccessRef.ref}
                className="folders-quick-access scrollbar-hidden"
                {...quickAccessRef.dragHandlers}
              >
                {pinnedFolders.map((folder) => (
                  <FolderTile
                    key={folder.id}
                    folder={folder}
                    showPin
                    onClick={handleSelectFolder}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="dashboard-section">
            <h2 className="dashboard-section__title">Todas las carpetas</h2>

            {!loading && filteredFolders.length === 0 && !error && (
              <div className="empty-state empty-state--dark">
                <p className="muted">
                  {debouncedQuery ? 'No hay carpetas que coincidan.' : 'No hay carpetas todavía.'}
                </p>
              </div>
            )}

            {filteredFolders.length > 0 && (
              <div className="folders-grid">
                {filteredFolders.map((folder) => (
                  <FolderTile
                    key={folder.id}
                    folder={folder}
                    onClick={handleSelectFolder}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {!isListView && activeFolder && (
        <section className="dashboard-section dashboard-section--grid folders-page__content">
          <nav className="folders-breadcrumb" aria-label="Ruta de carpetas">
            <button
              type="button"
              className="folders-breadcrumb__link"
              onClick={handleBackToList}
            >
              Carpetas
            </button>
            <span className="folders-breadcrumb__sep">/</span>
            <span className="folders-breadcrumb__current">{activeFolder.name}</span>
          </nav>

          {contentLoading && bookmarksPage.items.length === 0 && (
            <p className="muted">Cargando…</p>
          )}

          {!contentLoading && bookmarksPage.total === 0 && !error && (
            <div className="empty-state empty-state--dark">
              <p className="muted">Esta carpeta está vacía.</p>
            </div>
          )}

          {bookmarksPage.items.length > 0 && (
            <>
              <BookmarkGrid
                bookmarks={bookmarksPage.items}
                tags={tags}
                folders={folders}
                onEdit={(bookmark) => setEditingId(bookmark.id)}
                onOpen={handleOpenBookmark}
              />

              {bookmarksPage.hasMore && (
                <button
                  type="button"
                  className="btn-secondary bookmarks-load-more"
                  disabled={contentLoading}
                  onClick={() => void loadFolderContent(activeFolderId, {
                    reset: false,
                    offset: bookmarksPage.offset,
                    search: debouncedQuery,
                  })}
                >
                  {contentLoading ? 'Cargando…' : 'Cargar más'}
                </button>
              )}
            </>
          )}
        </section>
      )}

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
