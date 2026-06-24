import { debugLog } from '../config/debug.logger.js';
import { ProcessorPipeline } from '../processors/index.js';
import { resolveBookmarkStatus } from '../providers/utils/stream-status.js';
import { validateUrl } from '../providers/utils/url.js';
import { resolveTagNames } from '../services/bookmarks/bookmark-intelligence.js';

export class IngestionService {
  constructor({
    bookmarksRepo,
    providerManager,
    tagsRepo,
    folderService,
    tagSuggestionService,
    settingsService,
    processorsRegistry,
  }) {
    this.bookmarksRepo = bookmarksRepo;
    this.providerManager = providerManager;
    this.tagsRepo = tagsRepo;
    this.folderService = folderService;
    this.tagSuggestionService = tagSuggestionService;
    this.settingsService = settingsService;
    this.pipeline = new ProcessorPipeline({ registry: processorsRegistry });
  }

  #assertNotDuplicate(url) {
    const existing = this.bookmarksRepo.getByUrl(url);

    if (existing) {
      throw new Error('Ya existe un bookmark con esta URL');
    }
  }

  #runPipeline({ metadata, url, title, tagNames }) {
    return this.pipeline.run({
      url,
      title,
      tagNames,
      metadata: {
        type: metadata.type,
        extra: metadata.extra ?? {},
        lastStatus: resolveBookmarkStatus(metadata),
      },
    });
  }

  #resolveTagIds(manualTagIds, pipelineResult) {
    if (!this.settingsService.get('autoTagging')) {
      return manualTagIds;
    }

    const pipelineTags = pipelineResult?.tags ?? [];

    if (!pipelineTags.length) {
      return manualTagIds;
    }

    return this.tagSuggestionService.mergeTagIds(manualTagIds, pipelineTags, this.tagsRepo);
  }

  #resolveFolderId(manualFolderId, pipelineResult) {
    if (manualFolderId) {
      return manualFolderId;
    }

    const suggestedFolder = pipelineResult?.folder ?? pipelineResult?.folders?.[0] ?? null;

    if (!suggestedFolder) {
      return null;
    }

    return this.folderService.resolveFolderIdByName(suggestedFolder);
  }

  async previewMetadata(urlInput) {
    const url = validateUrl(urlInput);
    return this.providerManager.resolveMetadata(url);
  }

  async ingest(input = {}) {
    const url = validateUrl(input.url);
    debugLog('[IngestionService] URL normalizada:', url);

    this.#assertNotDuplicate(url);

    const metadata = await this.providerManager.resolveMetadata(url);
    debugLog('[IngestionService] metadata:', metadata);

    const title = input.title?.trim() || metadata.title;
    const manualTagIds = input.tagIds ?? [];
    const manualTagNames = resolveTagNames(this.tagsRepo, manualTagIds);
    const pipelineResult = this.#runPipeline({
      metadata,
      url: metadata.url,
      title,
      tagNames: manualTagNames,
    });

    const tagIds = this.#resolveTagIds(manualTagIds, pipelineResult);
    const folderId = this.#resolveFolderId(input.folderId ?? null, pipelineResult);
    const lastStatus = resolveBookmarkStatus(metadata);

    const enrichedMetadata = {
      ...metadata,
      extra: {
        ...(metadata.extra ?? {}),
        ...(pipelineResult.metadata ?? {}),
      },
    };

    return {
      url: metadata.url,
      title,
      type: metadata.type,
      thumbnail: metadata.thumbnail,
      folderId,
      tagIds,
      lastStatus,
      isFavorite: Boolean(input.isFavorite),
      metadata: enrichedMetadata,
    };
  }
}
