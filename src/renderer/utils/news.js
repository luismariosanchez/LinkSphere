export function resolveCardBadge(bookmark, lastEvent) {
  if (bookmark.lastStatus === 'dead' || bookmark.lastStatus === 'error') {
    return { text: 'Web caída', variant: 'down' };
  }

  if (bookmark.lastStatus === 'live') {
    return { text: 'En directo', variant: 'live' };
  }

  if (bookmark.lastStatus === 'offline') {
    return { text: 'Offline', variant: 'offline' };
  }

  // TODO: badge "New episode" — funcionalidad pendiente
  // if (lastEvent && ['YOUTUBE_NEW_VIDEO', 'TITLE_CHANGED', 'THUMBNAIL_CHANGED'].includes(lastEvent.type)) {
  //   return { text: 'New episode', variant: 'new' };
  // }

  return null;
}
