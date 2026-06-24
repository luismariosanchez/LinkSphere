export class UpdateBookmarkUseCase {
  constructor({ bookmarkService }) {
    this.bookmarkService = bookmarkService;
  }

  execute(id, input) {
    return this.bookmarkService.update(id, input);
  }
}
