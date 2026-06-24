const DEFAULT_SORT_BY = 'title';

export function resolveSortDir(sortBy, sortDir) {
  if (sortDir === 'asc' || sortDir === 'desc') {
    return sortDir;
  }

  if (sortBy === 'title') {
    return 'asc';
  }

  return 'desc';
}

export function buildBookmarkQueryParams({
  search = '',
  folderId = 'all',
  tagId = '',
  type = 'all',
  favoriteFilter = 'all',
  pinnedFilter = 'all',
  sortBy = DEFAULT_SORT_BY,
  sortDir,
  offset = 0,
  limit = 50,
} = {}) {
  return {
    search: search.trim() || undefined,
    folderId,
    tagId: tagId || undefined,
    type,
    favorite: favoriteFilter === 'yes' ? true : undefined,
    pinnedFolder: pinnedFilter === 'yes' ? true : undefined,
    sortBy,
    sortDir: resolveSortDir(sortBy, sortDir),
    offset,
    limit,
  };
}
