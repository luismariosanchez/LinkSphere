import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow } from 'electron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

function getPreloadPath() {
  return path.join(__dirname, '../../../dist/preload/index.cjs');
}

function getRendererUrl() {
  if (isDev) {
    return 'http://localhost:5173';
  }

  return `file://${path.join(__dirname, '../../../dist/renderer/index.html')}`;
}

let mainWindow = null;

export function getMainWindow() {
  return mainWindow;
}

export function createMainWindow() {
  const window = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  void window.loadURL(getRendererUrl());

  if (isDev) {
    window.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow = window;

  window.on('closed', () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  return window;
}
