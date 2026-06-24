import { SCHEDULER_DEFAULT_INTERVAL_MS } from '../../shared/constants/app.js';
import {
  DEFAULT_ENABLED_PROCESSORS,
  KNOWN_PROCESSORS,
} from '../../shared/constants/processors.js';

export const DEFAULT_SETTINGS = {
  debugMode: false,
  schedulerInterval: SCHEDULER_DEFAULT_INTERVAL_MS,
  autoTagging: true,
  autoRefresh: true,
  enabledProcessors: DEFAULT_ENABLED_PROCESSORS,
  quickAddHotkey: 'CommandOrControl+Space',
};

export function normalizeEnabledProcessors(input) {
  if (!Array.isArray(input)) {
    return [...DEFAULT_ENABLED_PROCESSORS];
  }

  return input.filter((name) => KNOWN_PROCESSORS.has(name));
}

export function normalizeSettings(input = {}) {
  const schedulerInterval = Number(
    input.schedulerInterval ?? DEFAULT_SETTINGS.schedulerInterval,
  );

  return {
    debugMode: Boolean(input.debugMode ?? DEFAULT_SETTINGS.debugMode),
    schedulerInterval: Number.isFinite(schedulerInterval) && schedulerInterval > 0
      ? schedulerInterval
      : DEFAULT_SETTINGS.schedulerInterval,
    autoTagging: Boolean(input.autoTagging ?? DEFAULT_SETTINGS.autoTagging),
    autoRefresh: Boolean(input.autoRefresh ?? DEFAULT_SETTINGS.autoRefresh),
    enabledProcessors: normalizeEnabledProcessors(input.enabledProcessors),
    quickAddHotkey: String(input.quickAddHotkey ?? DEFAULT_SETTINGS.quickAddHotkey).trim()
      || DEFAULT_SETTINGS.quickAddHotkey,
  };
}
