import path from 'node:path';
import { app } from 'electron';
import {
  BookmarkInteractionService,
  BookmarkQueryService,
  BookmarkService,
} from '../../core/services/bookmarks/index.js';
import { createBookmarkUseCases } from '../../core/use-cases/bookmarks/index.js';
import { GetDashboardDataUseCase } from '../../core/use-cases/dashboard/get-dashboard-data.use-case.js';
import { GetFoldersViewDataUseCase } from '../../core/use-cases/folders/get-folders-view-data.use-case.js';
import { GetFoldersUseCase } from '../../core/use-cases/folders/get-folders.use-case.js';
import { DashboardService } from '../../core/services/dashboard/dashboard.service.js';
import { FoldersViewService } from '../../core/services/folders/folders-view.service.js';
import { initDebugLogger, SettingsService } from '../../core/config/index.js';
import {
  closeDatabase,
  createRepositories,
  getDatabase,
  wipeAllData,
} from '../../core/database/index.js';
import {
  bootstrapDefaultProcessors,
  FolderProcessor,
  ProcessorRulesService,
  ProcessorsRegistry,
  TagProcessor,
} from '../../core/processors/index.js';
import { ProviderManager } from '../../core/providers/provider-manager.js';
import { SchedulerService } from '../../core/scheduler/scheduler.service.js';
import { WatcherService } from '../../core/scheduler/watcher.service.js';
import { EventService } from '../../core/events/index.js';
import { TagSuggestionService } from '../../core/tags/index.js';
import { FolderService } from '../../core/folders/index.js';
import { OrganizationSuggestionService } from '../../core/suggestions/index.js';
import { FolderSuggestionService } from '../../core/folders/folder-suggestion.service.js';

let repositories = null;
let eventService = null;
let watcherService = null;
let bookmarkCrudService = null;
let bookmarkQueryService = null;
let bookmarkInteractionService = null;
let bookmarkUseCases = null;
let dashboardService = null;
let foldersViewService = null;
let dashboardUseCase = null;
let foldersViewUseCase = null;
let foldersUseCase = null;
let schedulerService = null;
let tagSuggestionService = null;
let folderService = null;
let folderSuggestionService = null;
let tagProcessor = null;
let folderProcessor = null;
let processorsRegistry = null;
let organizationSuggestionService = null;
let rulesService = null;
let settingsService = null;

function getProcessorsDir() {
  return path.join(app.getPath('userData'), 'processors');
}

function getLegacyRulesDir() {
  return path.join(app.getPath('userData'), 'rules');
}

function reloadProcessors() {
  tagProcessor?.reloadRules();
  folderProcessor?.reloadRules();
  organizationSuggestionService = null;
}

function applySettingsSideEffects(settings) {
  processorsRegistry?.setEnabledResolver(
    () => getSettingsService().get('enabledProcessors'),
  );
  organizationSuggestionService = null;

  if (!schedulerService) {
    return;
  }

  schedulerService.setIntervalTime(settings.schedulerInterval);

  if (settings.autoRefresh) {
    schedulerService.start();
  } else {
    schedulerService.stop();
  }
}

export function getTagProcessor() {
  if (tagProcessor) {
    return tagProcessor;
  }

  tagProcessor = new TagProcessor({
    getPersistPath: () => path.join(getProcessorsDir(), 'tag.rules.json'),
    legacyPersistPath: path.join(getLegacyRulesDir(), 'tag.rules.json'),
  });

  return tagProcessor;
}

export function getFolderProcessor() {
  if (folderProcessor) {
    return folderProcessor;
  }

  folderProcessor = new FolderProcessor({
    getPersistPath: () => path.join(getProcessorsDir(), 'folder.rules.json'),
    legacyPersistPath: path.join(getLegacyRulesDir(), 'folder.rules.json'),
  });

  return folderProcessor;
}

export function getProcessorsRegistry() {
  if (processorsRegistry) {
    return processorsRegistry;
  }

  processorsRegistry = new ProcessorsRegistry({
    getEnabledProcessors: () => getSettingsService().get('enabledProcessors'),
  });

  bootstrapDefaultProcessors(processorsRegistry, {
    tagProcessor: getTagProcessor(),
    folderProcessor: getFolderProcessor(),
  });

  return processorsRegistry;
}

export function getRulesService() {
  if (rulesService) {
    return rulesService;
  }

  rulesService = new ProcessorRulesService({
    tagProcessor: getTagProcessor(),
    folderProcessor: getFolderProcessor(),
    onChange: reloadProcessors,
  });

  return rulesService;
}

export function getSettingsService() {
  if (settingsService) {
    return settingsService;
  }

  settingsService = new SettingsService({
    getFilePath: () => path.join(app.getPath('userData'), 'settings.json'),
    onChange: applySettingsSideEffects,
  });

  initDebugLogger(settingsService);

  return settingsService;
}

export function getFolderService() {
  if (folderService) {
    return folderService;
  }

  const repos = getRepositories();
  folderService = new FolderService({
    foldersRepo: repos.folders,
    folderSuggestionService: getFolderSuggestionService(),
  });

  return folderService;
}

export function getFolderSuggestionService() {
  if (folderSuggestionService) {
    return folderSuggestionService;
  }

  folderSuggestionService = new FolderSuggestionService({
    folderProcessor: getFolderProcessor(),
  });

  return folderSuggestionService;
}

export function getOrganizationSuggestionService() {
  if (organizationSuggestionService) {
    return organizationSuggestionService;
  }

  organizationSuggestionService = new OrganizationSuggestionService({
    registry: getProcessorsRegistry(),
  });

  return organizationSuggestionService;
}

export function getTagSuggestionService() {
  if (tagSuggestionService) {
    return tagSuggestionService;
  }

  tagSuggestionService = new TagSuggestionService({
    tagProcessor: getTagProcessor(),
  });
  return tagSuggestionService;
}

export function getRepositories() {
  if (repositories) {
    return repositories;
  }

  const dbPath = path.join(app.getPath('userData'), 'marcadores.db');
  const db = getDatabase(dbPath);
  repositories = createRepositories(db);

  return repositories;
}

export function wipeApplicationData() {
  const dbPath = path.join(app.getPath('userData'), 'marcadores.db');
  const db = getDatabase(dbPath);
  wipeAllData(db);
  return { success: true };
}

export function getEventService() {
  if (eventService) {
    return eventService;
  }

  const repos = getRepositories();
  eventService = new EventService(repos.events);

  return eventService;
}

export function getWatcherService() {
  if (watcherService) {
    return watcherService;
  }

  const repos = getRepositories();
  watcherService = new WatcherService({
    bookmarksRepo: repos.bookmarks,
    tagsRepo: repos.tags,
    eventService: getEventService(),
    providerManager: new ProviderManager(),
    tagSuggestionService: getTagSuggestionService(),
    settingsService: getSettingsService(),
  });

  return watcherService;
}

function getBookmarkServiceDeps() {
  const repos = getRepositories();

  return {
    bookmarksRepo: repos.bookmarks,
    tagsRepo: repos.tags,
    folderService: getFolderService(),
    eventService: getEventService(),
    providerManager: new ProviderManager(),
    tagSuggestionService: getTagSuggestionService(),
    settingsService: getSettingsService(),
  };
}

export function getBookmarkCrudService() {
  if (bookmarkCrudService) {
    return bookmarkCrudService;
  }

  bookmarkCrudService = new BookmarkService(getBookmarkServiceDeps());
  return bookmarkCrudService;
}

export function getBookmarkQueryService() {
  if (bookmarkQueryService) {
    return bookmarkQueryService;
  }

  const repos = getRepositories();
  bookmarkQueryService = new BookmarkQueryService({
    bookmarksRepo: repos.bookmarks,
    folderService: getFolderService(),
    eventService: getEventService(),
  });

  return bookmarkQueryService;
}

export function getBookmarkInteractionService() {
  if (bookmarkInteractionService) {
    return bookmarkInteractionService;
  }

  const repos = getRepositories();
  bookmarkInteractionService = new BookmarkInteractionService({
    bookmarksRepo: repos.bookmarks,
    watcherService: getWatcherService(),
  });

  return bookmarkInteractionService;
}

/** @deprecated Use getBookmarkCrudService, getBookmarkQueryService or getBookmarkInteractionService */
export function getBookmarkService() {
  return getBookmarkCrudService();
}

export function getBookmarkUseCases() {
  if (bookmarkUseCases) {
    return bookmarkUseCases;
  }

  bookmarkUseCases = createBookmarkUseCases({
    bookmarkService: getBookmarkCrudService(),
    bookmarkQueryService: getBookmarkQueryService(),
    bookmarkInteractionService: getBookmarkInteractionService(),
  });

  return bookmarkUseCases;
}

export function getDashboardService() {
  if (dashboardService) {
    return dashboardService;
  }

  const repos = getRepositories();
  dashboardService = new DashboardService({
    bookmarkCrudService: getBookmarkCrudService(),
    bookmarkQueryService: getBookmarkQueryService(),
    folderService: getFolderService(),
    tagsRepo: repos.tags,
    getLatestEvents: (limit) => getBookmarkUseCases().getLatestEvents.execute(limit),
  });

  return dashboardService;
}

export function getFoldersViewService() {
  if (foldersViewService) {
    return foldersViewService;
  }

  const repos = getRepositories();
  foldersViewService = new FoldersViewService({
    folderService: getFolderService(),
    bookmarkQueryService: getBookmarkQueryService(),
    tagsRepo: repos.tags,
  });

  return foldersViewService;
}

export function getDashboardUseCase() {
  if (dashboardUseCase) {
    return dashboardUseCase;
  }

  dashboardUseCase = new GetDashboardDataUseCase({
    dashboardService: getDashboardService(),
  });

  return dashboardUseCase;
}

export function getFoldersViewUseCase() {
  if (foldersViewUseCase) {
    return foldersViewUseCase;
  }

  foldersViewUseCase = new GetFoldersViewDataUseCase({
    foldersViewService: getFoldersViewService(),
  });

  return foldersViewUseCase;
}

export function getFoldersUseCase() {
  if (foldersUseCase) {
    return foldersUseCase;
  }

  foldersUseCase = new GetFoldersUseCase({
    folderService: getFolderService(),
  });

  return foldersUseCase;
}

export function getSchedulerService() {
  if (schedulerService) {
    return schedulerService;
  }

  const repos = getRepositories();
  const settings = getSettingsService().getAll();

  schedulerService = new SchedulerService({
    watcherService: getWatcherService(),
    bookmarksRepo: repos.bookmarks,
    settingsService: getSettingsService(),
    intervalMs: settings.schedulerInterval,
  });

  return schedulerService;
}

export function shutdownScheduler() {
  if (schedulerService) {
    schedulerService.stop();
    schedulerService = null;
  }
}

export function shutdownDatabase() {
  shutdownScheduler();
  closeDatabase();
  repositories = null;
  eventService = null;
  watcherService = null;
  bookmarkCrudService = null;
  bookmarkQueryService = null;
  bookmarkInteractionService = null;
  bookmarkUseCases = null;
  dashboardService = null;
  foldersViewService = null;
  dashboardUseCase = null;
  foldersViewUseCase = null;
  foldersUseCase = null;
  tagSuggestionService = null;
  folderService = null;
  folderSuggestionService = null;
  tagProcessor = null;
  folderProcessor = null;
  processorsRegistry = null;
  organizationSuggestionService = null;
  rulesService = null;
  settingsService = null;
}
