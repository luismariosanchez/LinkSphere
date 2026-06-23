import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getIngestionService } from '../database/context.js';

export function broadcastBookmarkCreated(bookmark) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IPC_CHANNELS.INGESTION_BOOKMARK_CREATED, bookmark);
  }
}

export function registerIngestionIpcHandlers() {
  ipcMain.removeHandler(IPC_CHANNELS.INGESTION_INGEST);

  ipcMain.handle(IPC_CHANNELS.INGESTION_INGEST, async (_event, input) => {
    const bookmark = await getIngestionService().ingest(input);
    broadcastBookmarkCreated(bookmark);
    return bookmark;
  });
}
