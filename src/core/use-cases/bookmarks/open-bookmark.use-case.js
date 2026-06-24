export class OpenBookmarkUseCase {
  constructor({ bookmarkInteractionService }) {
    this.bookmarkInteractionService = bookmarkInteractionService;
  }

  execute({ url, bookmarkId }) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL inválida');
    }

    const bookmark = bookmarkId
      ? this.bookmarkInteractionService.recordOpen(bookmarkId)
      : this.bookmarkInteractionService.recordOpenByUrl(url);

    return { bookmark };
  }
}
