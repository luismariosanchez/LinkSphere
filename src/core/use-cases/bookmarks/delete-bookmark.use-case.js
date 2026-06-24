export class DeleteBookmarkUseCase {
  constructor({ bookmarkService }) {
    this.bookmarkService = bookmarkService;
  }

  execute(id) {
    return this.bookmarkService.delete(id);
  }
}
