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

export function matchesSearch(bookmark, query) {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();
  return (
    bookmark.title?.toLowerCase().includes(normalized)
    || bookmark.url?.toLowerCase().includes(normalized)
  );
}

export function matchesTypeFilter(bookmark, typeFilter) {
  if (!typeFilter || typeFilter === 'all') {
    return true;
  }

  if (typeFilter === 'generic') {
    return ['generic', 'anime', 'unknown'].includes(bookmark.type);
  }

  return bookmark.type === typeFilter;
}

export function matchesStatusFilter(bookmark, statusFilter) {
  if (!statusFilter || statusFilter === 'all') {
    return true;
  }

  if (statusFilter === 'live') {
    return bookmark.lastStatus === 'live';
  }

  if (statusFilter === 'dead') {
    return bookmark.lastStatus === 'dead' || bookmark.lastStatus === 'error';
  }

  return true;
}

export function matchesTagFilter(bookmark, tagFilter) {
  if (!tagFilter) {
    return true;
  }

  return (bookmark.tagIds ?? []).includes(tagFilter);
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
