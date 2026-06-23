import { SCHEDULER_DEFAULT_INTERVAL_MS } from '../../shared/constants/app.js';

export const DEFAULT_SETTINGS = {
  debugMode: false,
  schedulerInterval: SCHEDULER_DEFAULT_INTERVAL_MS,
  autoTagging: true,
  autoRefresh: true,
};

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
  };
}
