const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos los proveedores' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'generic', label: 'Web' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'live', label: 'En vivo' },
  { value: 'dead', label: 'Caído' },
];

const SORT_OPTIONS = [
  { value: 'title', label: 'Título' },
  { value: 'createdAt', label: 'Fecha creación' },
  { value: 'updatedAt', label: 'Última actualización' },
  { value: 'lastOpenedAt', label: 'Última apertura' },
];

export function SearchBar({
  query = '',
  onQueryChange = () => {},
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  tags,
  folders = [],
  folderFilter = 'all',
  onFolderFilterChange,
  favoriteFilter = 'all',
  onFavoriteFilterChange,
  pinnedFilter = 'all',
  onPinnedFilterChange,
  sortBy = 'title',
  onSortByChange,
  showBookmarkFilters = false,
}) {
  return (
    <div className="search-bar search-bar--dark">
      <div className="search-bar__filters">
        <select
          className="search-bar__select"
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value)}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          className="search-bar__select"
          value={tagFilter}
          onChange={(event) => onTagFilterChange(event.target.value)}
        >
          <option value="">Todos los tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        {showBookmarkFilters && (
          <>
            <select
              className="search-bar__select"
              value={folderFilter}
              onChange={(event) => onFolderFilterChange(event.target.value)}
            >
              <option value="all">Todas las carpetas</option>
              <option value="none">Sin carpeta</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>

            <select
              className="search-bar__select"
              value={favoriteFilter}
              onChange={(event) => onFavoriteFilterChange(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="yes">Favoritos</option>
            </select>

            <select
              className="search-bar__select"
              value={pinnedFilter}
              onChange={(event) => onPinnedFilterChange(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="yes">Carpeta anclada</option>
            </select>

            <select
              className="search-bar__select"
              value={sortBy}
              onChange={(event) => onSortByChange(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        )}

        {!showBookmarkFilters && (
          <select
            className="search-bar__select"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
