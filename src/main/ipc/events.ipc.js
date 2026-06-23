import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getEventService } from '../database/context.js';

export function registerEventsIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.EVENTS_GET_ALL, () => {
    return getEventService().getAllEvents();
  });

  ipcMain.handle(IPC_CHANNELS.EVENTS_GET_BY_BOOKMARK_ID, (_event, bookmarkId) => {
    return getEventService().getEvents(bookmarkId);
  });
}
