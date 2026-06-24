import arrowIcon from '../assets/icons/arrow_rigth.svg';
import { BookmarkCard } from './BookmarkCard.js';
import { DashboardSection } from './DashboardSection.js';
import { useDragScroll } from '../hooks/useDragScroll.js';

export function NewsCarousel({ items, onOpen, onEdit }) {
  const { ref, dragHandlers } = useDragScroll();

  if (items.length === 0) {
    return null;
  }

  return (
    <DashboardSection
      title="Novedades"
      headerAction={(
        <button type="button" className="dashboard-section__arrow" aria-label="Ver más">
          <img src={arrowIcon} alt="" />
        </button>
      )}
    >
      <div
        ref={ref}
        className="news-carousel scrollbar-hidden"
        {...dragHandlers}
      >
        {items.map(({ event, card }) => (
          <BookmarkCard
            key={event.id}
            className="bookmark-card--carousel"
            bookmark={card.bookmark}
            tags={card.tags}
            folderName={card.folderName}
            isFolderPinned={card.isFolderPinned}
            badge={card.badge}
            providerLabel={card.providerLabel}
            statusLabel={card.statusLabel}
            tagLabel={card.tagLabel}
            isDown={card.isDown}
            onOpen={onOpen}
            onEdit={onEdit}
          />
        ))}
      </div>
    </DashboardSection>
  );
}
