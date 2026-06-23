import { debugLog } from '../config/debug.logger.js';

function uniqueTags(tags) {
  return [...new Set(tags.filter(Boolean))];
}

export function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

export function matchesDomain(hostname, ruleDomain) {
  const domain = ruleDomain.toLowerCase().replace(/^www\./, '');
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function resolveIsLive(metadata) {
  if (metadata?.isLive === true) {
    return true;
  }

  const extra = metadata?.extra ?? {};
  return extra.streamStatus === 'live' || metadata?.lastStatus === 'live';
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

export class TagSuggestionService {
  constructor({ rulesService } = {}) {
    this.rulesService = rulesService;
  }

  loadRules() {
    if (this.rulesService) {
      return this.rulesService.getTagRulesNormalized();
    }

    throw new Error('TagSuggestionService requiere rulesService');
  }

  reloadRules() {
    this.rulesService?.invalidateCache();
    return this.loadRules();
  }

  suggest(context) {
    const rules = this.loadRules();
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
      suggestedTags: uniqueTags(suggestedTags),
      autoTags: uniqueTags(autoTags),
    };

    debugLog('Suggested tags:', result);

    return result;
  }

  resolveTagIds(tagNames, tagsRepo) {
    return uniqueTags(tagNames).map((name) => tagsRepo.findOrCreateByName(name).id);
  }

  mergeTagIds(existingTagIds, tagNames, tagsRepo) {
    const resolvedIds = this.resolveTagIds(tagNames, tagsRepo);
    return [...new Set([...(existingTagIds ?? []), ...resolvedIds])];
  }
}
