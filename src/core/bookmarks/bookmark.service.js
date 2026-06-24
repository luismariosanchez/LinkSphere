import { debugLog } from '../config/debug.logger.js';
import { nowIso } from '../database/utils.js';
import { resolveBookmarkStatus } from '../providers/utils/stream-status.js';
import { normalizeUrl } from '../providers/utils/url.js';
import { detectBookmarkEvents } from '../services/bookmark-change.detector.js';
import { parseBookmarksHtml, serializeBookmarksHtml } from './bookmarks-html.js';

export class BookmarkService {
  constructor({
    bookmarksRepo,
    tagsRepo,
    folderService,
    eventService,
    providerManager,
    watcherService,
    tagSuggestionService,
    settingsService,
  }) {
    this.bookmarksRepo = bookmarksRepo;
    this.tagsRepo = tagsRepo;
    this.folderService = folderService;
    this.eventService = eventService;
    this.providerManager = providerManager;
    this.watcherService = watcherService;
    this.tagSuggestionService = tagSuggestionService;
    this.settingsService = settingsService;
  }

  #applyTagIntelligence({ tagIds, metadata, url, title, applySuggested = false }) {
    if (!this.settingsService.get('autoTagging')) {
      return tagIds ?? [];
    }
    const suggestion = this.tagSuggestionService.suggest({ metadata, url, title });
    const tagNames = [...suggestion.autoTags];

    if (applySuggested) {
      tagNames.push(...suggestion.suggestedTags);
    }

    return this.tagSuggestionService.mergeTagIds(tagIds ?? [], tagNames, this.tagsRepo);
  }

  #resolveTagNames(tagIds) {
    return (tagIds ?? [])
      .map((id) => this.tagsRepo.getById(id)?.name)
      .filter(Boolean);
  }

  #resolveFolderId(input, metadata, tagIds) {
    if (input.folderId) {
      return input.folderId;
    }

    return this.folderService.resolveSuggestedFolderId({
      metadata,
      tagNames: this.#resolveTagNames(tagIds),
      url: metadata.url,
      title: metadata.title,
    });
  }

  #saveStateSnapshot(bookmarkId, metadata) {
    const extra = metadata.extra ?? {};

    this.bookmarksRepo.updateState(bookmarkId, {
      data: {
        ...extra,
        title: metadata.title,
        thumbnail: metadata.thumbnail,
        type: metadata.type,
        updatedAt: nowIso(),
      },
    });
  }

  async create(input) {
    const url = input.url?.trim();

    if (!url) {
      throw new Error('La URL es obligatoria');
    }

    debugLog('[BookmarkService] URL recibida:', url);

    const metadata = await this.providerManager.resolveMetadata(url);
    debugLog('[BookmarkService] metadata devuelta:', metadata);
    debugLog('Provider streamStatus:', metadata.extra?.streamStatus ?? null);

    const lastStatus = resolveBookmarkStatus(metadata);

    const tagIds = this.#applyTagIntelligence({
      tagIds: input.tagIds ?? [],
      metadata,
      url: metadata.url,
      title: metadata.title,
      applySuggested: true,
    });

    const folderId = this.#resolveFolderId(input, metadata, tagIds);

    const bookmarkData = {
      url: metadata.url,
      title: metadata.title,
      type: metadata.type,
      thumbnail: metadata.thumbnail,
      folderId,
      tagIds,
      lastStatus,
    };

    debugLog('[BookmarkService] datos a guardar:', bookmarkData);

    const saved = this.bookmarksRepo.create(bookmarkData);
    debugLog('[BookmarkService] datos guardados en DB:', saved);

    this.#saveStateSnapshot(saved.id, metadata);

    const eventDefinitions = detectBookmarkEvents({
      before: null,
      metadata,
      url: metadata.url,
      isNew: true,
    });
    const events = this.eventService.createEvents(saved.id, eventDefinitions);
    debugLog('[BookmarkService] events en create:', events.map((e) => e.type));

    return saved;
  }

  async rescan(id) {
    debugLog('[BookmarkService] re-scan manual:', id);
    return this.watcherService.watch(id);
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

      bookmarkFields.tagIds = this.#applyTagIntelligence({
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

  recordOpen(bookmarkId) {
    const updated = this.bookmarksRepo.recordOpen(bookmarkId);
    debugLog('[BookmarkService] open tracked:', bookmarkId, updated?.openCount);
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

  getRecentBookmarks(limit = 10) {
    return this.bookmarksRepo.getRecentBookmarks(limit);
  }

  queryBookmarks(filters = {}) {
    const normalized = {
      search: typeof filters.search === 'string' ? filters.search.trim() : undefined,
      folderId: filters.folderId,
      tagId: filters.tagId || undefined,
      type: filters.type,
      favorite: filters.favorite === true ? true : undefined,
      pinnedFolder: filters.pinnedFolder === true ? true : undefined,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      offset: Number.isFinite(filters.offset) ? filters.offset : 0,
      limit: Number.isFinite(filters.limit) ? filters.limit : undefined,
    };

    if (!normalized.search) {
      delete normalized.search;
    }

    return this.bookmarksRepo.queryBookmarks(normalized);
  }

  getBookmarksByFolder(folderId, options = {}) {
    if (!folderId) {
      throw new Error('folderId es obligatorio');
    }

    return this.queryBookmarks({
      folderId,
      search: options.search,
      sortBy: options.sortBy ?? 'title',
      sortDir: options.sortDir ?? 'asc',
      offset: options.offset ?? 0,
      limit: options.limit ?? 50,
    });
  }

  getFavoriteBookmarks() {
    return this.bookmarksRepo.getFavoriteBookmarks();
  }

  #resolveFolderName(folderId) {
    if (!folderId) {
      return null;
    }

    return this.folderService.getFolders().find((folder) => folder.id === folderId)?.name ?? null;
  }

  getLatestEvents(limit = 20) {
    return this.eventService.getLatestEvents(limit)
      .map((event) => {
        const bookmark = this.bookmarksRepo.getById(event.bookmarkId);

        if (!bookmark) {
          return null;
        }

        return {
          event,
          bookmark,
          folderName: this.#resolveFolderName(bookmark.folderId),
        };
      })
      .filter(Boolean);
  }

  exportToHtml() {
    const bookmarks = this.bookmarksRepo.getAll();
    const folders = this.folderService.getFolders();
    return serializeBookmarksHtml(bookmarks, folders);
  }

  #resolveFolderPath(folderPath) {
    let parentId = null;
    let folderId = null;

    for (const name of folderPath) {
      const trimmed = name.trim();
      if (!trimmed) {
        continue;
      }

      const folders = this.folderService.getFolders();
      const existing = folders.find(
        (folder) => folder.name.toLowerCase() === trimmed.toLowerCase()
          && (folder.parentId ?? null) === parentId,
      );

      if (existing) {
        folderId = existing.id;
      } else {
        const created = this.folderService.createFolder({ name: trimmed, parentId });
        folderId = created.id;
      }

      parentId = folderId;
    }

    return folderId;
  }

  async importFromHtml(html, { onProgress } = {}) {
    const entries = parseBookmarksHtml(html);
    const existingUrls = new Set(
      this.bookmarksRepo.getAll().map((bookmark) => normalizeUrl(bookmark.url)),
    );

    const result = {
      total: entries.length,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    debugLog('[BookmarkService] import entries:', entries.length);
    onProgress?.({ phase: 'start', total: entries.length, current: 0 });

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      let normalizedUrl;

      try {
        normalizedUrl = normalizeUrl(entry.url);
      } catch {
        result.errors.push({ url: entry.url, message: 'URL inválida' });
        onProgress?.({
          phase: 'progress',
          total: entries.length,
          current: index + 1,
          imported: result.imported,
          skipped: result.skipped,
        });
        continue;
      }

      if (existingUrls.has(normalizedUrl)) {
        result.skipped += 1;
        onProgress?.({
          phase: 'progress',
          total: entries.length,
          current: index + 1,
          imported: result.imported,
          skipped: result.skipped,
        });
        continue;
      }

      try {
        const effectivePath = entry.folderPath ?? [];
        const folderId = effectivePath.length
          ? this.#resolveFolderPath(effectivePath)
          : null;

        await this.create({ url: normalizedUrl, folderId });
        existingUrls.add(normalizedUrl);
        result.imported += 1;
      } catch (err) {
        result.errors.push({
          url: entry.url,
          message: err?.message ?? 'Error al importar',
        });
      }

      onProgress?.({
        phase: 'progress',
        total: entries.length,
        current: index + 1,
        imported: result.imported,
        skipped: result.skipped,
      });
    }

    debugLog('[BookmarkService] import result:', result);
    onProgress?.({ phase: 'done', ...result });

    return result;
  }
}
