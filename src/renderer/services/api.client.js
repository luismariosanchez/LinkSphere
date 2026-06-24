function getApi() {
  if (!window.api) {
    throw new Error('window.api no está disponible');
  }

  return window.api;
}

export const apiClient = {
  app: {
    openExternal(url) {
      return getApi().app.openExternal(url);
    },

    wipeData() {
      return getApi().app.wipeData();
    },
  },

  settings: {
    get() {
      return getApi().settings.get();
    },

    update(partial) {
      return getApi().settings.update(partial);
    },
  },

  bookmarks: {
    create(input) {
      return getApi().bookmarks.create(input);
    },

    getAll() {
      return getApi().bookmarks.getAll();
    },

    getById(id) {
      return getApi().bookmarks.getById(id);
    },

    getWithState(id) {
      return getApi().bookmarks.getWithState(id);
    },

    rescan(id) {
      return getApi().bookmarks.rescan(id);
    },

    update(id, input) {
      return getApi().bookmarks.update(id, input);
    },

    delete(id) {
      return getApi().bookmarks.delete(id);
    },

    getRecent(limit) {
      return getApi().bookmarks.getRecent(limit);
    },

    getFavorites() {
      return getApi().bookmarks.getFavorites();
    },

    query(filters) {
      return getApi().bookmarks.query(filters);
    },

    getByFolder(folderId, options) {
      return getApi().bookmarks.getByFolder(folderId, options);
    },

    open(input) {
      return getApi().bookmarks.open(input);
    },

    exportToFile() {
      return getApi().bookmarks.exportToFile();
    },

    importFromFile() {
      return getApi().bookmarks.importFromFile();
    },

    onImportProgress(callback) {
      const api = getApi();
      if (!api.bookmarks?.onImportProgress) {
        return () => {};
      }
      return api.bookmarks.onImportProgress(callback);
    },
  },

  dashboard: {
    getData(input) {
      return getApi().dashboard.getData(input);
    },
  },

  events: {
    getAll() {
      return getApi().events.getAll();
    },

    getByBookmarkId(bookmarkId) {
      return getApi().events.getByBookmarkId(bookmarkId);
    },

    getLatest(limit) {
      return getApi().events.getLatest(limit);
    },
  },

  tags: {
    getAll() {
      return getApi().tags.getAll();
    },

    create(input) {
      return getApi().tags.create(input);
    },

    delete(id) {
      return getApi().tags.delete(id);
    },

    getByBookmarkId(bookmarkId) {
      return getApi().tags.getByBookmarkId(bookmarkId);
    },
  },

  folders: {
    async getAll() {
      try {
        const api = getApi();
        if (!api.folders?.getAll) {
          return [];
        }
        return await api.folders.getAll();
      } catch {
        return [];
      }
    },

    getAllWithStats() {
      return getApi().folders.getAllWithStats();
    },

    getById(id) {
      return getApi().folders.getById(id);
    },

    getStats(folderId) {
      return getApi().folders.getStats(folderId);
    },

    create(input) {
      return getApi().folders.create(input);
    },

    getPinned() {
      return getApi().folders.getPinned();
    },

    update(id, input) {
      return getApi().folders.update(id, input);
    },

    delete(id) {
      return getApi().folders.delete(id);
    },

    suggest(context) {
      return getApi().folders.suggest(context);
    },

    getViewData(input) {
      return getApi().folders.getViewData(input);
    },
  },

  suggestions: {
    get(context) {
      return getApi().suggestions.get(context);
    },
  },

  rules: {
    getAll() {
      return getApi().rules.getAll();
    },

    update(type, payload) {
      return getApi().rules.update(type, payload);
    },

    addRule(type, rule) {
      return getApi().rules.addRule(type, rule);
    },

    deleteRule(type, id) {
      return getApi().rules.deleteRule(type, id);
    },
  },

  quickAdd: {
    hide() {
      return getApi().quickAdd.hide();
    },

    getInitial() {
      return getApi().quickAdd.getInitial();
    },

    preview(url) {
      return getApi().quickAdd.preview(url);
    },

    onShown(callback) {
      const api = getApi();
      if (!api.quickAdd?.onShown) {
        return () => {};
      }
      return api.quickAdd.onShown(callback);
    },
  },

  bookmarksChanged: {
    onChanged(callback) {
      const api = getApi();
      if (!api.bookmarksChanged?.onChanged) {
        return () => {};
      }
      return api.bookmarksChanged.onChanged(callback);
    },
  },
};
