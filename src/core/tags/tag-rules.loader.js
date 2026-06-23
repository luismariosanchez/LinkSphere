import { normalizeTagRules } from '../processors/rules.schema.js';
import { readFileSync } from 'node:fs';

export { DEFAULT_TAG_RULES_PATH } from '../processors/tag/index.js';
export { normalizeTagRules };

import { DEFAULT_TAG_RULES_PATH } from '../processors/tag/index.js';

export function loadTagRules(rulesPath = DEFAULT_TAG_RULES_PATH) {
  const raw = JSON.parse(readFileSync(rulesPath, 'utf8'));
  return normalizeTagRules(raw);
}
