export class ProcessorRulesService {
  constructor({ tagProcessor, folderProcessor, onChange } = {}) {
    this.tagProcessor = tagProcessor;
    this.folderProcessor = folderProcessor;
    this.onChange = onChange;
  }

  #processorFor(type) {
    if (type === 'tag') {
      return this.tagProcessor;
    }

    if (type === 'folder') {
      return this.folderProcessor;
    }

    throw new Error(`Tipo de reglas desconocido: ${type}`);
  }

  #notifyChange() {
    this.onChange?.();
  }

  getAll() {
    return {
      tagRules: this.tagProcessor.getKeywordRulesView(),
      folderRules: this.folderProcessor.getKeywordRulesView(),
    };
  }

  update(type, rules) {
    const processor = this.#processorFor(type);
    processor.updateKeywordRules(rules);
    this.#notifyChange();
    return this.getAll();
  }

  addRule(type, rule) {
    const processor = this.#processorFor(type);
    processor.addKeywordRule(rule);
    this.#notifyChange();
    return this.getAll();
  }

  updateRule(type, id, patch) {
    const processor = this.#processorFor(type);
    processor.updateKeywordRule(id, patch);
    this.#notifyChange();
    return this.getAll();
  }

  deleteRule(type, id) {
    const processor = this.#processorFor(type);
    processor.deleteKeywordRule(id);
    this.#notifyChange();
    return this.getAll();
  }
}
