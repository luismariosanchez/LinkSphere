import { debugLog } from '../../config/debug.logger.js';
import { detectBookmarkEvents } from '../../events/bookmark-change.detector.js';
import { parseBookmarksHtml, serializeBookmarksHtml } from '../../domain/bookmarks/bookmarks-html.js';
import { normalizeUrl } from '../../providers/utils/url.js';
import {
  applyTagIntelligence,
  saveStateSnapshot,
} from './bookmark-intelligence.js';

export class BookmarkService {
  constructor({
    bookmarksRepo,
    tagsRepo,
    folderService,
    eventService,
    tagSuggestionService,
    settingsService,
  }) {
    this.bookmarksRepo = bookmarksRepo;
    this.tagsRepo = tagsRepo;
    this.folderService = folderService;
    this.eventService = eventService;
    this.tagSuggestionService = tagSuggestionService;
    this.settingsService = settingsService;
  }

  persist(payload) {
    const { metadata, ...bookmarkFields } = payload;

    const bookmarkData = {
      url: bookmarkFields.url,
      title: bookmarkFields.title,
      type: bookmarkFields.type,
      thumbnail: bookmarkFields.thumbnail,
      folderId: bookmarkFields.folderId ?? null,
      tagIds: bookmarkFields.tagIds ?? [],
      lastStatus: bookmarkFields.lastStatus,
      isFavorite: Boolean(bookmarkFields.isFavorite),
    };

    debugLog('[BookmarkService] persist:', bookmarkData);

    const saved = this.bookmarksRepo.create(bookmarkData);
    debugLog('[BookmarkService] guardado en DB:', saved);

    saveStateSnapshot(this.bookmarksRepo, saved.id, metadata);

    const eventDefinitions = detectBookmarkEvents({
      before: null,
      metadata,
      url: metadata.url,
      isNew: true,
    });
    const events = this.eventService.createEvents(saved.id, eventDefinitions);
    debugLog('[BookmarkService] events en persist:', events.map((event) => event.type));

    return saved;
  }

  getAll() {
    return this.bookmarksRepo.getAll();
  }

  getById(id) {
    return this.bookmarksRepo.getById(id);
  }

  getWithState(id) {
    return this.#attachNotes(this.bookmarksRepo.getWithState(id));
  }

  #attachNotes(bookmark) {
    if (!bookmark) {
      return null;
    }

    const notes = bookmark.state?.data?.userNotes ?? '';

    return {
      ...bookmark,
      notes,
    };
  }

  update(id, input) {
    const { notes, tagIds, ...bookmarkFields } = input;
    const existing = this.bookmarksRepo.getById(id);

    if (!existing) {
      return null;
    }

    if (tagIds === undefined) {
      const withState = this.bookmarksRepo.getWithState(id);
      const metadata = {
        type: bookmarkFields.type ?? existing.type,
        extra: withState?.state?.data ?? {},
        lastStatus: bookmarkFields.lastStatus ?? existing.lastStatus,
      };

      bookmarkFields.tagIds = applyTagIntelligence({
        tagSuggestionService: this.tagSuggestionService,
        tagsRepo: this.tagsRepo,
        settingsService: this.settingsService,
        tagIds: existing.tagIds,
        metadata,
        url: bookmarkFields.url ?? existing.url,
        title: bookmarkFields.title ?? existing.title,
        applySuggested: true,
      });
    } else {
      bookmarkFields.tagIds = tagIds;
    }

    const updated = this.bookmarksRepo.update(id, bookmarkFields);

    if (!updated) {
      return null;
    }

    if (notes !== undefined) {
      const current = this.bookmarksRepo.getWithState(id);
      const currentData = current?.state?.data ?? {};

      this.bookmarksRepo.updateState(id, {
        data: { ...currentData, userNotes: notes },
        hash: current?.state?.hash ?? '',
      });
    }

    return this.getWithState(id);
  }

  delete(id) {
    return this.bookmarksRepo.delete(id);
  }

  exportToHtml() {
    const bookmarks = this.bookmarksRepo.getAll();
    const folders = this.folderService.getFolders();
    return serializeBookmarksHtml(bookmarks, folders);
  }
}
