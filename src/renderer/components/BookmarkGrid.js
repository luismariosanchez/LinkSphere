import { BookmarkCard } from './BookmarkCard.js';
import { apiClient } from '../services/api.client.js';
import {
  buildTagMap,
  matchesSearch,
  matchesStatusFilter,
  matchesTagFilter,
  matchesTypeFilter,
  resolveBookmarkTags,
} from '../utils/bookmarks.js';

function filterBookmarks(bookmarks, filters) {
  return bookmarks.filter((bookmark) => (
    matchesSearch(bookmark, filters.query)
    && matchesTypeFilter(bookmark, filters.typeFilter)
    && matchesStatusFilter(bookmark, filters.statusFilter)
    && matchesTagFilter(bookmark, filters.tagFilter)
  ));
}

export function BookmarkGrid({
  bookmarks,
  tags,
  folders,
  filters,
  selectedFolderId = 'all',
  events = [],
  onEdit,
}) {
  const tagMap = buildTagMap(tags);
  const folderMap = Object.fromEntries(folders.map((f) => [f.id, f.name]));
  const eventMap = {};

  for (const event of events) {
    if (!eventMap[event.bookmarkId]) {
      eventMap[event.bookmarkId] = event;
    }
  }

  let filtered = filterBookmarks(bookmarks, filters);

  if (selectedFolderId === 'none') {
    filtered = filtered.filter((bookmark) => !bookmark.folderId);
  } else if (selectedFolderId !== 'all') {
    filtered = filtered.filter((bookmark) => bookmark.folderId === selectedFolderId);
  }

  // Reciente / Favoritos: solo UI por ahora — sin orden ni filtro extra
  filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function handleOpen(url) {
    void apiClient.app.openExternal(url);
  }

  if (filtered.length === 0) {
    return (
      <div className="empty-state empty-state--dark">
        <p className="muted">No hay bookmarks que coincidan.</p>
      </div>
    );
  }

  return (
    <div className="bookmark-grid--figma">
      {filtered.map((bookmark) => (
        <BookmarkCard
          key={bookmark.id}
          bookmark={bookmark}
          tags={resolveBookmarkTags(bookmark, tagMap)}
          folderName={bookmark.folderId ? folderMap[bookmark.folderId] : null}
          lastEvent={eventMap[bookmark.id]}
          onOpen={handleOpen}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
