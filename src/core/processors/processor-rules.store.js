import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { debugLog } from '../config/debug.logger.js';

export class ProcessorRulesStore {
  constructor({
    processorName,
    defaultRulesPath,
    getPersistPath,
    normalize,
    legacyPersistPath = null,
  } = {}) {
    if (!defaultRulesPath) {
      throw new Error('ProcessorRulesStore requiere defaultRulesPath');
    }

    this.processorName = processorName;
    this.defaultRulesPath = defaultRulesPath;
    this.getPersistPath = getPersistPath;
    this.normalize = normalize;
    this.legacyPersistPath = legacyPersistPath;
    this.cache = null;
  }

  #migrateLegacy() {
    if (!this.legacyPersistPath) {
      return;
    }

    const targetPath = this.getPersistPath();

    if (existsSync(targetPath) || !existsSync(this.legacyPersistPath)) {
      return;
    }

    mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileSync(this.legacyPersistPath, targetPath);
    debugLog(`Migrated ${this.processorName} rules from legacy path`);
  }

  #ensureSeeded() {
    const targetPath = this.getPersistPath();
    this.#migrateLegacy();
    mkdirSync(path.dirname(targetPath), { recursive: true });

    if (!existsSync(targetPath)) {
      copyFileSync(this.defaultRulesPath, targetPath);
    }
  }

  readRaw() {
    this.#ensureSeeded();
    return JSON.parse(readFileSync(this.getPersistPath(), 'utf8'));
  }

  writeRaw(data) {
    this.#ensureSeeded();
    writeFileSync(this.getPersistPath(), JSON.stringify(data, null, 2), 'utf8');
    this.invalidateCache();
  }

  getNormalized() {
    if (!this.cache) {
      this.cache = this.normalize(this.readRaw());
      debugLog(`Loaded ${this.processorName} processor rules:`, this.cache);
    }

    return this.cache;
  }

  invalidateCache() {
    this.cache = null;
  }
}
