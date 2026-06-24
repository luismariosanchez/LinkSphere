import clockIcon from '../assets/icons/clock_icon.svg';
import starWhiteIcon from '../assets/icons/star_white_icon.svg';

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
        <button
          type="button"
          className={value === 'favorites' ? 'grid-filters__btn grid-filters__btn--active' : 'grid-filters__btn'}
          onClick={() => onChange('favorites')}
          aria-pressed={value === 'favorites'}
        >
          <img src={starWhiteIcon} alt="" className="grid-filters__icon" />
          Favoritos
        </button>
      </div>
    </div>
  );
}
