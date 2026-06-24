export class GetFoldersViewDataUseCase {
  constructor({ foldersViewService }) {
    this.foldersViewService = foldersViewService;
  }

  execute(input) {
    return this.foldersViewService.getViewData(input);
  }
}
