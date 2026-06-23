/**
 * @typedef {Object} ProcessorOutput
 * @property {string[]} [tags]
 * @property {string} [folder]
 * @property {number} [priority]
 * @property {object} [metadata]
 */

/**
 * @typedef {Object} PipelineResult
 * @property {string[]} tags
 * @property {string[]} folders
 * @property {string|null} folder
 * @property {object} metadata
 */

export class BaseProcessor {
  constructor(name, { priority = 0 } = {}) {
    this.name = name;
    this.priority = priority;
  }

  /**
   * @param {object} bookmark
   * @returns {ProcessorOutput}
   */
  run(_bookmark) {
    throw new Error(`${this.name}: run() must be implemented`);
  }

  /** @deprecated Use run() — kept for plugin compatibility */
  process(bookmark) {
    return this.run(bookmark);
  }
}
