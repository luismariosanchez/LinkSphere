import { mergeProcessorOutputs } from './processor-output.js';

export class ProcessorPipeline {
  constructor({ processors = [], registry = null } = {}) {
    this.processors = processors;
    this.registry = registry;
  }

  #resolveProcessors() {
    if (this.registry) {
      return this.registry.getActiveProcessors();
    }

    return this.processors;
  }

  /**
   * @param {object} bookmark
   * @returns {import('./base.processor.js').PipelineResult}
   */
  run(bookmark) {
    let enrichedContext = { ...bookmark };
    const collected = [];

    for (const processor of this.#resolveProcessors()) {
      const output = processor.run(enrichedContext) ?? {};

      if (output.metadata) {
        enrichedContext = {
          ...enrichedContext,
          metadata: {
            ...enrichedContext.metadata,
            ...output.metadata,
          },
        };
      }

      collected.push({
        output,
        processorName: processor.name,
        defaultPriority: processor.priority ?? 0,
      });
    }

    return mergeProcessorOutputs(collected);
  }
}
