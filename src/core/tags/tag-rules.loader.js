export {
  DEFAULT_TAG_RULES_PATH,
  normalizeTagRules,
} from '../config/rules/index.js';

import { DEFAULT_TAG_RULES_PATH } from '../config/rules/index.js';
import { normalizeTagRules } from '../config/rules/index.js';
import { readFileSync } from 'node:fs';

export function loadTagRules(rulesPath = DEFAULT_TAG_RULES_PATH) {
  const raw = JSON.parse(readFileSync(rulesPath, 'utf8'));
  return normalizeTagRules(raw);
}
