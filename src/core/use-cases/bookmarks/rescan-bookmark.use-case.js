export class RescanBookmarkUseCase {
  constructor({ bookmarkInteractionService }) {
    this.bookmarkInteractionService = bookmarkInteractionService;
  }

  execute(id) {
    return this.bookmarkInteractionService.rescan(id);
  }
}
