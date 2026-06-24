import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipcChannels.js';

const api = {
  ping: () => ipcRenderer.invoke(IPC_CHANNELS.APP_PING),

  app: {
    openExternal: (url) => ipcRenderer.invoke(IPC_CHANNELS.APP_OPEN_EXTERNAL, url),
    wipeData: () => ipcRenderer.invoke(IPC_CHANNELS.APP_WIPE_DATA),
  },

  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    update: (partial) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, partial),
  },

  bookmarks: {
    create: (input) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_CREATE, input),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_GET_ALL),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_GET_BY_ID, id),
    getWithState: (id) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_GET_WITH_STATE, id),
    rescan: (id) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_RESCAN, id),
    update: (id, input) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_UPDATE, id, input),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_DELETE, id),
    getRecent: (limit) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_GET_RECENT, limit),
    getFavorites: () => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_GET_FAVORITES),
    query: (filters) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_QUERY, filters),
    getByFolder: (folderId, options) => ipcRenderer.invoke(
      IPC_CHANNELS.BOOKMARKS_GET_BY_FOLDER,
      folderId,
      options,
    ),
    open: (input) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_OPEN, input),
    exportToFile: () => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_EXPORT),
    importFromFile: () => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARKS_IMPORT),
    onImportProgress: (callback) => {
      const handler = (_event, progress) => callback(progress);
      ipcRenderer.on(IPC_CHANNELS.BOOKMARKS_IMPORT_PROGRESS, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.BOOKMARKS_IMPORT_PROGRESS, handler);
      };
    },
  },

  dashboard: {
    getData: (input) => ipcRenderer.invoke(IPC_CHANNELS.DASHBOARD_GET_DATA, input),
  },

  events: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.EVENTS_GET_ALL),
    getByBookmarkId: (bookmarkId) => ipcRenderer.invoke(IPC_CHANNELS.EVENTS_GET_BY_BOOKMARK_ID, bookmarkId),
    getLatest: (limit) => ipcRenderer.invoke(IPC_CHANNELS.EVENTS_GET_LATEST, limit),
  },

  tags: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.TAGS_GET_ALL),
    create: (input) => ipcRenderer.invoke(IPC_CHANNELS.TAGS_CREATE, input),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.TAGS_DELETE, id),
    getByBookmarkId: (bookmarkId) => ipcRenderer.invoke(IPC_CHANNELS.TAGS_GET_BY_BOOKMARK_ID, bookmarkId),
  },

  folders: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_GET_ALL),
    getAllWithStats: () => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_GET_ALL_WITH_STATS),
    getById: (id) => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_GET_BY_ID, id),
    getStats: (folderId) => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_GET_STATS, folderId),
    getPinned: () => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_GET_PINNED),
    create: (input) => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_CREATE, input),
    update: (id, input) => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_UPDATE, id, input),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_DELETE, id),
    suggest: (context) => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_SUGGEST, context),
    getViewData: (input) => ipcRenderer.invoke(IPC_CHANNELS.FOLDERS_GET_VIEW_DATA, input),
  },

  suggestions: {
    get: (context) => ipcRenderer.invoke(IPC_CHANNELS.SUGGESTIONS_GET, context),
  },

  rules: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.RULES_GET_ALL),
    update: (type, payload) => ipcRenderer.invoke(IPC_CHANNELS.RULES_UPDATE, type, payload),
    addRule: (type, rule) => ipcRenderer.invoke(IPC_CHANNELS.RULES_ADD, type, rule),
    deleteRule: (type, id) => ipcRenderer.invoke(IPC_CHANNELS.RULES_DELETE, type, id),
  },

  quickAdd: {
    hide: () => ipcRenderer.invoke(IPC_CHANNELS.QUICK_ADD_HIDE),
    getInitial: () => ipcRenderer.invoke(IPC_CHANNELS.QUICK_ADD_GET_INITIAL),
    preview: (url) => ipcRenderer.invoke(IPC_CHANNELS.QUICK_ADD_PREVIEW, url),
    onShown: (callback) => {
      const handler = () => callback();
      ipcRenderer.on(IPC_CHANNELS.QUICK_ADD_SHOWN, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.QUICK_ADD_SHOWN, handler);
      };
    },
  },

  bookmarksChanged: {
    onChanged: (callback) => {
      const handler = () => callback();
      ipcRenderer.on(IPC_CHANNELS.BOOKMARKS_CHANGED, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.BOOKMARKS_CHANGED, handler);
      };
    },
  },
};

contextBridge.exposeInMainWorld('api', api);
