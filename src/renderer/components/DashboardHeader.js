import searchIcon from '../assets/icons/search_icon.svg';
import filtersIcon from '../assets/icons/filters icon.svg';

export function DashboardHeader({ query, onQueryChange, onFiltersClick, filtersActive = false }) {
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

      <button
        type="button"
        className={filtersActive
          ? 'dashboard-header__filters-btn dashboard-header__filters-btn--active'
          : 'dashboard-header__filters-btn'}
        aria-label="Filtros"
        aria-pressed={filtersActive}
        title="Filtros"
        onClick={onFiltersClick}
      >
        <img src={filtersIcon} alt="" className="dashboard-header__filters-icon" />
      </button>
    </header>
  );
}
