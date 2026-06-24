export class GetBookmarksUseCase {
  constructor({ bookmarkService, bookmarkQueryService }) {
    this.bookmarkService = bookmarkService;
    this.bookmarkQueryService = bookmarkQueryService;
  }

  executeAll() {
    return this.bookmarkService.getAll();
  }

  executeById(id) {
    return this.bookmarkService.getById(id);
  }

  executeWithState(id) {
    return this.bookmarkService.getWithState(id);
  }

  executeQuery(filters) {
    return this.bookmarkQueryService.queryBookmarks(filters);
  }

  executeRecent(limit) {
    return this.bookmarkQueryService.getRecentBookmarks(limit);
  }

  executeFavorites() {
    return this.bookmarkQueryService.getFavoriteBookmarks();
  }
}
