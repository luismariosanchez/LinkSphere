import { debugLog } from '../config/debug.logger.js';

const MAX_EVENTS_PER_BOOKMARK = 3;

function normalizePayload(payload = {}) {
  return {
    ...payload,
    oldValue: payload.oldValue ?? null,
    newValue: payload.newValue ?? null,
    url: payload.url ?? null,
    timestamp: payload.timestamp ?? Date.now(),
  };
}

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

  createEvent(bookmarkId, type, payload = {}, options = {}) {
    const event = this.eventsRepo.create({
      bookmarkId,
      type,
      title: options.title ?? null,
      payload: normalizePayload(payload),
    });

    this.#trimEvents(bookmarkId);

    debugLog('Event created:', type, bookmarkId);
    return event;
  }

  createActivityEvent({ bookmarkId, type, title, payload = {} }) {
    return this.createEvent(bookmarkId, type, payload, { title });
  }

  createEvents(bookmarkId, eventDefinitions) {
    return eventDefinitions.map(({ type, payload, title }) =>
      this.createEvent(bookmarkId, type, payload, { title }),
    );
  }

  getEvents(bookmarkId) {
    return this.eventsRepo.getByBookmarkId(bookmarkId);
  }

  getAllEvents() {
    return this.eventsRepo.getAll();
  }

  getLatestEvents(limit = 20) {
    return this.eventsRepo.getLatest(limit);
  }

  getLatestEventsByTypes(types, limit = 20) {
    return this.eventsRepo.getLatestByTypes(types, limit);
  }
}
