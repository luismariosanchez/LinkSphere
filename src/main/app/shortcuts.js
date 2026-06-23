import { globalShortcut } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { getMainWindow } from '../windows/main.window.js';

const QUICK_ADD_SHORTCUT = 'CommandOrControl+Shift+A';

export function registerGlobalShortcuts() {
  globalShortcut.unregister(QUICK_ADD_SHORTCUT);

  const registered = globalShortcut.register(QUICK_ADD_SHORTCUT, () => {
    const window = getMainWindow();

    if (!window) {
      return;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window.show();
    window.focus();
    window.webContents.send(IPC_CHANNELS.INGESTION_OPEN_QUICK_ADD);
  });

  if (!registered) {
    console.warn('[shortcuts] No se pudo registrar Ctrl+Shift+A');
  }
}

export function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
}
