import { debugLog } from '../debug.logger.js';
import {
  buildRuleId,
  normalizeFolderRules,
  normalizeTagRules,
  parseRuleId,
} from './rules.schema.js';

function trimRule(value) {
  return String(value ?? '').trim();
}

function toTagRuleView(rules) {
  return rules.map((rule, index) => ({
    id: buildRuleId('tag', index),
    match: rule.match ?? '',
    tag: rule.tag ?? '',
  }));
}

function toFolderRuleView(rules) {
  return rules.map((rule, index) => ({
    id: buildRuleId('folder', index),
    match: rule.match ?? '',
    folder: rule.folder ?? '',
  }));
}

export class RulesService {
  constructor({ repository, onChange } = {}) {
    this.repository = repository;
    this.onChange = onChange;
    this.cache = { tag: null, folder: null };
  }

  invalidateCache() {
    this.cache = { tag: null, folder: null };
  }

  #notifyChange() {
    this.invalidateCache();
    this.onChange?.();
  }

  getTagRulesNormalized() {
    if (!this.cache.tag) {
      this.cache.tag = normalizeTagRules(this.repository.readTagRulesRaw());
      debugLog('Loaded tag rules:', this.cache.tag);
    }

    return this.cache.tag;
  }

  getFolderRulesNormalized() {
    if (!this.cache.folder) {
      this.cache.folder = normalizeFolderRules(this.repository.readFolderRulesRaw());
      debugLog('Loaded folder rules:', this.cache.folder);
    }

    return this.cache.folder;
  }

  getAll() {
    const tagRules = this.getTagRulesNormalized();
    const folderRules = this.getFolderRulesNormalized();

    return {
      tagRules: toTagRuleView(tagRules.keywordRules),
      folderRules: toFolderRuleView(folderRules.keywordRules),
    };
  }

  update(type, rules) {
    if (type === 'tag') {
      const raw = this.repository.readTagRulesRaw();
      raw.keywordRules = (rules ?? []).map(({ match, tag }) => ({
        match: trimRule(match),
        tag: trimRule(tag),
      })).filter((rule) => rule.match && rule.tag);
      this.repository.writeTagRulesRaw(raw);
    } else if (type === 'folder') {
      const raw = this.repository.readFolderRulesRaw();
      raw.keywordRules = (rules ?? []).map(({ match, folder }) => ({
        match: trimRule(match),
        folder: trimRule(folder),
      })).filter((rule) => rule.match && rule.folder);
      this.repository.writeFolderRulesRaw(raw);
    } else {
      throw new Error(`Tipo de reglas desconocido: ${type}`);
    }

    this.#notifyChange();
    return this.getAll();
  }

  addRule(type, rule) {
    const match = trimRule(rule?.match);
    if (!match) {
      throw new Error('El campo match es obligatorio');
    }

    if (type === 'tag') {
      const tag = trimRule(rule?.tag);
      if (!tag) {
        throw new Error('El campo tag es obligatorio');
      }

      const raw = this.repository.readTagRulesRaw();
      raw.keywordRules = [...(raw.keywordRules ?? []), { match, tag }];
      this.repository.writeTagRulesRaw(raw);
    } else if (type === 'folder') {
      const folder = trimRule(rule?.folder);
      if (!folder) {
        throw new Error('El campo folder es obligatorio');
      }

      const raw = this.repository.readFolderRulesRaw();
      raw.keywordRules = [...(raw.keywordRules ?? []), { match, folder }];
      this.repository.writeFolderRulesRaw(raw);
    } else {
      throw new Error(`Tipo de reglas desconocido: ${type}`);
    }

    this.#notifyChange();
    return this.getAll();
  }

  updateRule(type, id, patch) {
    const parsed = parseRuleId(id);
    if (!parsed || parsed.type !== type) {
      throw new Error('Regla no encontrada');
    }

    if (type === 'tag') {
      const raw = this.repository.readTagRulesRaw();
      const list = raw.keywordRules ?? [];
      const current = list[parsed.index];

      if (!current) {
        throw new Error('Regla no encontrada');
      }

      list[parsed.index] = {
        match: trimRule(patch?.match ?? current.match),
        tag: trimRule(patch?.tag ?? current.tag),
      };
      raw.keywordRules = list.filter((rule) => rule.match && rule.tag);
      this.repository.writeTagRulesRaw(raw);
    } else if (type === 'folder') {
      const raw = this.repository.readFolderRulesRaw();
      const list = raw.keywordRules ?? [];
      const current = list[parsed.index];

      if (!current) {
        throw new Error('Regla no encontrada');
      }

      list[parsed.index] = {
        match: trimRule(patch?.match ?? current.match),
        folder: trimRule(patch?.folder ?? current.folder),
      };
      raw.keywordRules = list.filter((rule) => rule.match && rule.folder);
      this.repository.writeFolderRulesRaw(raw);
    } else {
      throw new Error(`Tipo de reglas desconocido: ${type}`);
    }

    this.#notifyChange();
    return this.getAll();
  }

  deleteRule(type, id) {
    const parsed = parseRuleId(id);
    if (!parsed || parsed.type !== type) {
      throw new Error('Regla no encontrada');
    }

    if (type === 'tag') {
      const raw = this.repository.readTagRulesRaw();
      const list = [...(raw.keywordRules ?? [])];

      if (!list[parsed.index]) {
        throw new Error('Regla no encontrada');
      }

      list.splice(parsed.index, 1);
      raw.keywordRules = list;
      this.repository.writeTagRulesRaw(raw);
    } else if (type === 'folder') {
      const raw = this.repository.readFolderRulesRaw();
      const list = [...(raw.keywordRules ?? [])];

      if (!list[parsed.index]) {
        throw new Error('Regla no encontrada');
      }

      list.splice(parsed.index, 1);
      raw.keywordRules = list;
      this.repository.writeFolderRulesRaw(raw);
    } else {
      throw new Error(`Tipo de reglas desconocido: ${type}`);
    }

    this.#notifyChange();
    return this.getAll();
  }
}
