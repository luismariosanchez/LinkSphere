export class CreateBookmarkUseCase {
  constructor({ bookmarkService }) {
    this.bookmarkService = bookmarkService;
  }

  execute(input) {
    return this.bookmarkService.create(input);
  }
}
