import { useState } from 'react';
import folderIcon from '../assets/icons/folder_in_bookmark_card_icon.svg';
import internetIcon from '../assets/icons/internet-svgrepo-com.svg';
import { ContextMenu } from './ContextMenu.js';
import { TagChip } from './TagChip.js';

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

export function BookmarkCard({
  bookmark,
  tags = [],
  folderName,
  isFolderPinned = false,
  badge = null,
  tagLabel,
  isDown = false,
  onOpen,
  onEdit,
  menuActions = null,
  className = '',
}) {
  const [menuPosition, setMenuPosition] = useState(null);

  function handleCardClick() {
    onOpen?.(bookmark);
  }

  function handleContextMenu(event) {
    if (!menuActions) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setMenuPosition({ x: event.clientX, y: event.clientY });
  }

  const contextMenuItems = menuActions ? [
    {
      id: 'edit',
      label: 'Editar',
      onClick: () => menuActions.edit(bookmark),
    },
    {
      id: 'rescan',
      label: 'Recargar',
      onClick: () => menuActions.rescan(bookmark),
    },
    {
      id: 'favorite',
      label: bookmark.isFavorite ? 'Quitar favorito' : 'Añadir favorito',
      onClick: () => menuActions.toggleFavorite(bookmark),
    },
    {
      id: 'delete',
      label: 'Eliminar',
      danger: true,
      onClick: () => menuActions.delete(bookmark),
    },
  ] : [];

  return (
    <article
      className={`bookmark-card${className ? ` ${className}` : ''}`}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onEdit?.(bookmark);
      }}
      role="button"
      tabIndex={0}
      title={bookmark.url}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="bookmark-card__thumb-wrap">
        <BookmarkCardThumbnail thumbnail={bookmark.thumbnail} />

        <div className="bookmark-card__flags" aria-hidden="true">
          {bookmark.isFavorite && (
            <span className="bookmark-card__flag bookmark-card__flag--favorite" title="Favorito">
              ★
            </span>
          )}
          {isFolderPinned && (
            <span className="bookmark-card__flag bookmark-card__flag--pinned" title="Carpeta anclada">
              📌
            </span>
          )}
        </div>

        {isDown ? (
          <div className="bookmark-card__overlay bookmark-card__overlay--down">
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

        <div className="bookmark-card__tags">
          {(tags.length > 0 ? tags : tagLabel ? [{ id: '__fallback', name: tagLabel }] : []).map((tag) => (
            <TagChip key={tag.id} label={tag.name} />
          ))}
        </div>
      </div>

      {menuPosition && (
        <ContextMenu
          x={menuPosition.x}
          y={menuPosition.y}
          items={contextMenuItems}
          onClose={() => setMenuPosition(null)}
        />
      )}
    </article>
  );
}
