import { ipcMain, shell } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getBookmarkService, wipeApplicationData } from '../database/context.js';

export function registerAppIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.APP_PING, () => 'pong');

  ipcMain.handle(IPC_CHANNELS.APP_OPEN_EXTERNAL, (_event, url) => {
    if (!url || typeof url !== 'string') {
      throw new Error('URL inválida');
    }

    getBookmarkService().recordOpenByUrl(url);

    return shell.openExternal(url);
  });

  ipcMain.handle(IPC_CHANNELS.APP_WIPE_DATA, () => {
    return wipeApplicationData();
  });
}
