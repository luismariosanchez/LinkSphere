import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DEFAULT_SETTINGS, normalizeSettings } from './settings.schema.js';

export class SettingsService {
  constructor({ getFilePath, onChange } = {}) {
    this.getFilePath = getFilePath;
    this.onChange = onChange;
    this.settings = { ...DEFAULT_SETTINGS };
    this.loaded = false;
  }

  #ensureLoaded() {
    if (this.loaded) {
      return;
    }

    const filePath = this.getFilePath();

    if (existsSync(filePath)) {
      try {
        const raw = JSON.parse(readFileSync(filePath, 'utf8'));
        this.settings = normalizeSettings(raw);
      } catch {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    } else {
      this.settings = { ...DEFAULT_SETTINGS };
      this.#persist();
    }

    this.loaded = true;
  }

  #persist() {
    const filePath = this.getFilePath();
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(this.settings, null, 2), 'utf8');
  }

  getAll() {
    this.#ensureLoaded();
    return { ...this.settings };
  }

  get(key) {
    this.#ensureLoaded();
    return this.settings[key];
  }

  isDebugMode() {
    return this.get('debugMode');
  }

  update(partial) {
    this.#ensureLoaded();
    this.settings = normalizeSettings({ ...this.settings, ...partial });
    this.#persist();
    this.onChange?.(this.getAll());
    return this.getAll();
  }
}
