import { ipcMain } from 'electron';
import { debugLog } from '../../core/config/debug.logger.js';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getRepositories } from '../database/context.js';

function getTagRepository() {
  return getRepositories().tags;
}

export function registerTagsIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.TAGS_GET_ALL, () => {
    debugLog('IPC tags:getAll called');

    const result = getTagRepository().getAll();
    debugLog('Tags fetched:', result);

    return result;
  });

  ipcMain.handle(IPC_CHANNELS.TAGS_CREATE, (_event, input) => {
    debugLog('IPC tags:create called', input);

    const result = getTagRepository().create(input);
    debugLog('Tag created:', result);

    return result;
  });

  ipcMain.handle(IPC_CHANNELS.TAGS_DELETE, (_event, id) => {
    debugLog('IPC tags:delete called', id);

    const result = getTagRepository().delete(id);
    debugLog('Tag deleted:', result);

    return result;
  });

  ipcMain.handle(IPC_CHANNELS.TAGS_GET_BY_BOOKMARK_ID, (_event, bookmarkId) => {
    debugLog('IPC tags:getByBookmarkId called', bookmarkId);

    const result = getTagRepository().getByBookmarkId(bookmarkId);
    debugLog('Tags for bookmark:', result);

    return result;
  });
}
