export function matchesKeyword(match, context) {
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

export function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}
