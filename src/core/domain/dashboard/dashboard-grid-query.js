import { buildBookmarkQueryParams } from '../bookmarks/bookmark-query-params.js';

const GRID_RECENT_LIMIT = 10;
const GRID_FAVORITES_LIMIT = 50;

export function buildDashboardGridQuery({
  gridFilter = 'recent',
  showFilters = false,
  sortBy = 'title',
  search = '',
  folderId = 'all',
  tagId = '',
  type = 'all',
  favoriteFilter = 'all',
  pinnedFilter = 'all',
} = {}) {
  const isFavoritesTab = gridFilter === 'favorites';
  const hasCustomSort = showFilters && sortBy !== 'title';

  return buildBookmarkQueryParams({
    search,
    folderId,
    tagId,
    type,
    favoriteFilter: isFavoritesTab ? 'yes' : favoriteFilter,
    pinnedFilter,
    sortBy: hasCustomSort ? sortBy : (isFavoritesTab ? 'createdAt' : 'lastOpenedAt'),
    sortDir: hasCustomSort ? undefined : 'desc',
    offset: 0,
    limit: isFavoritesTab ? GRID_FAVORITES_LIMIT : GRID_RECENT_LIMIT,
  });
}
