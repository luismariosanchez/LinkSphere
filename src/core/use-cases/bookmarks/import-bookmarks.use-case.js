import { debugLog } from '../../config/debug.logger.js';
import { parseBookmarksHtml } from '../../domain/bookmarks/bookmarks-html.js';
import { normalizeUrl } from '../../providers/utils/url.js';

export class ImportBookmarksUseCase {
  constructor({ createBookmarkUseCase, bookmarksRepo, folderService }) {
    this.createBookmarkUseCase = createBookmarkUseCase;
    this.bookmarksRepo = bookmarksRepo;
    this.folderService = folderService;
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

  async execute(html, { onProgress } = {}) {
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

    debugLog('[ImportBookmarksUseCase] entries:', entries.length);
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

        await this.createBookmarkUseCase.execute({ url: normalizedUrl, folderId });
        existingUrls.add(normalizedUrl);
        result.imported += 1;
      } catch (err) {
        if (err?.message === 'Ya existe un bookmark con esta URL') {
          result.skipped += 1;
        } else {
          result.errors.push({
            url: entry.url,
            message: err?.message ?? 'Error al importar',
          });
        }
      }

      onProgress?.({
        phase: 'progress',
        total: entries.length,
        current: index + 1,
        imported: result.imported,
        skipped: result.skipped,
      });
    }

    debugLog('[ImportBookmarksUseCase] result:', result);
    onProgress?.({ phase: 'done', ...result });

    return result;
  }
}
