import fs from 'node:fs/promises';
import { BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getBookmarkUseCases } from '../database/context.js';

function getWindowFromEvent(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

export function registerBookmarksIpcHandlers() {
  const useCases = () => getBookmarkUseCases();

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_CREATE, async (_event, input) => {
    return useCases().create.execute(input);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_ALL, () => {
    return useCases().get.executeAll();
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_BY_ID, (_event, id) => {
    return useCases().get.executeById(id);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_WITH_STATE, (_event, id) => {
    return useCases().get.executeWithState(id);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_RESCAN, async (_event, id) => {
    return useCases().rescan.execute(id);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_UPDATE, (_event, id, input) => {
    return useCases().update.execute(id, input);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_DELETE, (_event, id) => {
    return useCases().delete.execute(id);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_RECENT, (_event, limit) => {
    return useCases().get.executeRecent(limit);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_FAVORITES, () => {
    return useCases().get.executeFavorites();
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_QUERY, (_event, filters) => {
    return useCases().get.executeQuery(filters);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_GET_BY_FOLDER, (_event, folderId, options) => {
    return useCases().getByFolder.execute(folderId, options);
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_OPEN, async (_event, input) => {
    const result = useCases().open.execute(input);
    await shell.openExternal(input.url);
    return result;
  });

  ipcMain.handle(IPC_CHANNELS.BOOKMARKS_EXPORT, async (event) => {
    const window = getWindowFromEvent(event);
    const html = useCases().export.execute();
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
    const result = await useCases().import.execute(html, {
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
