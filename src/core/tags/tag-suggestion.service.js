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

export class TagSuggestionService {
  constructor({ tagProcessor } = {}) {
    this.tagProcessor = tagProcessor;
  }

  loadRules() {
    return this.tagProcessor.getRules();
  }

  reloadRules() {
    return this.tagProcessor.reloadRules();
  }

  suggest(context) {
    return this.tagProcessor.suggest(context);
  }

  resolveTagIds(tagNames, tagsRepo) {
    return this.tagProcessor.resolveTagIds(tagNames, tagsRepo);
  }

  mergeTagIds(existingTagIds, tagNames, tagsRepo) {
    return this.tagProcessor.mergeTagIds(existingTagIds, tagNames, tagsRepo);
  }
}
