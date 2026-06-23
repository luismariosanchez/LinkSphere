import { normalizeFolderRules } from '../processors/rules.schema.js';
import { readFileSync } from 'node:fs';

export { DEFAULT_FOLDER_RULES_PATH } from '../processors/folder/index.js';
export { normalizeFolderRules };

import { DEFAULT_FOLDER_RULES_PATH } from '../processors/folder/index.js';

export function loadFolderRules(rulesPath = DEFAULT_FOLDER_RULES_PATH) {
  const raw = JSON.parse(readFileSync(rulesPath, 'utf8'));
  return normalizeFolderRules(raw);
}
