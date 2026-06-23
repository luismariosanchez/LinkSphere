import { debugLog } from '../config/debug.logger.js';
import { normalizeUrl } from '../providers/utils/url.js';
import { EVENT_TYPES } from '../../shared/constants/events.js';
import { validateIngestionInput } from './ingestion.validator.js';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export class IngestionService {
  constructor({
    bookmarkService,
    organizationSuggestionService,
    providerManager,
    tagsRepo,
    foldersRepo,
    eventService,
  } = {}) {
    this.bookmarkService = bookmarkService;
    this.organizationSuggestionService = organizationSuggestionService;
    this.providerManager = providerManager;
    this.tagsRepo = tagsRepo;
    this.foldersRepo = foldersRepo;
    this.eventService = eventService;
  }

  #resolveTagIds(tagNames) {
    return unique(tagNames).map((name) => this.tagsRepo.findOrCreateByName(name).id);
  }

  #resolveFolderId(folderName, suggestedFolders) {
    if (folderName) {
      return this.foldersRepo.findOrCreateByName(folderName).id;
    }

    const suggested = suggestedFolders?.[0];
    if (!suggested) {
      return null;
    }

    return this.foldersRepo.findOrCreateByName(suggested).id;
  }

  async ingest(rawInput) {
    const input = validateIngestionInput(rawInput);
    const url = normalizeUrl(input.url);

    debugLog('[IngestionService] ingest:', input);

    const metadata = await this.providerManager.resolveMetadata(url);

    if (input.title) {
      metadata.title = input.title;
    }

    const suggestions = this.organizationSuggestionService.suggest({
      url: metadata.url,
      title: metadata.title,
      metadata,
      tagNames: input.tags,
    });

    const tagNames = unique([...input.tags, ...suggestions.suggestedTags]);
    const tagIds = this.#resolveTagIds(tagNames);
    const folderId = this.#resolveFolderId(input.folder, suggestions.suggestedFolders);

    const saved = await this.bookmarkService.create({
      url: metadata.url,
      metadata,
      title: metadata.title,
      tagIds,
      folderId,
      suggestionsApplied: true,
    });

    this.eventService.createEvent(saved.id, EVENT_TYPES.BOOKMARK_CREATED, {
      url: metadata.url,
      source: input.source,
      newValue: saved.id,
      oldValue: null,
    });

    debugLog('[IngestionService] bookmark creado:', saved.id, 'source:', input.source);

    return saved;
  }
}
