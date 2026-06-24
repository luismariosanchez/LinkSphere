export class GetFolderBookmarksUseCase {
  constructor({ bookmarkQueryService }) {
    this.bookmarkQueryService = bookmarkQueryService;
  }

  execute(folderId, options) {
    return this.bookmarkQueryService.getBookmarksByFolder(folderId, options);
  }
}
