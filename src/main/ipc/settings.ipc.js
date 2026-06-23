import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getSettingsService } from '../database/context.js';

export function registerSettingsIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return getSettingsService().getAll();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, (_event, partial) => {
    return getSettingsService().update(partial);
  });
}
