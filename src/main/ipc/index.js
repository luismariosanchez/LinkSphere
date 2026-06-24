import { registerAppIpcHandlers } from './app.ipc.js';
import { registerBookmarksIpcHandlers } from './bookmarks.ipc.js';
import { registerDashboardIpcHandlers } from './dashboard.ipc.js';
import { registerEventsIpcHandlers } from './events.ipc.js';
import { registerFoldersIpcHandlers } from './folders.ipc.js';
import { registerQuickAddIpcHandlers } from './quick-add.ipc.js';
import { registerRulesIpcHandlers } from './rules.ipc.js';
import { registerSettingsIpcHandlers } from './settings.ipc.js';
import { registerSuggestionsIpcHandlers } from './suggestions.ipc.js';
import { registerTagsIpcHandlers } from './tags.ipc.js';

export function registerIpcHandlers() {
  registerAppIpcHandlers();
  registerBookmarksIpcHandlers();
  registerDashboardIpcHandlers();
  registerFoldersIpcHandlers();
  registerEventsIpcHandlers();
  registerTagsIpcHandlers();
  registerSettingsIpcHandlers();
  registerSuggestionsIpcHandlers();
  registerRulesIpcHandlers();
  registerQuickAddIpcHandlers();
}