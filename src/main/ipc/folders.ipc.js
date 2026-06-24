import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getFolderService, getFoldersViewUseCase } from '../database/context.js';

const FOLDER_HANDLERS = [
  IPC_CHANNELS.FOLDERS_GET_ALL,
  IPC_CHANNELS.FOLDERS_GET_ALL_WITH_STATS,
  IPC_CHANNELS.FOLDERS_GET_BY_ID,
  IPC_CHANNELS.FOLDERS_GET_STATS,
  IPC_CHANNELS.FOLDERS_GET_PINNED,
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
    return getFolderService().getAllFolders();
  });

  ipcMain.handle(IPC_CHANNELS.FOLDERS_GET_ALL_WITH_STATS, () => {
    return getFolderService().getAllFoldersWithStats();
  });

  ipcMain.handle(IPC_CHANNELS.FOLDERS_GET_BY_ID, (_event, id) => {
    return getFolderService().getFolderById(id);
  });

  ipcMain.handle(IPC_CHANNELS.FOLDERS_GET_STATS, (_event, folderId) => {
    return getFolderService().getFolderStats(folderId);
  });

  ipcMain.handle(IPC_CHANNELS.FOLDERS_GET_PINNED, () => {
    return getFolderService().getPinnedFolders();
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

  ipcMain.handle(IPC_CHANNELS.FOLDERS_GET_VIEW_DATA, (_event, input) => {
    return getFoldersViewUseCase().execute(input ?? {});
  });
}
