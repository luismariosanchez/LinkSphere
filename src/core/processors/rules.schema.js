function normalizeRuleList(input, keyField, valueField) {
  if (Array.isArray(input)) {
    return input;
  }

  if (!input || typeof input !== 'object') {
    return [];
  }

  return Object.entries(input).map(([key, value]) => {
    if (keyField === 'isLive') {
      return { isLive: key === 'true', [valueField]: value };
    }

    return { [keyField]: key, [valueField]: value };
  });
}

export function normalizeTagRules(raw) {
  return {
    keywordRules: normalizeRuleList(raw?.keywordRules, 'match', 'tag'),
    providerRules: normalizeRuleList(raw?.providerRules, 'provider', 'tag'),
    domainRules: normalizeRuleList(raw?.domainRules, 'domain', 'tag'),
    liveRules: normalizeRuleList(raw?.liveRules, 'isLive', 'tag'),
  };
}

export function normalizeFolderRules(raw) {
  return {
    keywordRules: normalizeRuleList(raw?.keywordRules, 'match', 'folder'),
    providerRules: normalizeRuleList(raw?.providerRules, 'provider', 'folder'),
    domainRules: normalizeRuleList(raw?.domainRules, 'domain', 'folder'),
    liveRules: normalizeRuleList(raw?.liveRules, 'isLive', 'folder'),
    providerLiveRules: normalizeRuleList(raw?.providerLiveRules, 'provider', 'folder'),
  };
}

export function buildRuleId(type, index) {
  return `${type}-${index}`;
}

export function parseRuleId(id) {
  const match = String(id ?? '').match(/^(tag|folder)-(\d+)$/);
  if (!match) {
    return null;
  }

  return { type: match[1], index: Number(match[2]) };
}

function trimRule(value) {
  return String(value ?? '').trim();
}

export function sanitizeKeywordRules(rules, valueKey) {
  return (rules ?? []).map((rule) => ({
    match: trimRule(rule.match),
    [valueKey]: trimRule(rule[valueKey]),
  })).filter((rule) => rule.match && rule[valueKey]);
}
