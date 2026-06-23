import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getFolderService } from '../database/context.js';

const FOLDER_HANDLERS = [
  IPC_CHANNELS.FOLDERS_GET_ALL,
  IPC_CHANNELS.FOLDERS_CREATE,
  IPC_CHANNELS.FOLDERS_UPDATE,
  IPC_CHANNELS.FOLDERS_DELETE,
  IPC_CHANNELS.FOLDERS_SUGGEST,
];

export function registerFoldersIpcHandlers() {
  for (const channel of FOLDER_HANDLERS) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle(IPC_CHANNELS.FOLDERS_GET_ALL, () => {
    return getFolderService().getFolders();
  });

  ipcMain.handle(IPC_CHANNELS.FOLDERS_CREATE, (_event, input) => {
    return getFolderService().createFolder(input);
  });

  ipcMain.handle(IPC_CHANNELS.FOLDERS_UPDATE, (_event, id, input) => {
    return getFolderService().updateFolder(id, input);
  });

  ipcMain.handle(IPC_CHANNELS.FOLDERS_DELETE, (_event, id) => {
    return getFolderService().deleteFolder(id);
  });

  ipcMain.handle(IPC_CHANNELS.FOLDERS_SUGGEST, (_event, context) => {
    return getFolderService().suggest(context);
  });
}
