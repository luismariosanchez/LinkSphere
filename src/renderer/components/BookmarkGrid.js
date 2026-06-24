import { BookmarkCard } from './BookmarkCard.js';
import { apiClient } from '../services/api.client.js';
import { buildTagMap, resolveBookmarkTags } from '../utils/bookmarks.js';

export function BookmarkGrid({
  bookmarks,
  tags,
  folders,
  onEdit,
}) {
  const tagMap = buildTagMap(tags);
  const folderMap = Object.fromEntries(folders.map((f) => [f.id, f.name]));

  function handleOpen(url) {
    void apiClient.app.openExternal(url);
  }

  if (bookmarks.length === 0) {
    return (
      <div className="empty-state empty-state--dark">
        <p className="muted">No hay bookmarks que coincidan.</p>
      </div>
    );
  }

  return (
    <div className="bookmark-grid--figma">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          tags={resolveBookmarkTags(bookmark, tagMap)}
          folderName={bookmark.folderId ? folderMap[bookmark.folderId] : null}
          onOpen={handleOpen}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
