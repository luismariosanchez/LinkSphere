import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../services/api.client.js';
import { BookmarkEditor } from '../components/BookmarkEditor.js';
import { BookmarkList } from '../components/BookmarkList.js';
import { DashboardHeader } from '../components/DashboardHeader.js';
import { EmptyState } from '../components/EmptyState.js';
import { FolderPanel } from '../components/FolderPanel.js';
import { GridFilters } from '../components/GridFilters.js';
import { LoadingState } from '../components/LoadingState.js';
import { NewsCarousel } from '../components/NewsCarousel.js';
import { QuickAccessFolders } from '../components/QuickAccessFolders.js';
import { SearchBar } from '../components/SearchBar.js';
import { useBookmarkActions } from '../hooks/useBookmarkActions.js';
import { useFolderActions } from '../hooks/useFolderActions.js';

const SEARCH_DEBOUNCE_MS = 300;
const BOOKMARKS_PAGE_SIZE = 50;

const EMPTY_BOOKMARKS_PAGE = {
  items: [],
  total: 0,
  hasMore: false,
  offset: 0,
};

function buildDashboardRequest({
  isBookmarksView,
  query,
  selectedFolderId,
  tagFilter,
  typeFilter,
  favoriteFilter,
  pinnedFilter,
  sortBy,
  showFilters,
  gridFilter,
  bookmarksOffset,
}) {
  if (isBookmarksView) {
    return {
      mode: 'bookmarks',
      search: query,
      folderId: selectedFolderId,
      tagId: tagFilter,
      type: typeFilter,
      favoriteFilter,
      pinnedFilter,
      sortBy,
      showFilters,
      bookmarksOffset: bookmarksOffset ?? 0,
      bookmarksLimit: BOOKMARKS_PAGE_SIZE,
    };
  }

  return {
    mode: 'dashboard',
    gridFilter,
  };
}

export function Dashboard({
  refreshKey = 0,
  dashboardMode = 'dashboard',
  onDashboardModeChange,
}) {
  const isBookmarksView = dashboardMode === 'bookmarks';
  const lastViewModeRef = useRef('dashboard');

  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [pinnedFolders, setPinnedFolders] = useState([]);
  const [gridBookmarks, setGridBookmarks] = useState([]);
  const [bookmarksPage, setBookmarksPage] = useState(EMPTY_BOOKMARKS_PAGE);
  const [isEmpty, setIsEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [folderPanelOpen, setFolderPanelOpen] = useState(false);
  const skipFilterReloadRef = useRef(true);

  const [gridFilter, setGridFilter] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [favoriteFilter, setFavoriteFilter] = useState('all');
  const [pinnedFilter, setPinnedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  const applyDashboardData = useCallback((data, { appendBookmarks = false } = {}) => {
    setTags(data.tags);
    setFolders(data.folders);
    setBookmarks(data.bookmarks);
    setIsEmpty(data.isEmpty);

    if (data.newsItems) {
      setNewsItems(data.newsItems);
    }

    if (data.pinnedFolders) {
      setPinnedFolders(data.pinnedFolders);
    }

    if (data.gridBookmarks) {
      setGridBookmarks(data.gridBookmarks);
    }

    if (data.bookmarksPage) {
      setBookmarksPage((current) => ({
        items: appendBookmarks
          ? [...current.items, ...data.bookmarksPage.items]
          : data.bookmarksPage.items,
        total: data.bookmarksPage.total,
        hasMore: data.bookmarksPage.hasMore,
        offset: data.bookmarksPage.offset,
      }));
    }
  }, []);

  const loadDashboard = useCallback(async ({ appendBookmarks = false, bookmarksOffset } = {}) => {
    if (appendBookmarks) {
      setBookmarksLoading(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await apiClient.dashboard.getData(buildDashboardRequest({
        isBookmarksView,
        query,
        selectedFolderId,
        tagFilter,
        typeFilter,
        favoriteFilter,
        pinnedFilter,
        sortBy,
        showFilters,
        gridFilter,
        bookmarksOffset,
      }));

      applyDashboardData(data, { appendBookmarks });
    } catch (err) {
      setError(err?.message ?? 'Error al cargar datos');
    } finally {
      setLoading(false);
      setBookmarksLoading(false);
    }
  }, [
    applyDashboardData,
    favoriteFilter,
    gridFilter,
    isBookmarksView,
    pinnedFilter,
    query,
    selectedFolderId,
    showFilters,
    sortBy,
    tagFilter,
    typeFilter,
  ]);

  useEffect(() => {
    skipFilterReloadRef.current = true;
    void loadDashboard().finally(() => {
      skipFilterReloadRef.current = false;
    });
  }, [refreshKey, loadDashboard]);

  useEffect(() => {
    if (skipFilterReloadRef.current || isBookmarksView) {
      return undefined;
    }

    void loadDashboard();
  }, [gridFilter, isBookmarksView, loadDashboard]);

  useEffect(() => {
    if (!isBookmarksView || skipFilterReloadRef.current) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [
    isBookmarksView,
    loadDashboard,
    favoriteFilter,
    pinnedFilter,
    query,
    selectedFolderId,
    showFilters,
    sortBy,
    tagFilter,
    typeFilter,
  ]);

  useEffect(() => {
    if (dashboardMode !== 'folders') {
      lastViewModeRef.current = dashboardMode;
    }
  }, [dashboardMode]);

  function handleSaved() {
    void loadDashboard();
  }

  const bookmarkMenuActions = useBookmarkActions({
    onEdit: (bookmark) => setEditingId(bookmark.id),
    onChanged: handleSaved,
  });

  const folderMenuActions = useFolderActions({
    onChanged: handleSaved,
    onDeleted: (folder) => handleFolderDeleted(folder.id),
  });

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

  function handleSelectFolder(folderId) {
    setSelectedFolderId(folderId);

    if (!isBookmarksView) {
      setFolderPanelOpen(false);
    }
  }

  async function handleOpenBookmark(bookmark) {
    const { bookmark: updated } = await apiClient.bookmarks.open({
      url: bookmark.url,
      bookmarkId: bookmark.id,
    });

    if (!updated) {
      return;
    }

    const patch = {
      lastOpenedAt: updated.lastOpenedAt,
      openCount: updated.openCount,
    };

    setBookmarksPage((current) => ({
      ...current,
      items: current.items.map((item) => (
        item.bookmark.id === bookmark.id
          ? { ...item, bookmark: { ...item.bookmark, ...patch } }
          : item
      )),
    }));

    setGridBookmarks((current) => current.map((item) => (
      item.bookmark.id === bookmark.id
        ? { ...item, bookmark: { ...item.bookmark, ...patch } }
        : item
    )));
  }

  const dashboardLoading = loading && !isBookmarksView;

  return (
    <div className="dashboard-figma">
      {isBookmarksView && (
        <>
          <DashboardHeader
            query={query}
            onQueryChange={setQuery}
            filtersActive={showFilters}
            onFiltersClick={() => setShowFilters((current) => !current)}
          />

          {showFilters && (
            <SearchBar
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              statusFilter="all"
              onStatusFilterChange={() => {}}
              tagFilter={tagFilter}
              onTagFilterChange={setTagFilter}
              tags={tags}
              folders={folders}
              folderFilter={selectedFolderId}
              onFolderFilterChange={handleSelectFolder}
              favoriteFilter={favoriteFilter}
              onFavoriteFilterChange={setFavoriteFilter}
              pinnedFilter={pinnedFilter}
              onPinnedFilterChange={setPinnedFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              showBookmarkFilters
            />
          )}
        </>
      )}

      {error && <p className="error">{error}</p>}
      {dashboardLoading && <LoadingState />}

      {!loading && !isBookmarksView && isEmpty && !error && (
        <EmptyState
          title="Sin bookmarks todavía"
          message="Pulsa + en la barra lateral para añadir tu primer enlace."
        />
      )}

      {!loading && !isBookmarksView && !isEmpty && (
        <>
          <NewsCarousel
            items={newsItems}
            onOpen={handleOpenBookmark}
            onEdit={(bookmark) => setEditingId(bookmark.id)}
            menuActions={bookmarkMenuActions}
          />

          <QuickAccessFolders
            folders={pinnedFolders}
            onSelect={handleSelectFolder}
            menuActions={folderMenuActions}
          />

          <section className="dashboard-section dashboard-section--grid">
            <GridFilters value={gridFilter} onChange={setGridFilter} />
            <BookmarkList
              items={gridBookmarks}
              onEdit={(bookmark) => setEditingId(bookmark.id)}
              onOpen={handleOpenBookmark}
              menuActions={bookmarkMenuActions}
            />
          </section>
        </>
      )}

      {isBookmarksView && (
        <section className="dashboard-section dashboard-section--grid bookmarks-view">
          <div className="bookmarks-view__header">
            <h2 className="dashboard-section__title">Bookmarks</h2>
            {!bookmarksLoading && bookmarksPage.total > 0 && (
              <span className="bookmarks-view__count muted">
                {bookmarksPage.items.length} de {bookmarksPage.total}
              </span>
            )}
          </div>

          {bookmarksLoading && bookmarksPage.items.length === 0 && <LoadingState />}

          {!bookmarksLoading && bookmarksPage.total === 0 && !error && (
            <EmptyState message="No hay bookmarks que coincidan." />
          )}

          {bookmarksPage.items.length > 0 && (
            <>
              <BookmarkList
                items={bookmarksPage.items}
                onEdit={(bookmark) => setEditingId(bookmark.id)}
                onOpen={handleOpenBookmark}
                menuActions={bookmarkMenuActions}
              />

              {bookmarksPage.hasMore && (
                <button
                  type="button"
                  className="btn-secondary bookmarks-load-more"
                  disabled={bookmarksLoading}
                  onClick={() => void loadDashboard({
                    appendBookmarks: true,
                    bookmarksOffset: bookmarksPage.offset,
                  })}
                >
                  {bookmarksLoading ? 'Cargando…' : 'Cargar más'}
                </button>
              )}
            </>
          )}
        </section>
      )}

      <FolderPanel
        open={folderPanelOpen}
        onClose={() => setFolderPanelOpen(false)}
        folders={folders}
        bookmarks={bookmarks}
        selectedFolderId={selectedFolderId}
        onSelectFolder={handleSelectFolder}
        onFolderCreated={handleFolderCreated}
        onFolderDeleted={handleFolderDeleted}
        menuActions={folderMenuActions}
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
