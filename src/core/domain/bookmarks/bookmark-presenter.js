import { resolveCardBadge } from './bookmark-badge.js';

export function buildTagMap(tags) {
  const map = {};
  for (const tag of tags) {
    map[tag.id] = tag;
  }
  return map;
}

export function resolveBookmarkTags(bookmark, tagMap) {
  return (bookmark.tagIds ?? [])
    .map((id) => tagMap[id])
    .filter(Boolean);
}

export function getStatusLabel(status) {
  const labels = {
    live: 'En vivo',
    offline: 'Offline',
    ok: 'Activo',
    dead: 'Caído',
    error: 'Error',
    unknown: 'Indeterminado',
  };

  return labels[status] ?? status;
}

export function getTypeLabel(type) {
  const labels = {
    youtube: 'YouTube',
    twitch: 'Twitch',
    generic: 'Web',
    anime: 'Anime',
    unknown: 'Desconocido',
  };

  return labels[type] ?? type;
}

function buildFolderLookup(folders) {
  const folderMap = Object.fromEntries(folders.map((folder) => [folder.id, folder]));
  const pinnedFolderIds = new Set(
    folders.filter((folder) => folder.pinOrder != null).map((folder) => folder.id),
  );

  return { folderMap, pinnedFolderIds };
}

export function enrichBookmarkCard(bookmark, {
  tags = [],
  folders = [],
  folderName = null,
  lastEvent = null,
}) {
  const tagMap = buildTagMap(tags);
  const resolvedTags = resolveBookmarkTags(bookmark, tagMap);
  const { folderMap, pinnedFolderIds } = buildFolderLookup(folders);
  const resolvedFolderName = folderName ?? (
    bookmark.folderId ? folderMap[bookmark.folderId]?.name ?? null : null
  );
  const badge = resolveCardBadge(bookmark, lastEvent);
  const isDown = bookmark.lastStatus === 'dead' || bookmark.lastStatus === 'error';

  return {
    bookmark,
    tags: resolvedTags,
    folderName: resolvedFolderName,
    isFolderPinned: bookmark.folderId ? pinnedFolderIds.has(bookmark.folderId) : false,
    badge,
    providerLabel: getTypeLabel(bookmark.type),
    statusLabel: getStatusLabel(bookmark.lastStatus),
    tagLabel: resolvedTags[0]?.name ?? getTypeLabel(bookmark.type),
    isDown,
    lastEvent,
  };
}

export function enrichBookmarkList(bookmarks, context) {
  return bookmarks.map((bookmark) => enrichBookmarkCard(bookmark, context));
}
