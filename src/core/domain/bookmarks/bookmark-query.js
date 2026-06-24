const SORT_COLUMNS = {
  title: 'b.title COLLATE NOCASE',
  createdAt: 'b.created_at',
  updatedAt: 'COALESCE(bs.updated_at, b.last_checked, b.created_at)',
  lastOpenedAt: 'COALESCE(b.last_opened_at, b.created_at)',
};

const DEFAULT_SORT = 'title';
const DEFAULT_SORT_DIR = 'asc';
const DEFAULT_LIMIT = 50;

function normalizeSortBy(sortBy) {
  return SORT_COLUMNS[sortBy] ? sortBy : DEFAULT_SORT;
}

function normalizeSortDir(sortDir) {
  return sortDir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
}

function buildWhereClause(filters) {
  const conditions = ['1 = 1'];
  const params = {};

  if (filters.search) {
    conditions.push(`(
      LOWER(b.title) LIKE @search
      OR LOWER(b.url) LIKE @search
      OR LOWER(t.name) LIKE @search
      OR LOWER(f.name) LIKE @search
    )`);
    params.search = `%${filters.search.trim().toLowerCase()}%`;
  }

  if (filters.folderId === 'none') {
    conditions.push('b.folder_id IS NULL');
  } else if (filters.folderId && filters.folderId !== 'all') {
    conditions.push('b.folder_id = @folderId');
    params.folderId = filters.folderId;
  }

  if (filters.tagId) {
    conditions.push(`EXISTS (
      SELECT 1 FROM bookmark_tags bt_filter
      WHERE bt_filter.bookmark_id = b.id AND bt_filter.tag_id = @tagId
    )`);
    params.tagId = filters.tagId;
  }

  if (filters.type && filters.type !== 'all') {
    if (filters.type === 'generic') {
      conditions.push(`b.type IN ('generic', 'anime', 'unknown')`);
    } else {
      conditions.push('b.type = @type');
      params.type = filters.type;
    }
  }

  if (filters.favorite === true) {
    conditions.push('b.is_favorite = 1');
  }

  if (filters.pinnedFolder === true) {
    conditions.push('f.pin_order IS NOT NULL');
  }

  return {
    whereSql: conditions.join(' AND '),
    params,
  };
}

export function buildBookmarkQuery(filters = {}) {
  const sortBy = normalizeSortBy(filters.sortBy);
  const sortDir = normalizeSortDir(filters.sortDir);
  const limit = Number.isFinite(filters.limit) && filters.limit > 0
    ? Math.floor(filters.limit)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(filters.offset) && filters.offset >= 0
    ? Math.floor(filters.offset)
    : 0;

  const { whereSql, params } = buildWhereClause(filters);

  const fromSql = `
    FROM bookmarks b
    LEFT JOIN bookmark_state bs ON bs.bookmark_id = b.id
    LEFT JOIN bookmark_tags bt ON bt.bookmark_id = b.id
    LEFT JOIN tags t ON t.id = bt.tag_id
    LEFT JOIN folders f ON f.id = b.folder_id
    WHERE ${whereSql}
  `;

  return {
    sortBy,
    sortDir,
    limit,
    offset,
    params: { ...params, limit, offset },
    countSql: `SELECT COUNT(DISTINCT b.id) AS total ${fromSql}`,
    selectSql: `
      SELECT DISTINCT b.*
      ${fromSql}
      ORDER BY ${SORT_COLUMNS[sortBy]} ${sortDir}, b.id ASC
      LIMIT @limit OFFSET @offset
    `,
  };
}

export const BOOKMARK_QUERY_DEFAULTS = {
  sortBy: DEFAULT_SORT,
  sortDir: DEFAULT_SORT_DIR,
  limit: DEFAULT_LIMIT,
  offset: 0,
};
