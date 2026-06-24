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
