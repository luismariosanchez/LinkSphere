import searchIcon from '../assets/icons/search_icon.svg';
import filtersIcon from '../assets/icons/filters icon.svg';

export function DashboardHeader({ query, onQueryChange }) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__search">
        <img src={searchIcon} alt="" className="dashboard-header__search-icon" />
        <input
          type="search"
          className="dashboard-header__input"
          placeholder="Search bookmark"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      {/* TODO: panel de filtros avanzados — diseño pendiente */}
      <button
        type="button"
        className="dashboard-header__filters-btn"
        aria-label="Filtros"
        title="Filtros (próximamente)"
      >
        <img src={filtersIcon} alt="" className="dashboard-header__filters-icon" />
      </button>
    </header>
  );
}
