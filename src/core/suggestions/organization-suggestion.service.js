import { debugLog } from '../config/debug.logger.js';
import { ProcessorPipeline } from '../processors/index.js';
import { inferProviderFromUrl } from './infer-provider.js';

export class OrganizationSuggestionService {
  constructor({ registry, pipeline } = {}) {
    if (!registry) {
      throw new Error('OrganizationSuggestionService requiere registry');
    }

    this.registry = registry;
    this.pipeline = pipeline ?? new ProcessorPipeline({ registry });
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
    const pipelineResult = this.pipeline.run(enriched);

    const existingTagNames = new Set(
      enriched.tagNames.map((name) => String(name).toLowerCase()),
    );

    const suggestedTags = (pipelineResult.tags ?? []).filter(
      (name) => !existingTagNames.has(name.toLowerCase()),
    );

    const currentFolder = String(context.currentFolderName ?? '').trim().toLowerCase();
    const suggestedFolders = (pipelineResult.folders ?? []).filter(
      (name) => name.toLowerCase() !== currentFolder,
    );

    const result = { suggestedFolders, suggestedTags };

    debugLog('Organization suggestions (pipeline):', {
      activeProcessors: this.registry.getActiveProcessors().map((p) => p.name),
      pipeline: pipelineResult.metadata,
      result,
    });

    return result;
  }
}
