export class ExportBookmarksUseCase {
  constructor({ bookmarkService }) {
    this.bookmarkService = bookmarkService;
  }

  execute() {
    return this.bookmarkService.exportToHtml();
  }
}
