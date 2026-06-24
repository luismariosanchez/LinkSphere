export class ImportBookmarksUseCase {
  constructor({ bookmarkService }) {
    this.bookmarkService = bookmarkService;
  }

  execute(html, options) {
    return this.bookmarkService.importFromHtml(html, options);
  }
}
