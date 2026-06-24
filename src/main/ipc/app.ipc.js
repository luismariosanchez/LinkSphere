import { ipcMain, shell } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getBookmarkUseCases, wipeApplicationData } from '../database/context.js';

export function registerAppIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.APP_PING, () => 'pong');

  ipcMain.handle(IPC_CHANNELS.APP_OPEN_EXTERNAL, async (_event, url) => {
    const result = getBookmarkUseCases().open.execute({ url });
    await shell.openExternal(url);
    return result;
  });

  ipcMain.handle(IPC_CHANNELS.APP_WIPE_DATA, () => {
    return wipeApplicationData();
  });
}
