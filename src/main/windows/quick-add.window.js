import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow, screen } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

let quickAddWindow = null;
let blurCloseEnabled = false;

function getPreloadPath() {
  return path.join(__dirname, '../../../dist/preload/index.cjs');
}

function getQuickAddUrl() {
  if (isDev) {
    return 'http://localhost:5173/quick-add.html';
  }

  return `file://${path.join(__dirname, '../../../dist/renderer/quick-add.html')}`;
}

export function getQuickAddWindow() {
  return quickAddWindow;
}

export function createQuickAddWindow() {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    return quickAddWindow;
  }

  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;

  quickAddWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    focusable: true,
    hasShadow: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  quickAddWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  quickAddWindow.on('blur', () => {
    if (!blurCloseEnabled || !quickAddWindow || quickAddWindow.isDestroyed()) {
      return;
    }

    hideQuickAddWindow();
  });

  void quickAddWindow.loadURL(getQuickAddUrl());

  quickAddWindow.on('closed', () => {
    quickAddWindow = null;
  });

  return quickAddWindow;
}

export function showQuickAddWindow() {
  const window = createQuickAddWindow();
  blurCloseEnabled = false;
  window.show();
  window.focus();
  window.webContents.send(IPC_CHANNELS.QUICK_ADD_SHOWN);

  setTimeout(() => {
    blurCloseEnabled = true;
  }, 250);
}

export function hideQuickAddWindow() {
  blurCloseEnabled = false;

  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    quickAddWindow.hide();
  }
}

export function toggleQuickAddWindow() {
  const window = createQuickAddWindow();

  if (window.isVisible()) {
    hideQuickAddWindow();
    return;
  }

  showQuickAddWindow();
}
