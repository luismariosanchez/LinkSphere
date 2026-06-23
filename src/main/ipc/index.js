import { registerAppIpcHandlers } from './app.ipc.js';
import { registerBookmarksIpcHandlers } from './bookmarks.ipc.js';
import { registerEventsIpcHandlers } from './events.ipc.js';
import { registerFoldersIpcHandlers } from './folders.ipc.js';
import { registerSettingsIpcHandlers } from './settings.ipc.js';
import { registerSuggestionsIpcHandlers } from './suggestions.ipc.js';
import { registerTagsIpcHandlers } from './tags.ipc.js';

export function registerIpcHandlers() {
  registerAppIpcHandlers();
  registerBookmarksIpcHandlers();
  registerFoldersIpcHandlers();
  registerEventsIpcHandlers();
  registerTagsIpcHandlers();
  registerSettingsIpcHandlers();
  registerSuggestionsIpcHandlers();
}