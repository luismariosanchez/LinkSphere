import { nowIso } from '../../database/utils.js';

export function resolveTagNames(tagsRepo, tagIds) {
  return (tagIds ?? [])
    .map((id) => tagsRepo.getById(id)?.name)
    .filter(Boolean);
}

export function applyTagIntelligence({
  tagSuggestionService,
  tagsRepo,
  settingsService,
  tagIds,
  metadata,
  url,
  title,
  applySuggested = false,
}) {
  if (!settingsService.get('autoTagging')) {
    return tagIds ?? [];
  }

  const suggestion = tagSuggestionService.suggest({ metadata, url, title });
  const tagNames = [...suggestion.autoTags];

  if (applySuggested) {
    tagNames.push(...suggestion.suggestedTags);
  }

  return tagSuggestionService.mergeTagIds(tagIds ?? [], tagNames, tagsRepo);
}

export function saveStateSnapshot(bookmarksRepo, bookmarkId, metadata) {
  const extra = metadata.extra ?? {};

  bookmarksRepo.updateState(bookmarkId, {
    data: {
      ...extra,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      type: metadata.type,
      updatedAt: nowIso(),
    },
  });
}
