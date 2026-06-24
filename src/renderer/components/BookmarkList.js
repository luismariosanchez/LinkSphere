import { BookmarkCard } from './BookmarkCard.js';

export function BookmarkList({ items, onEdit, onOpen, className = 'bookmark-grid--figma' }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className={className}>
      {items.map((item) => (
        <BookmarkCard
          key={item.bookmark.id}
          bookmark={item.bookmark}
          tags={item.tags}
          folderName={item.folderName}
          isFolderPinned={item.isFolderPinned}
          badge={item.badge}
          tagLabel={item.tagLabel}
          isDown={item.isDown}
          lastEvent={item.lastEvent}
          className={item.className}
          onOpen={onOpen}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
