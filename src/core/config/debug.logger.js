let settingsService = null;

export function initDebugLogger(service) {
  settingsService = service;
}

export function debugLog(...args) {
  if (settingsService?.isDebugMode()) {
    console.log(...args);
  }
}
