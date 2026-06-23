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

function BookmarkSection({ title, bookmarks, tagMap, folderMap, onOpen, onEdit, onDelete }) {
  if (bookmarks.length === 0) {
    return null;
  }

  return (
    <section className="bookmark-section">
      {title && <h2 className="bookmark-section__title">{title}</h2>}
      <div className="bookmark-grid">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            tags={resolveBookmarkTags(bookmark, tagMap)}
            folderName={bookmark.folderId ? folderMap[bookmark.folderId] : null}
            onOpen={onOpen}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}

export function BookmarkGrid({
  bookmarks,
  tags,
  folders,
  filters,
  selectedFolderId = 'all',
  onEdit,
  onDelete,
}) {
  const tagMap = buildTagMap(tags);
  const folderMap = Object.fromEntries(folders.map((f) => [f.id, f.name]));
  let filtered = filterBookmarks(bookmarks, filters);

  if (selectedFolderId === 'none') {
    filtered = filtered.filter((bookmark) => !bookmark.folderId);
  } else if (selectedFolderId !== 'all') {
    filtered = filtered.filter((bookmark) => bookmark.folderId === selectedFolderId);
  }

  function handleOpen(url) {
    void apiClient.app.openExternal(url);
  }

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay bookmarks que coincidan con los filtros.</p>
      </div>
    );
  }

  if (folders.length === 0 || selectedFolderId !== 'all') {
    const sectionTitle = selectedFolderId === 'none'
      ? 'Sin carpeta'
      : selectedFolderId !== 'all'
        ? folderMap[selectedFolderId] ?? 'Carpeta'
        : null;

    return (
      <BookmarkSection
        title={sectionTitle}
        bookmarks={filtered}
        tagMap={tagMap}
        folderMap={folderMap}
        onOpen={handleOpen}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  const loose = filtered.filter((bookmark) => !bookmark.folderId);
  const byFolder = folders.map((folder) => ({
    folder,
    bookmarks: filtered.filter((bookmark) => bookmark.folderId === folder.id),
  }));

  return (
    <div className="bookmark-sections">
      {loose.length > 0 && (
        <BookmarkSection
          title="Sin carpeta"
          bookmarks={loose}
          tagMap={tagMap}
          folderMap={folderMap}
          onOpen={handleOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}

      {byFolder.map(({ folder, bookmarks: folderBookmarks }) => (
        <BookmarkSection
          key={folder.id}
          title={folder.name}
          bookmarks={folderBookmarks}
          tagMap={tagMap}
          folderMap={folderMap}
          onOpen={handleOpen}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
