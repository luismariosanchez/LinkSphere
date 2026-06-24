import clockIcon from '../assets/icons/clock_icon.svg';

export function GridFilters({ value, onChange }) {
  return (
    <div className="grid-filters">
      <div className="grid-filters__tabs">
        <button
          type="button"
          className={value === 'recent' ? 'grid-filters__btn grid-filters__btn--active' : 'grid-filters__btn'}
          onClick={() => onChange('recent')}
        >
          <img src={clockIcon} alt="" className="grid-filters__icon" />
          Reciente
        </button>
        {/* Reciente / Favoritos: solo estado visual — sin lógica de filtrado aún */}
        <button
          type="button"
          className={value === 'favorites' ? 'grid-filters__btn grid-filters__btn--active' : 'grid-filters__btn'}
          onClick={() => onChange('favorites')}
          aria-pressed={value === 'favorites'}
        >
          Favoritos
        </button>
      </div>
    </div>
  );
}
