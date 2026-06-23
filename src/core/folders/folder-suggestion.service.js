import { debugLog } from '../config/debug.logger.js';
import {
  extractDomain,
  matchesDomain,
  resolveIsLive,
} from '../tags/tag-suggestion.service.js';
import { DEFAULT_FOLDER_RULES_PATH, loadFolderRules } from './folder-rules.loader.js';

function uniqueNames(names) {
  return [...new Set(names.filter(Boolean))];
}

function matchesKeyword(match, context) {
  const needle = String(match ?? '').toLowerCase();
  if (!needle) {
    return false;
  }

  const title = (context.title ?? '').toLowerCase();
  if (title.includes(needle)) {
    return true;
  }

  const tagNames = (context.tagNames ?? []).map((name) => String(name).toLowerCase());
  return tagNames.some((name) => name.includes(needle));
}

export class FolderSuggestionService {
  constructor({ rulesPath = DEFAULT_FOLDER_RULES_PATH } = {}) {
    this.rulesPath = rulesPath;
    this.rules = null;
  }

  loadRules() {
    if (this.rules) {
      return this.rules;
    }

    this.rules = loadFolderRules(this.rulesPath);
    debugLog('Loaded folder rules:', this.rules);

    return this.rules;
  }

  reloadRules() {
    this.rules = null;
    return this.loadRules();
  }

  suggest(context) {
    const rules = this.loadRules();
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

    const unique = uniqueNames(suggestedFolders);
    const result = {
      suggestedFolders: unique,
      suggestedFolder: unique[0] ?? null,
    };

    debugLog('Suggested folders:', result);

    return result;
  }
}
