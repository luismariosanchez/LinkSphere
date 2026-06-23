import { FolderSuggestionService } from './folder-suggestion.service.js';

export class FolderService {
  constructor({ foldersRepo, folderSuggestionService }) {
    this.foldersRepo = foldersRepo;
    this.folderSuggestionService = folderSuggestionService ?? new FolderSuggestionService();
  }

  createFolder(input) {
    return this.foldersRepo.createFolder(input);
  }

  getFolders() {
    return this.foldersRepo.getFolders();
  }

  updateFolder(id, input) {
    return this.foldersRepo.updateFolder(id, input);
  }

  deleteFolder(id) {
    return this.foldersRepo.deleteFolder(id);
  }

  suggest(context) {
    return this.folderSuggestionService.suggest(context);
  }

  resolveSuggestedFolderId(context) {
    const { suggestedFolder } = this.folderSuggestionService.suggest(context);

    if (!suggestedFolder) {
      return null;
    }

    return this.foldersRepo.findOrCreateByName(suggestedFolder).id;
  }
}

export { FolderSuggestionService } from './folder-suggestion.service.js';
