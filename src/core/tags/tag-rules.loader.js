import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TAG_RULES_PATH = path.join(__dirname, 'tag.rules.json');

function normalizeRuleList(input, keyField, tagField) {
  if (Array.isArray(input)) {
    return input;
  }

  if (!input || typeof input !== 'object') {
    return [];
  }

  return Object.entries(input).map(([key, tag]) => {
    if (keyField === 'isLive') {
      return { isLive: key === 'true', [tagField]: tag };
    }

    return { [keyField]: key, [tagField]: tag };
  });
}

export function normalizeTagRules(raw) {
  return {
    keywordRules: normalizeRuleList(raw?.keywordRules, 'match', 'tag'),
    providerRules: normalizeRuleList(raw?.providerRules, 'provider', 'tag'),
    domainRules: normalizeRuleList(raw?.domainRules, 'domain', 'tag'),
    liveRules: normalizeRuleList(raw?.liveRules, 'isLive', 'tag'),
  };
}

export function loadTagRules(rulesPath = DEFAULT_TAG_RULES_PATH) {
  const raw = JSON.parse(readFileSync(rulesPath, 'utf8'));
  return normalizeTagRules(raw);
}
