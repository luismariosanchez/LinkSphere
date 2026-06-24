import { globalShortcut } from 'electron';
import { getSettingsService } from '../database/context.js';
import { toggleQuickAddWindow } from '../windows/quick-add.window.js';

let registeredAccelerator = null;

export function registerQuickAddHotkey(accelerator) {
  const next = accelerator?.trim();

  if (!next) {
    return false;
  }

  if (registeredAccelerator) {
    globalShortcut.unregister(registeredAccelerator);
    registeredAccelerator = null;
  }

  const success = globalShortcut.register(next, () => {
    toggleQuickAddWindow();
  });

  if (success) {
    registeredAccelerator = next;
  }

  return success;
}

export function unregisterQuickAddHotkey() {
  if (registeredAccelerator) {
    globalShortcut.unregister(registeredAccelerator);
    registeredAccelerator = null;
  }
}

export function initQuickAddHotkey() {
  const settings = getSettingsService().getAll();
  registerQuickAddHotkey(settings.quickAddHotkey);
}

export function reloadQuickAddHotkey() {
  initQuickAddHotkey();
}
