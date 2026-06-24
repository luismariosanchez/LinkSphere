export class GetRecentBookmarksUseCase {
  constructor({ bookmarkQueryService }) {
    this.bookmarkQueryService = bookmarkQueryService;
  }

  execute(limit = 10) {
    return this.bookmarkQueryService.getRecentBookmarks(limit);
  }
}
