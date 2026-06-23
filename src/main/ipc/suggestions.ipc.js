import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getOrganizationSuggestionService } from '../database/context.js';

export function registerSuggestionsIpcHandlers() {
  ipcMain.removeHandler(IPC_CHANNELS.SUGGESTIONS_GET);

  ipcMain.handle(IPC_CHANNELS.SUGGESTIONS_GET, (_event, context) => {
    return getOrganizationSuggestionService().suggest(context);
  });
}
