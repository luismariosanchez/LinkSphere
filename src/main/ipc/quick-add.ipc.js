import { clipboard, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';
import { isProbableBookmarkUrl } from '../../shared/utils/url.js';
import { getIngestionService } from '../database/context.js';
import { hideQuickAddWindow } from '../windows/quick-add.window.js';

function readClipboardUrl() {
  const text = clipboard.readText()?.trim() ?? '';

  if (!isProbableBookmarkUrl(text)) {
    return '';
  }

  return text;
}

export function registerQuickAddIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.QUICK_ADD_HIDE, () => {
    hideQuickAddWindow();
  });

  ipcMain.handle(IPC_CHANNELS.QUICK_ADD_GET_INITIAL, () => {
    return {
      clipboardUrl: readClipboardUrl(),
    };
  });

  ipcMain.handle(IPC_CHANNELS.QUICK_ADD_PREVIEW, async (_event, url) => {
    return getIngestionService().previewMetadata(url);
  });
}
