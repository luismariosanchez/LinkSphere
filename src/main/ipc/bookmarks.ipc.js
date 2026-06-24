import fs from 'node:fs/promises';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getBookmarkService } from '../database/context.js';

function getWindowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

export function registerBookmarksIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_CREATE, async (_event, input) => {
    return getBookmarkService().create(input);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_ALL, () => {
    return getBookmarkService().getAll();
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_BY_ID, (_event, id) => {
    return getBookmarkService().getById(id);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_WITH_STATE, (_event, id) => {
    return getBookmarkService().getWithState(id);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_RESCAN, async (_event, id) => {
    return getBookmarkService().rescan(id);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_UPDATE, (_event, id, input) => {
    return getBookmarkService().update(id, input);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_DELETE, (_event, id) => {
    return getBookmarkService().delete(id);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_RECENT, (_event, limit) => {
    return getBookmarkService().getRecentBookmarks(limit);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_FAVORITES, () => {
    return getBookmarkService().getFavoriteBookmarks();
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_QUERY, (_event, filters) => {
    return getBookmarkService().queryBookmarks(filters);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_BY_FOLDER, (_event, folderId, options) => {
    return getBookmarkService().getBookmarksByFolder(folderId, options);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_EXPORT, async (event) => {
    const window = getWindowFromEvent(event);
    const html = getBookmarkService().exportToHtml();
    const { canceled, filePath } = await dialog.showSaveDialog(window, {
      title: 'Exportar bookmarks',
      defaultPath: 'bookmarks.html',
      filters: [{ name: 'HTML Bookmarks', extensions: ['html'] }],
    });

    if (canceled || !filePath) {
      return { canceled: true };
    }

    await fs.writeFile(filePath, html, 'utf8');

    return { canceled: false, filePath };
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_IMPORT, async (event) => {
    const window = getWindowFromEvent(event);
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      title: 'Importar bookmarks',
      filters: [{ name: 'HTML Bookmarks', extensions: ['html', 'htm'] }],
      properties: ['openFile'],
    });

    if (canceled || !filePaths?.[0]) {
      return { canceled: true };
    }

    const html = await fs.readFile(filePaths[0], 'utf8');
    const result = await getBookmarkService().importFromHtml(html, {
      onProgress: (progress) => {
        event.sender.send(IPC_CHANNELS.BOOKMARKS_IMPORT_PROGRESS, progress);
      },
    });

    return {
      canceled: false,
      filePath: filePaths[0],
      ...result,
    };
  });
}
