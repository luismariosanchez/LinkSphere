import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getRulesService } from '../database/context.js';

export function registerRulesIpcHandlers() {
  ipcMain.removeHandler(IPC_CHANNELS.RULES_GET_ALL);
  ipcMain.removeHandler(IPC_CHANNELS.RULES_UPDATE);
  ipcMain.removeHandler(IPC_CHANNELS.RULES_ADD);
  ipcMain.removeHandler(IPC_CHANNELS.RULES_DELETE);

  ipcMain.handle(IPC_CHANNELS.RULES_GET_ALL, () => {
    return getRulesService().getAll();
  });

  ipcMain.handle(IPC_CHANNELS.RULES_UPDATE, (_event, type, payload) => {
    if (Array.isArray(payload)) {
      return getRulesService().update(type, payload);
    }

    return getRulesService().updateRule(type, payload.id, payload);
  });

  ipcMain.handle(IPC_CHANNELS.RULES_ADD, (_event, type, rule) => {
    return getRulesService().addRule(type, rule);
  });

  ipcMain.handle(IPC_CHANNELS.RULES_DELETE, (_event, type, id) => {
    return getRulesService().deleteRule(type, id);
  });
}
