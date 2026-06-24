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

  getAllFolders() {
    return this.getFolders();
  }

  getFolderById(id) {
    return this.foldersRepo.getById(id);
  }

  getAllFoldersWithStats() {
    return this.foldersRepo.getAllWithStats();
  }

  getFolderStats(folderId) {
    return this.foldersRepo.getFolderStats(folderId);
  }

  getPinnedFolders() {
    return this.foldersRepo.getPinnedFolders();
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

    return this.resolveFolderIdByName(suggestedFolder);
  }

  resolveFolderIdByName(name) {
    const trimmed = String(name ?? '').trim();

    if (!trimmed) {
      return null;
    }

    return this.foldersRepo.findOrCreateByName(trimmed).id;
  }
}

export { FolderSuggestionService } from './folder-suggestion.service.js';
