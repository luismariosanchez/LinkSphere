export class BookmarkQueryService {
  constructor({ bookmarksRepo, folderService, eventService }) {
    this.bookmarksRepo = bookmarksRepo;
    this.folderService = folderService;
    this.eventService = eventService;
  }

  getRecentBookmarks(limit = 10) {
    return this.bookmarksRepo.getRecentBookmarks(limit);
  }

  queryBookmarks(filters = {}) {
    const normalized = {
      search: typeof filters.search === 'string' ? filters.search.trim() : undefined,
      folderId: filters.folderId,
      tagId: filters.tagId || undefined,
      type: filters.type,
      favorite: filters.favorite === true ? true : undefined,
      pinnedFolder: filters.pinnedFolder === true ? true : undefined,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      offset: Number.isFinite(filters.offset) ? filters.offset : 0,
      limit: Number.isFinite(filters.limit) ? filters.limit : undefined,
    };

    if (!normalized.search) {
      delete normalized.search;
    }

    return this.bookmarksRepo.queryBookmarks(normalized);
  }

  getBookmarksByFolder(folderId, options = {}) {
    if (!folderId) {
      throw new Error('folderId es obligatorio');
    }

    return this.queryBookmarks({
      folderId,
      search: options.search,
      sortBy: options.sortBy ?? 'title',
      sortDir: options.sortDir ?? 'asc',
      offset: options.offset ?? 0,
      limit: options.limit ?? 50,
    });
  }

  getFavoriteBookmarks() {
    return this.bookmarksRepo.getFavoriteBookmarks();
  }

  #resolveFolderName(folderId) {
    if (!folderId) {
      return null;
    }

    return this.folderService.getFolders().find((folder) => folder.id === folderId)?.name ?? null;
  }

  getLatestEvents(limit = 20) {
    return this.eventService.getLatestEvents(limit)
      .map((event) => {
        const bookmark = this.bookmarksRepo.getById(event.bookmarkId);

        if (!bookmark) {
          return null;
        }

        return {
          event,
          bookmark,
          folderName: this.#resolveFolderName(bookmark.folderId),
        };
      })
      .filter(Boolean);
  }
}
