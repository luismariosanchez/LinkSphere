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

  EVENTS_GET_ALL: 'events:getAll',
  EVENTS_GET_BY_BOOKMARK_ID: 'events:getByBookmarkId',

  TAGS_GET_ALL: 'tags:getAll',
  TAGS_CREATE: 'tags:create',
  TAGS_DELETE: 'tags:delete',
  TAGS_GET_BY_BOOKMARK_ID: 'tags:getByBookmarkId',

  FOLDERS_GET_ALL: 'folders:getAll',
  FOLDERS_CREATE: 'folders:create',
  FOLDERS_UPDATE: 'folders:update',
  FOLDERS_DELETE: 'folders:delete',
  FOLDERS_SUGGEST: 'folders:suggest',

  SUGGESTIONS_GET: 'suggestions:get',

  RULES_GET_ALL: 'rules:getAll',
  RULES_UPDATE: 'rules:update',
  RULES_ADD: 'rules:addRule',
  RULES_DELETE: 'rules:deleteRule',

  INGESTION_INGEST: 'ingestion:ingest',
  INGESTION_OPEN_QUICK_ADD: 'ingestion:openQuickAdd',
  INGESTION_BOOKMARK_CREATED: 'ingestion:bookmarkCreated',
};
