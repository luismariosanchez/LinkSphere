const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'generic', label: 'Web' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'live', label: 'En vivo' },
  { value: 'dead', label: 'Caído' },
];

export function SearchBar({
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  tagFilter,
  onTagFilterChange,
  tags,
}) {
  return (
    <div className="search-bar">
      <input
        type="search"
        className="search-bar__input"
        placeholder="Buscar por título o URL…"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />

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
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
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
      </div>
    </div>
  );
}
