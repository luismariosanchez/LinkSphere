import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_TAG_RULES_PATH = path.join(__dirname, 'tag.rules.json');
export const DEFAULT_FOLDER_RULES_PATH = path.join(__dirname, 'folder.rules.json');

export class RulesRepository {
  constructor({ getRulesDir } = {}) {
    this.getRulesDir = getRulesDir;
  }

  #tagPath() {
    return path.join(this.getRulesDir(), 'tag.rules.json');
  }

  #folderPath() {
    return path.join(this.getRulesDir(), 'folder.rules.json');
  }

  #ensureSeeded(targetPath, defaultPath) {
    mkdirSync(path.dirname(targetPath), { recursive: true });

    if (!existsSync(targetPath)) {
      copyFileSync(defaultPath, targetPath);
    }
  }

  readTagRulesRaw() {
    const filePath = this.#tagPath();
    this.#ensureSeeded(filePath, DEFAULT_TAG_RULES_PATH);
    return JSON.parse(readFileSync(filePath, 'utf8'));
  }

  writeTagRulesRaw(data) {
    const filePath = this.#tagPath();
    this.#ensureSeeded(filePath, DEFAULT_TAG_RULES_PATH);
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  readFolderRulesRaw() {
    const filePath = this.#folderPath();
    this.#ensureSeeded(filePath, DEFAULT_FOLDER_RULES_PATH);
    return JSON.parse(readFileSync(filePath, 'utf8'));
  }

  writeFolderRulesRaw(data) {
    const filePath = this.#folderPath();
    this.#ensureSeeded(filePath, DEFAULT_FOLDER_RULES_PATH);
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
