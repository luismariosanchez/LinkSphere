import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../services/api.client.js';
import { BookmarkEditor } from '../components/BookmarkEditor.js';
import { BookmarkList } from '../components/BookmarkList.js';
import { DashboardHeader } from '../components/DashboardHeader.js';
import { DashboardSection } from '../components/DashboardSection.js';
import { EmptyState } from '../components/EmptyState.js';
import { FolderTile } from '../components/FolderTile.js';
import { LoadingState } from '../components/LoadingState.js';
import { useDragScroll } from '../hooks/useDragScroll.js';

const SEARCH_DEBOUNCE_MS = 300;
const BOOKMARKS_PAGE_SIZE = 50;

const EMPTY_BOOKMARKS_PAGE = {
  items: [],
  total: 0,
  hasMore: false,
  offset: 0,
};

export function FoldersView({ refreshKey = 0 }) {
  const [tags, setTags] = useState([]);
  const [pinnedFolders, setPinnedFolders] = useState([]);
  const [filteredFolders, setFilteredFolders] = useState([]);
  const [folders, setFolders] = useState([]);
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

  const applyViewData = useCallback((data, { appendBookmarks = false } = {}) => {
    setTags(data.tags);
    setFolders(data.folders);
    setPinnedFolders(data.pinnedFolders);
    setFilteredFolders(data.filteredFolders);

    if (data.folderNotFound) {
      setError('Carpeta no encontrada');
      setActiveFolderId(null);
      setActiveFolder(null);
      setBookmarksPage(EMPTY_BOOKMARKS_PAGE);
      return;
    }

    if (data.folderDetail) {
      setActiveFolder(data.folderDetail.folder);
      setBookmarksPage((current) => ({
        items: appendBookmarks
          ? [...current.items, ...data.folderDetail.bookmarksPage.items]
          : data.folderDetail.bookmarksPage.items,
        total: data.folderDetail.bookmarksPage.total,
        hasMore: data.folderDetail.bookmarksPage.hasMore,
        offset: data.folderDetail.bookmarksPage.offset,
      }));
    } else {
      setActiveFolder(null);
      setBookmarksPage(EMPTY_BOOKMARKS_PAGE);
    }
  }, []);

  const loadViewData = useCallback(async ({
    appendBookmarks = false,
    bookmarksOffset,
    search = debouncedQuery,
    folderId = activeFolderId,
  } = {}) => {
    if (appendBookmarks) {
      setContentLoading(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await apiClient.folders.getViewData({
        search,
        sortBy,
        activeFolderId: folderId,
        bookmarksOffset: bookmarksOffset ?? 0,
        bookmarksLimit: BOOKMARKS_PAGE_SIZE,
      });

      applyViewData(data, { appendBookmarks });
    } catch (err) {
      setError(err?.message ?? 'Error al cargar carpetas');
    } finally {
      setLoading(false);
      setContentLoading(false);
    }
  }, [activeFolderId, applyViewData, debouncedQuery, sortBy]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    void loadViewData({ search: debouncedQuery, folderId: activeFolderId });
  }, [refreshKey, sortBy, debouncedQuery, activeFolderId, loadViewData]);

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

  async function handleOpenBookmark(bookmark) {
    const { bookmark: updated } = await apiClient.bookmarks.open({
      url: bookmark.url,
      bookmarkId: bookmark.id,
    });

    if (!updated) {
      return;
    }

    setBookmarksPage((current) => ({
      ...current,
      items: current.items.map((item) => (
        item.bookmark.id === bookmark.id
          ? {
              ...item,
              bookmark: {
                ...item.bookmark,
                lastOpenedAt: updated.lastOpenedAt,
                openCount: updated.openCount,
              },
            }
          : item
      )),
    }));
  }

  function handleSaved() {
    void loadViewData();
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
          {loading && <LoadingState />}

          {!loading && pinnedFolders.length > 0 && (
            <DashboardSection title="Acceso rápido">
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
            </DashboardSection>
          )}

          <DashboardSection title="Todas las carpetas" className="folders-section--all">
            {!loading && filteredFolders.length === 0 && !error && (
              <EmptyState
                message={debouncedQuery ? 'No hay carpetas que coincidan.' : 'No hay carpetas todavía.'}
              />
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
          </DashboardSection>
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

          {contentLoading && bookmarksPage.items.length === 0 && <LoadingState />}

          {!contentLoading && bookmarksPage.total === 0 && !error && (
            <EmptyState message="Esta carpeta está vacía." />
          )}

          {bookmarksPage.items.length > 0 && (
            <>
              <BookmarkList
                items={bookmarksPage.items}
                onEdit={(bookmark) => setEditingId(bookmark.id)}
                onOpen={handleOpenBookmark}
              />

              {bookmarksPage.hasMore && (
                <button
                  type="button"
                  className="btn-secondary bookmarks-load-more"
                  disabled={contentLoading}
                  onClick={() => void loadViewData({
                    appendBookmarks: true,
                    bookmarksOffset: bookmarksPage.offset,
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
