import Database from 'better-sqlite3';
import { runMigrations } from './migrations.js';

let instance = null;

export function getDatabase(dbPath, options = {}) {
  if (instance) {
    return instance;
  }

  const { readonly = false } = options;

  instance = new Database(dbPath, { readonly });
  instance.pragma('journal_mode = WAL');
  instance.pragma('foreign_keys = ON');
  runMigrations(instance);

  return instance;
}

export function closeDatabase() {
  if (instance) {
    instance.close();
    instance = null;
  }
}

export function isDatabaseOpen() {
  return instance !== null && instance.open;
}
