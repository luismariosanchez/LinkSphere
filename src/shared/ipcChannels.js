export const IPC_CHANNELS = {
  APP_PING: 'app:ping',
  APP_OPEN_EXTERNAL: 'app:openExternal',
  APP_WIPE_DATA: 'app:wipeData',

  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',

  BOOKMARKS_CREATE: 'bookmarks:create',
  BOOKMARKS_GET_ALL: 'bookmarks:getAll',
  BOOKMARKS_GET_BY_ID: 'bookmarks:getById',
  BOOKMARKS_UPDATE: 'bookmarks:update',
  BOOKMARKS_DELETE: 'bookmarks:delete',
  BOOKMARKS_RESCAN: 'bookmarks:rescan',
  BOOKMARKS_GET_WITH_STATE: 'bookmarks:getWithState',
  BOOKMARKS_EXPORT: 'bookmarks:export',
  BOOKMARKS_IMPORT: 'bookmarks:import',
  BOOKMARKS_IMPORT_PROGRESS: 'bookmarks:importProgress',
  BOOKMARKS_GET_RECENT: 'bookmarks:getRecent',
  BOOKMARKS_GET_FAVORITES: 'bookmarks:getFavorites',
  BOOKMARKS_QUERY: 'bookmarks:query',
  BOOKMARKS_GET_BY_FOLDER: 'bookmarks:getByFolder',

  EVENTS_GET_ALL: 'events:getAll',
  EVENTS_GET_BY_BOOKMARK_ID: 'events:getByBookmarkId',
  EVENTS_GET_LATEST: 'events:getLatest',

  TAGS_GET_ALL: 'tags:getAll',
  TAGS_CREATE: 'tags:create',
  TAGS_DELETE: 'tags:delete',
  TAGS_GET_BY_BOOKMARK_ID: 'tags:getByBookmarkId',

  FOLDERS_GET_ALL: 'folders:getAll',
  FOLDERS_GET_ALL_WITH_STATS: 'folders:getAllWithStats',
  FOLDERS_GET_BY_ID: 'folders:getById',
  FOLDERS_GET_STATS: 'folders:getStats',
  FOLDERS_GET_PINNED: 'folders:getPinned',
  FOLDERS_CREATE: 'folders:create',
  FOLDERS_UPDATE: 'folders:update',
  FOLDERS_DELETE: 'folders:delete',
  FOLDERS_SUGGEST: 'folders:suggest',

  SUGGESTIONS_GET: 'suggestions:get',

  RULES_GET_ALL: 'rules:getAll',
  RULES_UPDATE: 'rules:update',
  RULES_ADD: 'rules:addRule',
  RULES_DELETE: 'rules:deleteRule',
};
