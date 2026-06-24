export class RecordBookmarkOpenUseCase {
  constructor({ bookmarkInteractionService }) {
    this.bookmarkInteractionService = bookmarkInteractionService;
  }

  executeByUrl(url) {
    return this.bookmarkInteractionService.recordOpenByUrl(url);
  }
}
