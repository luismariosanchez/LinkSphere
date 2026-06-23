import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { debugLog } from '../../config/debug.logger.js';
import {
  extractDomain,
  matchesDomain,
  resolveIsLive,
} from '../../tags/tag-suggestion.service.js';
import { BaseProcessor } from '../base.processor.js';
import { matchesKeyword, uniqueValues } from '../matching.utils.js';
import { ProcessorRulesStore } from '../processor-rules.store.js';
import {
  buildRuleId,
  normalizeFolderRules,
  parseRuleId,
  sanitizeKeywordRules,
} from '../rules.schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_FOLDER_RULES_PATH = path.join(__dirname, 'folder.rules.json');

function trimRule(value) {
  return String(value ?? '').trim();
}

export class FolderProcessor extends BaseProcessor {
  constructor({ getPersistPath, legacyPersistPath, priority = 50 } = {}) {
    super('folder', { priority });

    if (!getPersistPath) {
      throw new Error('FolderProcessor requiere getPersistPath');
    }

    this.config = {
      enabled: true,
    };

    this.rulesStore = new ProcessorRulesStore({
      processorName: 'folder',
      defaultRulesPath: DEFAULT_FOLDER_RULES_PATH,
      getPersistPath,
      normalize: normalizeFolderRules,
      legacyPersistPath,
    });
  }

  reloadRules() {
    this.rulesStore.invalidateCache();
    return this.rulesStore.getNormalized();
  }

  getRules() {
    return this.rulesStore.getNormalized();
  }

  getKeywordRulesView() {
    return this.getRules().keywordRules.map((rule, index) => ({
      id: buildRuleId('folder', index),
      match: rule.match ?? '',
      folder: rule.folder ?? '',
    }));
  }

  updateKeywordRules(rules) {
    const raw = this.rulesStore.readRaw();
    raw.keywordRules = sanitizeKeywordRules(rules, 'folder');
    this.rulesStore.writeRaw(raw);
    return this.getKeywordRulesView();
  }

  addKeywordRule(rule) {
    const match = trimRule(rule?.match);
    const folder = trimRule(rule?.folder);

    if (!match) {
      throw new Error('El campo match es obligatorio');
    }

    if (!folder) {
      throw new Error('El campo folder es obligatorio');
    }

    const raw = this.rulesStore.readRaw();
    raw.keywordRules = [...(raw.keywordRules ?? []), { match, folder }];
    this.rulesStore.writeRaw(raw);
    return this.getKeywordRulesView();
  }

  updateKeywordRule(id, patch) {
    const parsed = parseRuleId(id);
    if (!parsed || parsed.type !== 'folder') {
      throw new Error('Regla no encontrada');
    }

    const raw = this.rulesStore.readRaw();
    const list = raw.keywordRules ?? [];
    const current = list[parsed.index];

    if (!current) {
      throw new Error('Regla no encontrada');
    }

    list[parsed.index] = {
      match: trimRule(patch?.match ?? current.match),
      folder: trimRule(patch?.folder ?? current.folder),
    };
    raw.keywordRules = sanitizeKeywordRules(list, 'folder');
    this.rulesStore.writeRaw(raw);
    return this.getKeywordRulesView();
  }

  deleteKeywordRule(id) {
    const parsed = parseRuleId(id);
    if (!parsed || parsed.type !== 'folder') {
      throw new Error('Regla no encontrada');
    }

    const raw = this.rulesStore.readRaw();
    const list = [...(raw.keywordRules ?? [])];

    if (!list[parsed.index]) {
      throw new Error('Regla no encontrada');
    }

    list.splice(parsed.index, 1);
    raw.keywordRules = list;
    this.rulesStore.writeRaw(raw);
    return this.getKeywordRulesView();
  }

  suggest(context) {
    const rules = this.getRules();
    const metadata = context.metadata ?? {};
    const provider = metadata.type ?? context.provider ?? '';
    const domain = extractDomain(context.url ?? metadata.url ?? '');
    const isLive = resolveIsLive(metadata);
    const suggestedFolders = [];

    for (const rule of rules.keywordRules) {
      if (matchesKeyword(rule.match, context)) {
        suggestedFolders.push(rule.folder);
      }
    }

    for (const rule of rules.providerRules) {
      if (provider === rule.provider) {
        suggestedFolders.push(rule.folder);
      }
    }

    for (const rule of rules.domainRules) {
      if (rule.domain && matchesDomain(domain, rule.domain)) {
        suggestedFolders.push(rule.folder);
      }
    }

    for (const rule of rules.liveRules) {
      if (rule.isLive === isLive) {
        suggestedFolders.push(rule.folder);
      }
    }

    for (const rule of rules.providerLiveRules ?? []) {
      if (provider === rule.provider && isLive) {
        suggestedFolders.push(rule.folder);
      }
    }

    const unique = uniqueValues(suggestedFolders);
    const result = {
      suggestedFolders: unique,
      suggestedFolder: unique[0] ?? null,
    };

    debugLog('FolderProcessor suggest:', result);

    return result;
  }

  run(bookmark) {
    const result = this.suggest(bookmark);

    return {
      folder: result.suggestedFolder ?? undefined,
      priority: this.priority,
      metadata: {
        folderSuggestion: result,
      },
    };
  }
}
