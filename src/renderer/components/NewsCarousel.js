import arrowIcon from '../assets/icons/arrow_rigth.svg';
import { BookmarkCard } from './BookmarkCard.js';

export function NewsCarousel({ items, onOpen, onEdit }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="dashboard-section">
      <div className="dashboard-section__header">
        <h2 className="dashboard-section__title">Novedades</h2>
        <button type="button" className="dashboard-section__arrow" aria-label="Ver más">
          <img src={arrowIcon} alt="" />
        </button>
      </div>

      <div className="news-carousel scrollbar-hidden">
        {items.map(({ bookmark, event, tags, folderName }) => (
          <BookmarkCard
            key={bookmark.id}
            className="bookmark-card--carousel"
            bookmark={bookmark}
            tags={tags}
            folderName={folderName}
            lastEvent={event}
            onOpen={onOpen}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}
