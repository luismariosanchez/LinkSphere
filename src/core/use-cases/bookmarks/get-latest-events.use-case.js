export class GetLatestBookmarkEventsUseCase {
  constructor({ bookmarkQueryService }) {
    this.bookmarkQueryService = bookmarkQueryService;
  }

  execute(limit) {
    return this.bookmarkQueryService.getLatestEvents(limit);
  }
}
