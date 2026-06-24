import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getDashboardUseCase } from '../database/context.js';

export function registerDashboardIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.DASHBOARD_GET_DATA, (_event, input) => {
    return getDashboardUseCase().execute(input ?? {});
  });
}
