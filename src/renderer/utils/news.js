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

export function buildNewsItems(bookmarks, events, limit = 12) {
  const bookmarkMap = Object.fromEntries(bookmarks.map((b) => [b.id, b]));
  const latestEventByBookmark = {};

  for (const event of events) {
    if (!latestEventByBookmark[event.bookmarkId]) {
      latestEventByBookmark[event.bookmarkId] = event;
    }
  }

  const scored = bookmarks.map((bookmark) => {
    const event = latestEventByBookmark[bookmark.id];
    const score = event
      ? new Date(event.createdAt).getTime()
      : new Date(bookmark.createdAt).getTime();

    return { bookmark, event, score };
  });

  return scored
    .filter(({ bookmark, event }) => (
      bookmark.lastStatus === 'live'
      || bookmark.lastStatus === 'offline'
      || event
    ))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
