import { BookmarkCard } from './BookmarkCard.js';
import { apiClient } from '../services/api.client.js';
import { buildTagMap, resolveBookmarkTags } from '../utils/bookmarks.js';

export function BookmarkGrid({
  bookmarks,
  tags,
  folders,
  onEdit,
  onOpen,
}) {
  const tagMap = buildTagMap(tags);
  const folderMap = Object.fromEntries(folders.map((folder) => [folder.id, folder]));
  const pinnedFolderIds = new Set(
    folders.filter((folder) => folder.pinOrder != null).map((folder) => folder.id),
  );

  function handleOpen(bookmark) {
    if (onOpen) {
      onOpen(bookmark);
      return;
    }

    void apiClient.app.openExternal(bookmark.url);
  }

  if (bookmarks.length === 0) {
    return null;
  }

  return (
    <div className="bookmark-grid--figma">
      {bookmarks.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          tags={resolveBookmarkTags(bookmark, tagMap)}
          folderName={bookmark.folderId ? folderMap[bookmark.folderId]?.name : null}
          isFolderPinned={bookmark.folderId ? pinnedFolderIds.has(bookmark.folderId) : false}
          onOpen={handleOpen}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
