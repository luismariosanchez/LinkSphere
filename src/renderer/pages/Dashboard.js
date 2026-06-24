import { useCallback, useEffect, useRef, useState } from 'react';

import { apiClient } from '../services/api.client.js';

import { BookmarkEditor } from '../components/BookmarkEditor.js';

import { BookmarkGrid } from '../components/BookmarkGrid.js';

import { DashboardHeader } from '../components/DashboardHeader.js';

import { FolderPanel } from '../components/FolderPanel.js';

import { GridFilters } from '../components/GridFilters.js';

import { NewsCarousel } from '../components/NewsCarousel.js';

import { QuickAccessFolders } from '../components/QuickAccessFolders.js';

import { SearchBar } from '../components/SearchBar.js';

import { buildTagMap } from '../utils/bookmarks.js';

import { buildBookmarkQueryParams } from '../utils/bookmark-query-params.js';



const NEWS_LIMIT = 12;

const BOOKMARKS_PAGE_SIZE = 50;

const SEARCH_DEBOUNCE_MS = 300;



const EMPTY_BOOKMARKS_PAGE = {

  items: [],

  total: 0,

  hasMore: false,

  offset: 0,

};



export function Dashboard({

  refreshKey = 0,

  dashboardMode = 'dashboard',

  onDashboardModeChange,

  onRegisterCreate,

}) {

  const isBookmarksView = dashboardMode === 'bookmarks';

  const lastViewModeRef = useRef('dashboard');



  const [bookmarks, setBookmarks] = useState([]);

  const [tags, setTags] = useState([]);

  const [folders, setFolders] = useState([]);

  const [newsItems, setNewsItems] = useState([]);

  const [pinnedFolders, setPinnedFolders] = useState([]);

  const [gridBookmarks, setGridBookmarks] = useState([]);

  const [bookmarksPage, setBookmarksPage] = useState(EMPTY_BOOKMARKS_PAGE);

  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  const [metadataLoading, setMetadataLoading] = useState(true);

  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [selectedFolderId, setSelectedFolderId] = useState('all');

  const [folderPanelOpen, setFolderPanelOpen] = useState(false);

  const [gridFilter, setGridFilter] = useState('recent');

  const [showFilters, setShowFilters] = useState(false);



  const [query, setQuery] = useState('');

  const [typeFilter, setTypeFilter] = useState('all');

  const [tagFilter, setTagFilter] = useState('');

  const [favoriteFilter, setFavoriteFilter] = useState('all');

  const [pinnedFilter, setPinnedFilter] = useState('all');

  const [sortBy, setSortBy] = useState('title');



  const [showAddForm, setShowAddForm] = useState(false);

  const [newUrl, setNewUrl] = useState('');

  const [creating, setCreating] = useState(false);



  const bookmarksQueryFilters = useCallback((overrides = {}) => buildBookmarkQueryParams({

    search: query,

    folderId: selectedFolderId,

    tagId: tagFilter,

    type: typeFilter,

    favoriteFilter,

    pinnedFilter,

    sortBy,

    limit: BOOKMARKS_PAGE_SIZE,

    ...overrides,

  }), [

    favoriteFilter,

    pinnedFilter,

    query,

    selectedFolderId,

    sortBy,

    tagFilter,

    typeFilter,

  ]);



  const loadDashboardGrid = useCallback(async () => {

    const isFavoritesTab = gridFilter === 'favorites';

    const hasCustomSort = showFilters && sortBy !== 'title';



    const result = await apiClient.bookmarks.query(buildBookmarkQueryParams({

      search: query,

      folderId: selectedFolderId,

      tagId: tagFilter,

      type: typeFilter,

      favoriteFilter: isFavoritesTab ? 'yes' : favoriteFilter,

      pinnedFilter,

      sortBy: hasCustomSort ? sortBy : (isFavoritesTab ? 'createdAt' : 'lastOpenedAt'),

      sortDir: hasCustomSort ? undefined : 'desc',

      offset: 0,

      limit: isFavoritesTab ? BOOKMARKS_PAGE_SIZE : 10,

    }));



    setGridBookmarks(result.items);

  }, [

    favoriteFilter,

    gridFilter,

    pinnedFilter,

    query,

    selectedFolderId,

    showFilters,

    sortBy,

    tagFilter,

    typeFilter,

  ]);



  const loadDashboardSections = useCallback(async () => {

    const [newsData, pinnedData] = await Promise.all([

      apiClient.events.getLatest(NEWS_LIMIT),

      apiClient.folders.getPinned(),

    ]);



    setNewsItems(newsData);

    setPinnedFolders(pinnedData);

  }, []);



  const loadBookmarksQuery = useCallback(async ({ reset = true, offset: offsetOverride } = {}) => {

    setBookmarksLoading(true);

    setError(null);



    try {

      const offset = reset ? 0 : (offsetOverride ?? 0);



      const result = await apiClient.bookmarks.query(bookmarksQueryFilters({ offset }));



      setBookmarksPage((current) => ({

        items: reset ? result.items : [...current.items, ...result.items],

        total: result.total,

        hasMore: result.hasMore,

        offset: offset + result.items.length,

      }));

    } catch (err) {

      setError(err?.message ?? 'Error al cargar bookmarks');

    } finally {

      setBookmarksLoading(false);

    }

  }, [bookmarksQueryFilters]);



  const loadMetadata = useCallback(async () => {

    const [tagsData, foldersData] = await Promise.all([

      apiClient.tags.getAll(),

      apiClient.folders.getAll(),

    ]);



    setTags(tagsData);

    setFolders(foldersData);

  }, []);



  const loadData = useCallback(async () => {

    setMetadataLoading(true);

    setError(null);



    try {

      await loadMetadata();



      void apiClient.bookmarks.getAll().then(setBookmarks);



      if (!isBookmarksView) {

        await loadDashboardSections();

        await loadDashboardGrid();

      }

    } catch (err) {

      setError(err?.message ?? 'Error al cargar datos');

    } finally {

      setMetadataLoading(false);

    }

  }, [isBookmarksView, loadDashboardGrid, loadDashboardSections, loadMetadata]);



  useEffect(() => {

    onRegisterCreate?.(() => setShowAddForm(true));

  }, [onRegisterCreate]);



  useEffect(() => {

    void loadData();

  }, [loadData, refreshKey]);

  useEffect(() => {
    if (isBookmarksView || metadataLoading) {

      return undefined;

    }



    const timer = window.setTimeout(() => {

      void loadDashboardGrid();

    }, SEARCH_DEBOUNCE_MS);



    return () => window.clearTimeout(timer);

  }, [

    favoriteFilter,

    gridFilter,

    isBookmarksView,

    metadataLoading,

    loadDashboardGrid,

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



  useEffect(() => {

    if (!isBookmarksView || metadataLoading) {

      return undefined;

    }



    const timer = window.setTimeout(() => {

      void loadBookmarksQuery({ reset: true });

    }, SEARCH_DEBOUNCE_MS);



    return () => window.clearTimeout(timer);

  }, [

    favoriteFilter,

    isBookmarksView,

    metadataLoading,

    loadBookmarksQuery,

    pinnedFilter,

    query,

    selectedFolderId,

    sortBy,

    tagFilter,

    typeFilter,

  ]);



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



      if (isBookmarksView) {

        await loadBookmarksQuery({ reset: true });

      }



      setEditingId(created.id);

    } catch (err) {

      setError(err?.message ?? 'Error al crear bookmark');

    } finally {

      setCreating(false);

    }

  }



  function handleSaved() {

    void loadData();



    if (isBookmarksView) {

      void loadBookmarksQuery({ reset: true });

    } else {

      void loadDashboardGrid();

    }

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



  function handleSelectFolder(folderId) {

    setSelectedFolderId(folderId);



    if (!isBookmarksView) {

      setFolderPanelOpen(false);

    }

  }



  function handleFolderFilterChange(folderId) {

    handleSelectFolder(folderId);

  }



  const tagMap = buildTagMap(tags);



  function handleOpenBookmark(bookmark) {

    void apiClient.app.openExternal(bookmark.url);



    const openedAt = new Date().toISOString();



    setBookmarksPage((current) => ({

      ...current,

      items: current.items.map((item) => (

        item.id === bookmark.id

          ? {

              ...item,

              lastOpenedAt: openedAt,

              openCount: (item.openCount ?? 0) + 1,

            }

          : item

      )),

    }));

  }



  const dashboardLoading = metadataLoading && !isBookmarksView;



  return (

    <div className="dashboard-figma">

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

          onFolderFilterChange={handleFolderFilterChange}

          favoriteFilter={favoriteFilter}

          onFavoriteFilterChange={setFavoriteFilter}

          pinnedFilter={pinnedFilter}

          onPinnedFilterChange={setPinnedFilter}

          sortBy={sortBy}

          onSortByChange={setSortBy}

          showBookmarkFilters

        />

      )}



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

      {dashboardLoading && <p className="muted">Cargando…</p>}



      {!metadataLoading && !isBookmarksView && bookmarks.length === 0 && !error && (

        <div className="empty-state empty-state--dark">

          <h2>Sin bookmarks todavía</h2>

          <p className="muted">Pulsa + en la barra lateral para añadir tu primer enlace.</p>

        </div>

      )}



      {!metadataLoading && !isBookmarksView && (

        <>

          <NewsCarousel

            items={newsItems}

            tagMap={tagMap}

            onOpen={handleOpenBookmark}

            onEdit={(bookmark) => setEditingId(bookmark.id)}

          />



          <QuickAccessFolders

            folders={pinnedFolders}

            onSelect={handleSelectFolder}

          />



          <section className="dashboard-section dashboard-section--grid">

            <GridFilters value={gridFilter} onChange={setGridFilter} />



            <BookmarkGrid

              bookmarks={gridBookmarks}

              tags={tags}

              folders={folders}

              onEdit={(bookmark) => setEditingId(bookmark.id)}

              onOpen={handleOpenBookmark}

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



          {bookmarksLoading && bookmarksPage.items.length === 0 && (

            <p className="muted">Cargando…</p>

          )}



          {!bookmarksLoading && bookmarksPage.total === 0 && !error && (

            <div className="empty-state empty-state--dark">

              <p className="muted">No hay bookmarks que coincidan.</p>

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

                  disabled={bookmarksLoading}

                  onClick={() => void loadBookmarksQuery({

                    reset: false,

                    offset: bookmarksPage.offset,

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


