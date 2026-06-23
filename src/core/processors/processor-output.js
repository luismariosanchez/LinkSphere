function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

/**
 * @param {import('./base.processor.js').ProcessorOutput} output
 */
export function normalizeProcessorOutput(output = {}) {
  return {
    tags: Array.isArray(output.tags) ? output.tags.filter(Boolean) : [],
    folder: output.folder ?? null,
    priority: typeof output.priority === 'number' ? output.priority : null,
    metadata: output.metadata ?? {},
  };
}

/**
 * @param {Array<{ output: import('./base.processor.js').ProcessorOutput, processorName: string, defaultPriority: number }>} collected
 * @returns {import('./base.processor.js').PipelineResult}
 */
export function mergeProcessorOutputs(collected) {
  const merged = {
    tags: [],
    folders: [],
    folder: null,
    metadata: {},
  };

  const folderCandidates = [];

  for (const { output, processorName, defaultPriority } of collected) {
    const normalized = normalizeProcessorOutput(output);
    const priority = normalized.priority ?? defaultPriority ?? 0;

    merged.tags.push(...normalized.tags);

    if (normalized.folder) {
      folderCandidates.push({
        folder: normalized.folder,
        priority,
        processor: processorName,
      });
    }

    const extraFolders = normalized.metadata?.folderSuggestion?.suggestedFolders;
    if (Array.isArray(extraFolders)) {
      for (const folder of extraFolders) {
        if (folder) {
          folderCandidates.push({ folder, priority, processor: processorName });
        }
      }
    }

    if (Object.keys(normalized.metadata).length > 0) {
      merged.metadata = { ...merged.metadata, ...normalized.metadata };
      merged.metadata.processors = merged.metadata.processors ?? {};
      merged.metadata.processors[processorName] = normalized.metadata;
    }
  }

  merged.tags = unique(merged.tags);

  folderCandidates.sort((a, b) => b.priority - a.priority);

  const seenFolders = new Set();
  for (const { folder } of folderCandidates) {
    const key = String(folder).toLowerCase();
    if (seenFolders.has(key)) {
      continue;
    }

    seenFolders.add(key);
    merged.folders.push(folder);
  }

  merged.folder = merged.folders[0] ?? null;

  return merged;
}
