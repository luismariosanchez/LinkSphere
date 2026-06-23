export class FolderSuggestionService {
  constructor({ folderProcessor } = {}) {
    this.folderProcessor = folderProcessor;
  }

  loadRules() {
    return this.folderProcessor.getRules();
  }

  reloadRules() {
    return this.folderProcessor.reloadRules();
  }

  suggest(context) {
    return this.folderProcessor.suggest(context);
  }
}
