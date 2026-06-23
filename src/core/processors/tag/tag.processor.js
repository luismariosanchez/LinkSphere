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
  normalizeTagRules,
  parseRuleId,
  sanitizeKeywordRules,
} from '../rules.schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_TAG_RULES_PATH = path.join(__dirname, 'tag.rules.json');

function trimRule(value) {
  return String(value ?? '').trim();
}

export class TagProcessor extends BaseProcessor {
  constructor({ getPersistPath, legacyPersistPath, priority = 50 } = {}) {
    super('tag', { priority });

    if (!getPersistPath) {
      throw new Error('TagProcessor requiere getPersistPath');
    }

    this.config = {
      enabled: true,
    };

    this.rulesStore = new ProcessorRulesStore({
      processorName: 'tag',
      defaultRulesPath: DEFAULT_TAG_RULES_PATH,
      getPersistPath,
      normalize: normalizeTagRules,
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
      id: buildRuleId('tag', index),
      match: rule.match ?? '',
      tag: rule.tag ?? '',
    }));
  }

  updateKeywordRules(rules) {
    const raw = this.rulesStore.readRaw();
    raw.keywordRules = sanitizeKeywordRules(rules, 'tag');
    this.rulesStore.writeRaw(raw);
    return this.getKeywordRulesView();
  }

  addKeywordRule(rule) {
    const match = trimRule(rule?.match);
    const tag = trimRule(rule?.tag);

    if (!match) {
      throw new Error('El campo match es obligatorio');
    }

    if (!tag) {
      throw new Error('El campo tag es obligatorio');
    }

    const raw = this.rulesStore.readRaw();
    raw.keywordRules = [...(raw.keywordRules ?? []), { match, tag }];
    this.rulesStore.writeRaw(raw);
    return this.getKeywordRulesView();
  }

  updateKeywordRule(id, patch) {
    const parsed = parseRuleId(id);
    if (!parsed || parsed.type !== 'tag') {
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
      tag: trimRule(patch?.tag ?? current.tag),
    };
    raw.keywordRules = sanitizeKeywordRules(list, 'tag');
    this.rulesStore.writeRaw(raw);
    return this.getKeywordRulesView();
  }

  deleteKeywordRule(id) {
    const parsed = parseRuleId(id);
    if (!parsed || parsed.type !== 'tag') {
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
    const url = context.url ?? '';
    const metadata = context.metadata ?? {};
    const provider = metadata.type ?? context.provider ?? '';
    const domain = extractDomain(url);
    const isLive = resolveIsLive(metadata);

    const suggestedTags = [];

    for (const rule of rules.keywordRules) {
      if (matchesKeyword(rule.match, context)) {
        suggestedTags.push(rule.tag);
      }
    }

    const autoTags = [];

    for (const rule of rules.providerRules) {
      if (provider === rule.provider) {
        autoTags.push(rule.tag);
      }
    }

    for (const rule of rules.domainRules) {
      if (rule.domain && matchesDomain(domain, rule.domain)) {
        autoTags.push(rule.tag);
      }
    }

    for (const rule of rules.liveRules) {
      if (rule.isLive === isLive) {
        autoTags.push(rule.tag);
      }
    }

    const result = {
      suggestedTags: uniqueValues(suggestedTags),
      autoTags: uniqueValues(autoTags),
    };

    debugLog('TagProcessor suggest:', result);

    return result;
  }

  resolveTagIds(tagNames, tagsRepo) {
    return uniqueValues(tagNames).map((name) => tagsRepo.findOrCreateByName(name).id);
  }

  mergeTagIds(existingTagIds, tagNames, tagsRepo) {
    const resolvedIds = this.resolveTagIds(tagNames, tagsRepo);
    return [...new Set([...(existingTagIds ?? []), ...resolvedIds])];
  }

  run(bookmark) {
    const result = this.suggest(bookmark);
    const tags = uniqueValues([...result.suggestedTags, ...result.autoTags]);

    return {
      tags,
      priority: this.priority,
      metadata: {
        tagSuggestion: result,
      },
    };
  }
}
