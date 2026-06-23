import { app, BrowserWindow } from 'electron';
import { getSchedulerService, getSettingsService, shutdownDatabase } from '../database/context.js';
import { registerIpcHandlers } from '../ipc/index.js';
import { createMainWindow } from '../windows/main.window.js';

export function bootstrap() {
  void app.whenReady().then(() => {
    registerIpcHandlers();
    createMainWindow();
    const scheduler = getSchedulerService();
    const settings = getSettingsService().getAll();

    scheduler.setIntervalTime(settings.schedulerInterval);

    if (settings.autoRefresh) {
      scheduler.start();
    }

    app.on('activate', () => {      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('will-quit', () => {
    shutdownDatabase();
  });
}
