import { getStatusLabel, getTypeLabel } from '../utils/bookmarks.js';

export function BookmarkCard({ bookmark, tags, folderName, onOpen, onEdit, onDelete }) {
  const statusClass = bookmark.lastStatus === 'live'
    ? 'status-badge--live'
    : bookmark.lastStatus === 'dead' || bookmark.lastStatus === 'error'
      ? 'status-badge--dead'
      : bookmark.lastStatus === 'unknown'
        ? 'status-badge--unknown'
        : 'status-badge--neutral';

  function handleCardClick() {
    onOpen?.(bookmark.url);
  }

  function handleEdit(event) {
    event.stopPropagation();
    onEdit?.(bookmark);
  }

  function handleDelete(event) {
    event.stopPropagation();
    onDelete?.(bookmark);
  }

  return (
    <article
      className="bookmark-item bookmark-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardClick();
        }
      }}
    >
      {bookmark.thumbnail ? (
        <img
          src={bookmark.thumbnail}
          alt=""
          className="bookmark-item__thumb"
          loading="lazy"
        />
      ) : (
        <div className="bookmark-item__thumb bookmark-item__thumb--empty">
          Sin imagen
        </div>
      )}

      <div className="bookmark-item__body">
        <div className="bookmark-item__meta-row">
          <span className={`status-badge ${statusClass}`}>
            {getStatusLabel(bookmark.lastStatus)}
          </span>
          <span className="type-badge">{getTypeLabel(bookmark.type)}</span>
        </div>

        <h3 className="bookmark-item__title">{bookmark.title}</h3>

        <p className="bookmark-card__url muted">{bookmark.url}</p>

        {folderName && (
          <p className="bookmark-card__folder muted">📁 {folderName}</p>
        )}

        {tags.length > 0 && (
          <div className="bookmark-item__tags">
            {tags.map((tag) => (
              <span key={tag.id} className="tag-pill">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="bookmark-item__actions">
          <button type="button" className="btn-secondary" onClick={handleEdit}>
            Editar
          </button>
          <button type="button" className="btn-danger" onClick={handleDelete}>
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}
