export class CreateBookmarkUseCase {
  constructor({ ingestionService, bookmarkService }) {
    this.ingestionService = ingestionService;
    this.bookmarkService = bookmarkService;
  }

  async execute(input) {
    const payload = await this.ingestionService.ingest(input);
    return this.bookmarkService.persist(payload);
  }
}
