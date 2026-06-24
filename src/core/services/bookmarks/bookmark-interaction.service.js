import { debugLog } from '../../config/debug.logger.js';
import { normalizeUrl } from '../../providers/utils/url.js';

export class BookmarkInteractionService {
  constructor({ bookmarksRepo, watcherService }) {
    this.bookmarksRepo = bookmarksRepo;
    this.watcherService = watcherService;
  }

  async rescan(id) {
    debugLog('[BookmarkInteractionService] re-scan manual:', id);
    return this.watcherService.watch(id);
  }

  recordOpen(bookmarkId) {
    const updated = this.bookmarksRepo.recordOpen(bookmarkId);
    debugLog('[BookmarkInteractionService] open tracked:', bookmarkId, updated?.openCount);
    return updated;
  }

  #resolveBookmarkByUrl(url) {
    if (!url) {
      return null;
    }

    const direct = this.bookmarksRepo.getByUrl(url);

    if (direct) {
      return direct;
    }

    try {
      return this.bookmarksRepo.getByUrl(normalizeUrl(url));
    } catch {
      return null;
    }
  }

  recordOpenByUrl(url) {
    const bookmark = this.#resolveBookmarkByUrl(url);

    if (!bookmark) {
      return null;
    }

    return this.recordOpen(bookmark.id);
  }
}
