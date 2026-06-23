import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_FOLDER_RULES_PATH = path.join(__dirname, 'folder.rules.json');

function normalizeRuleList(input, keyField, folderField) {
  if (Array.isArray(input)) {
    return input;
  }

  if (!input || typeof input !== 'object') {
    return [];
  }

  return Object.entries(input).map(([key, folder]) => {
    if (keyField === 'isLive') {
      return { isLive: key === 'true', [folderField]: folder };
    }

    return { [keyField]: key, [folderField]: folder };
  });
}

export function normalizeFolderRules(raw) {
  return {
    keywordRules: normalizeRuleList(raw?.keywordRules, 'match', 'folder'),
    providerRules: normalizeRuleList(raw?.providerRules, 'provider', 'folder'),
    domainRules: normalizeRuleList(raw?.domainRules, 'domain', 'folder'),
    liveRules: normalizeRuleList(raw?.liveRules, 'isLive', 'folder'),
    providerLiveRules: normalizeRuleList(raw?.providerLiveRules, 'provider', 'folder'),
  };
}

export function loadFolderRules(rulesPath = DEFAULT_FOLDER_RULES_PATH) {
  const raw = JSON.parse(readFileSync(rulesPath, 'utf8'));
  return normalizeFolderRules(raw);
}
