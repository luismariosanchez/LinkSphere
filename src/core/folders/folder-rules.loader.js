export {
  DEFAULT_FOLDER_RULES_PATH,
  normalizeFolderRules,
} from '../config/rules/index.js';

import { DEFAULT_FOLDER_RULES_PATH } from '../config/rules/index.js';
import { normalizeFolderRules } from '../config/rules/index.js';
import { readFileSync } from 'node:fs';

export function loadFolderRules(rulesPath = DEFAULT_FOLDER_RULES_PATH) {
  const raw = JSON.parse(readFileSync(rulesPath, 'utf8'));
  return normalizeFolderRules(raw);
}
