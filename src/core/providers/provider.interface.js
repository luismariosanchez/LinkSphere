export class BookmarkProvider {
  constructor(name) {
    this.name = name;
  }

  canHandle(_url) {
    throw new Error(`${this.name}: canHandle() no implementado`);
  }

  async enrich(_url) {
    throw new Error(`${this.name}: enrich() no implementado`);
  }
}
