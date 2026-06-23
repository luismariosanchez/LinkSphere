import { createHash } from 'node:crypto';
import { debugLog } from '../config/debug.logger.js';
import { nowIso } from '../database/utils.js';
import { extractStreamStatus, resolveBookmarkStatus } from '../providers/utils/stream-status.js';
import { detectBookmarkEvents } from '../services/bookmark-change.detector.js';

function computeStateHash(data) {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

export class WatcherService {
  constructor({
    bookmarksRepo,
    tagsRepo,
    eventService,
    providerManager,
    tagSuggestionService,
    settingsService,
  }) {
    this.bookmarksRepo = bookmarksRepo;
    this.tagsRepo = tagsRepo;
    this.eventService = eventService;
    this.providerManager = providerManager;
    this.tagSuggestionService = tagSuggestionService;
    this.settingsService = settingsService;
  }

  #buildStateData(metadata) {
    const extra = metadata.extra ?? {};

    return {
      ...extra,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      type: metadata.type,
      updatedAt: nowIso(),
    };
  }

  async watch(bookmarkId) {
    const existing = this.bookmarksRepo.getWithState(bookmarkId);
    if (!existing) {
      return null;
    }

    debugLog('Checking bookmark:', existing.url);

    const metadata = await this.providerManager.resolveMetadata(existing.url);
    const streamStatus = extractStreamStatus(metadata);
    const prevStreamStatus = existing.state?.data?.isStream
      ? (existing.state.data.streamStatus ?? null)
      : null;

    debugLog('Provider streamStatus:', streamStatus);
    debugLog('Previous streamStatus:', prevStreamStatus);
    debugLog('New streamStatus:', streamStatus);
    debugLog('Live state changed:', prevStreamStatus !== streamStatus);

    const eventDefinitions = detectBookmarkEvents({
      before: existing,
      metadata,
      url: existing.url,
      isNew: false,
    });

    const lastStatus = resolveBookmarkStatus(metadata);
    const stateData = this.#buildStateData(metadata);
    const userNotes = existing.state?.data?.userNotes;

    if (userNotes !== undefined && userNotes !== '') {
      stateData.userNotes = userNotes;
    }

    let tagIds = existing.tagIds;

    if (this.settingsService.get('autoTagging')) {
      const suggestion = this.tagSuggestionService.suggest({
        metadata,
        url: existing.url,
        title: metadata.title,
      });
      tagIds = this.tagSuggestionService.mergeTagIds(
        existing.tagIds,
        suggestion.autoTags,
        this.tagsRepo,
      );
    }
    let events = [];

    if (eventDefinitions.length > 0) {
      const changes = eventDefinitions.map((event) => event.type);
      debugLog('Changes detected:', changes);
      events = this.eventService.createEvents(bookmarkId, eventDefinitions);
      for (const event of events) {
        debugLog('Event created:', event.type);
      }
    }

    this.bookmarksRepo.update(bookmarkId, {
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      type: metadata.type,
      lastChecked: nowIso(),
      lastStatus,
      tagIds,
    });

    this.bookmarksRepo.updateState(bookmarkId, {
      data: stateData,
      hash: computeStateHash(stateData),
    });

    return {
      bookmark: this.bookmarksRepo.getWithState(bookmarkId),
      events,
    };
  }
}
