import arrowIcon from '../assets/icons/arrow_rigth.svg';
import { BookmarkCard } from './BookmarkCard.js';
import { useDragScroll } from '../hooks/useDragScroll.js';
import { resolveBookmarkTags } from '../utils/bookmarks.js';

export function NewsCarousel({ items, tagMap, onOpen, onEdit }) {
  const { ref, dragHandlers } = useDragScroll();

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

      <div
        ref={ref}
        className="news-carousel scrollbar-hidden"
        {...dragHandlers}
      >
        {items.map(({ bookmark, event, folderName }) => (
          <BookmarkCard
            key={event.id}
            className="bookmark-card--carousel"
            bookmark={bookmark}
            tags={resolveBookmarkTags(bookmark, tagMap)}
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
