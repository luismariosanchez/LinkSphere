import { useState } from 'react';
import folderIcon from '../assets/icons/folder_in_bookmark_card_icon.svg';
import internetIcon from '../assets/icons/internet-svgrepo-com.svg';
import { TagChip } from './TagChip.js';
import { getTypeLabel } from '../utils/bookmarks.js';
import { resolveCardBadge } from '../utils/news.js';

function BookmarkCardThumbnail({ thumbnail }) {
  const [hasError, setHasError] = useState(false);
  const showPlaceholder = !thumbnail || hasError;

  if (showPlaceholder) {
    return (
      <div className="bookmark-card__thumb bookmark-card__thumb--empty">
        <img src={internetIcon} alt="" className="bookmark-card__thumb-placeholder" />
      </div>
    );
  }

  return (
    <img
      src={thumbnail}
      alt=""
      className="bookmark-card__thumb"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

export function BookmarkCard({  bookmark,
  tags,
  folderName,
  lastEvent,
  onOpen,
  onEdit,
  className = '',
}) {
  const badge = resolveCardBadge(bookmark, lastEvent);
  const isDown = bookmark.lastStatus === 'dead' || bookmark.lastStatus === 'error';
  const tagLabel = tags[0]?.name ?? getTypeLabel(bookmark.type);

  function handleCardClick() {
    onOpen?.(bookmark.url);
  }

  return (
    <article
      className={`bookmark-card${className ? ` ${className}` : ''}`}
      onClick={handleCardClick}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onEdit?.(bookmark);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="bookmark-card__thumb-wrap">
        <BookmarkCardThumbnail thumbnail={bookmark.thumbnail} />

        {isDown ? (          <div className="bookmark-card__overlay bookmark-card__overlay--down">
            <span className="bookmark-card__overlay-text">Web caída</span>
          </div>
        ) : badge ? (
          <span className={`bookmark-card__badge bookmark-card__badge--${badge.variant}`}>
            {badge.text}
          </span>
        ) : null}
      </div>

      <div className="bookmark-card__body">
        <h3 className="bookmark-card__title">{bookmark.title}</h3>

        {folderName && (
          <p className="bookmark-card__folder">
            <img src={folderIcon} alt="" className="bookmark-card__folder-icon" />
            <span className="bookmark-card__folder-name">{folderName}</span>
          </p>
        )}

        <TagChip label={tagLabel} />
      </div>
    </article>
  );
}
