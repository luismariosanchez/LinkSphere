import {
  DEFAULT_ENABLED_PROCESSORS,
  DEFAULT_PROCESSOR_ORDER,
} from '../../shared/constants/processors.js';
import { FolderProcessor } from './folder/index.js';
import { LiveProcessor } from './live/index.js';
import { TagProcessor } from './tag/index.js';

export class ProcessorsRegistry {
  constructor({ getEnabledProcessors = () => DEFAULT_ENABLED_PROCESSORS } = {}) {
    this.processors = new Map();
    this.order = [...DEFAULT_PROCESSOR_ORDER];
    this.getEnabledProcessors = getEnabledProcessors;
  }

  register(processor) {
    if (!processor?.name) {
      throw new Error('El processor debe tener name');
    }

    this.processors.set(processor.name, processor);

    if (!this.order.includes(processor.name)) {
      this.order.push(processor.name);
    }

    return processor;
  }

  unregister(name) {
    this.processors.delete(name);
    this.order = this.order.filter((entry) => entry !== name);
  }

  get(name) {
    return this.processors.get(name);
  }

  getAll() {
    return this.order
      .filter((name) => this.processors.has(name))
      .map((name) => this.processors.get(name));
  }

  getActiveProcessors() {
    const enabled = new Set(this.getEnabledProcessors());

    return this.order
      .filter((name) => enabled.has(name) && this.processors.has(name))
      .map((name) => this.processors.get(name));
  }

  isEnabled(name) {
    return this.getEnabledProcessors().includes(name);
  }

  setEnabledResolver(getEnabledProcessors) {
    this.getEnabledProcessors = getEnabledProcessors;
  }
}

export function bootstrapDefaultProcessors(registry, {
  tagProcessor,
  folderProcessor,
} = {}) {
  registry.register(new LiveProcessor());

  if (tagProcessor) {
    registry.register(tagProcessor);
  } else {
    registry.register(new TagProcessor());
  }

  if (folderProcessor) {
    registry.register(folderProcessor);
  } else {
    registry.register(new FolderProcessor());
  }

  return registry;
}

/** @deprecated Use ProcessorsRegistry + bootstrapDefaultProcessors */
export function createDefaultProcessors(deps) {
  const registry = new ProcessorsRegistry();
  bootstrapDefaultProcessors(registry, deps);
  return registry.getAll();
}

export const defaultProcessorFactories = {
  live: () => new LiveProcessor(),
  tag: (deps) => new TagProcessor(deps),
  folder: (deps) => new FolderProcessor(deps),
};
