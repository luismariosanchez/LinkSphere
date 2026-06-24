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

  void lastEvent;

  return null;
}
