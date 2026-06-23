function getApi() {
  if (!window.api) {
    throw new Error('window.api no está disponible');
  }

  return window.api;
}

export const apiClient = {
  ping() {
    return getApi().ping();
  },

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

  events: {
    getAll() {
      return getApi().events.getAll();
    },

    getByBookmarkId(bookmarkId) {
      return getApi().events.getByBookmarkId(bookmarkId);
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

    create(input) {
      return getApi().folders.create(input);
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
};
