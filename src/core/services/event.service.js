import { debugLog } from '../config/debug.logger.js';

const MAX_EVENTS_PER_BOOKMARK = 3;

export class EventService {
  constructor(eventsRepo) {
    this.eventsRepo = eventsRepo;
  }

  #trimEvents(bookmarkId) {
    const removed = this.eventsRepo.pruneOldEvents(bookmarkId, MAX_EVENTS_PER_BOOKMARK);

    if (removed > 0) {
      debugLog(`[EventService] trimmed ${removed} old events for bookmark`, bookmarkId);
    }
  }

  createEvent(bookmarkId, type, payload) {
    const normalizedPayload = {
      oldValue: payload.oldValue ?? null,
      newValue: payload.newValue ?? null,
      url: payload.url,
      timestamp: payload.timestamp ?? Date.now(),
    };

    const event = this.eventsRepo.create({
      bookmarkId,
      type,
      payload: normalizedPayload,
    });

    this.#trimEvents(bookmarkId);

    debugLog('Event created:', type, bookmarkId);
    return event;
  }
  createEvents(bookmarkId, eventDefinitions) {
    return eventDefinitions.map(({ type, payload }) =>
      this.createEvent(bookmarkId, type, payload),
    );
  }

  getEvents(bookmarkId) {
    return this.eventsRepo.getByBookmarkId(bookmarkId);
  }

  getAllEvents() {
    return this.eventsRepo.getAll();
  }
}
