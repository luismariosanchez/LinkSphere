import { debugLog } from '../config/debug.logger.js';
import {
  SCHEDULER_DEFAULT_CONCURRENCY,
  SCHEDULER_DEFAULT_INTERVAL_MS,
} from '../../shared/constants/app.js';

async function runWithConcurrency(items, limit, handler) {
  if (items.length === 0) {
    return [];
  }

  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await handler(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker(),
  );

  await Promise.all(workers);
  return results;
}

export class SchedulerService {
  constructor({
    watcherService,
    bookmarksRepo,
    settingsService,
    intervalMs = SCHEDULER_DEFAULT_INTERVAL_MS,
    concurrency = SCHEDULER_DEFAULT_CONCURRENCY,
  }) {
    this.watcherService = watcherService;
    this.bookmarksRepo = bookmarksRepo;
    this.settingsService = settingsService;
    this.intervalMs = intervalMs;
    this.concurrency = concurrency;
    this.timer = null;
    this.running = false;
  }

  start() {
    if (this.timer) {
      return;
    }

    debugLog('Scheduler started');
    void this.#runCycle();

    this.timer = setInterval(() => {
      void this.#runCycle();
    }, this.intervalMs);
  }

  stop() {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
    debugLog('Scheduler stopped');
  }

  setIntervalTime(ms) {
    this.intervalMs = ms;

    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  async #runCycle() {
    if (this.settingsService && !this.settingsService.get('autoRefresh')) {
      return;
    }

    if (this.running) {
      debugLog('[Scheduler] ciclo anterior aún en curso, omitiendo');
      return;
    }

    this.running = true;

    try {
      const bookmarks = this.bookmarksRepo.getAll();
      debugLog(`[Scheduler] revisando ${bookmarks.length} bookmarks`);

      await runWithConcurrency(
        bookmarks,
        this.concurrency,
        async (bookmark) => {
          try {
            return await this.watcherService.watch(bookmark.id);
          } catch (error) {
            debugLog('[Scheduler] error en bookmark', bookmark.url, '→', error.message);
            return null;
          }
        },
      );
    } finally {
      this.running = false;
    }
  }
}
