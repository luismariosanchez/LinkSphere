import { debugLog } from '../config/debug.logger.js';
import { FolderSuggestionService } from '../folders/folder-suggestion.service.js';
import { TagSuggestionService } from '../tags/tag-suggestion.service.js';
import { inferProviderFromUrl } from './infer-provider.js';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export class OrganizationSuggestionService {
  constructor({
    tagSuggestionService,
    folderSuggestionService,
  } = {}) {
    this.tagSuggestionService = tagSuggestionService ?? new TagSuggestionService();
    this.folderSuggestionService = folderSuggestionService ?? new FolderSuggestionService();
  }

  #buildContext(context) {
    const provider = context.provider
      ?? context.metadata?.type
      ?? inferProviderFromUrl(context.url ?? '');

    return {
      ...context,
      provider,
      title: context.title ?? '',
      url: context.url ?? '',
      tagNames: context.tagNames ?? [],
      metadata: {
        type: provider,
        lastStatus: context.metadata?.lastStatus ?? null,
        extra: context.metadata?.extra ?? {},
        ...context.metadata,
      },
    };
  }

  suggest(context) {
    const enriched = this.#buildContext(context);
    const tagResult = this.tagSuggestionService.suggest(enriched);
    const folderResult = this.folderSuggestionService.suggest(enriched);

    const existingTagNames = new Set(
      enriched.tagNames.map((name) => String(name).toLowerCase()),
    );

    const suggestedTags = unique([
      ...tagResult.suggestedTags,
      ...tagResult.autoTags,
    ]).filter((name) => !existingTagNames.has(name.toLowerCase()));

    const currentFolder = String(context.currentFolderName ?? '').trim().toLowerCase();
    const suggestedFolders = folderResult.suggestedFolders.filter(
      (name) => name.toLowerCase() !== currentFolder,
    );

    const result = { suggestedFolders, suggestedTags };

    debugLog('Organization suggestions:', result);

    return result;
  }
}
