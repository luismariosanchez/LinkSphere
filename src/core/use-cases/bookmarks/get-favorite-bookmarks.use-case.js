export class GetFavoriteBookmarksUseCase {
  constructor({ bookmarkQueryService }) {
    this.bookmarkQueryService = bookmarkQueryService;
  }

  execute() {
    return this.bookmarkQueryService.getFavoriteBookmarks();
  }
}
