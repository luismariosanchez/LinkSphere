export class GetFoldersUseCase {
  constructor({ folderService }) {
    this.folderService = folderService;
  }

  executeAll() {
    return this.folderService.getAllFolders();
  }

  executeAllWithStats() {
    return this.folderService.getAllFoldersWithStats();
  }

  executePinned() {
    return this.folderService.getPinnedFolders();
  }
}
