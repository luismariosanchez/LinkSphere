const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  pin_order INTEGER
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'unknown'
    CHECK(type IN ('youtube', 'twitch', 'anime', 'generic', 'unknown')),
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  thumbnail TEXT,
  created_at TEXT NOT NULL,
  last_checked TEXT,
  last_status TEXT NOT NULL DEFAULT 'ok'
    CHECK(last_status IN ('ok', 'dead', 'error', 'live', 'offline', 'unknown')),
  is_favorite INTEGER NOT NULL DEFAULT 0,
  last_opened_at TEXT,
  open_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS bookmark_tags (
  bookmark_id TEXT NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (bookmark_id, tag_id)
);

CREATE TABLE IF NOT EXISTS bookmark_state (
  bookmark_id TEXT PRIMARY KEY REFERENCES bookmarks(id) ON DELETE CASCADE,
  data_json TEXT NOT NULL DEFAULT '{}',
  hash TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  bookmark_id TEXT NOT NULL REFERENCES bookmarks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_id ON bookmarks(folder_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON bookmarks(type);
CREATE INDEX IF NOT EXISTS idx_bookmarks_last_status ON bookmarks(last_status);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_events_bookmark_id ON events(bookmark_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag_id ON bookmark_tags(tag_id);
`;

const BOOKMARK_STATUS_CHECK = "('ok', 'dead', 'error', 'live', 'offline', 'unknown')";

function migrateBookmarkStatusConstraint(db) {
  const table = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'bookmarks'`)
    .get();

  if (!table?.sql || table.sql.includes("'unknown'")) {
    return;
  }

  db.exec(`
    PRAGMA foreign_keys = OFF;

    CREATE TABLE bookmarks_migrated (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'unknown'
        CHECK(type IN ('youtube', 'twitch', 'anime', 'generic', 'unknown')),
      folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      thumbnail TEXT,
      created_at TEXT NOT NULL,
      last_checked TEXT,
      last_status TEXT NOT NULL DEFAULT 'ok'
        CHECK(last_status IN ${BOOKMARK_STATUS_CHECK}),
      is_favorite INTEGER NOT NULL DEFAULT 0,
      last_opened_at TEXT,
      open_count INTEGER NOT NULL DEFAULT 0
    );

    INSERT INTO bookmarks_migrated (
      id, url, title, type, folder_id, thumbnail, created_at, last_checked, last_status,
      is_favorite, last_opened_at, open_count
    )
    SELECT
      id, url, title, type, folder_id, thumbnail, created_at, last_checked, last_status,
      0, NULL, 0
    FROM bookmarks;

    DROP TABLE bookmarks;
    ALTER TABLE bookmarks_migrated RENAME TO bookmarks;

    CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_id ON bookmarks(folder_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON bookmarks(type);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_last_status ON bookmarks(last_status);

    PRAGMA foreign_keys = ON;
  `);
}

function columnExists(db, table, column) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  return columns.some((entry) => entry.name === column);
}

function migrateBookmarkDashboardColumns(db) {
  if (!columnExists(db, 'bookmarks', 'is_favorite')) {
    db.exec('ALTER TABLE bookmarks ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0');
  }

  if (!columnExists(db, 'bookmarks', 'last_opened_at')) {
    db.exec('ALTER TABLE bookmarks ADD COLUMN last_opened_at TEXT');
  }

  if (!columnExists(db, 'bookmarks', 'open_count')) {
    db.exec('ALTER TABLE bookmarks ADD COLUMN open_count INTEGER NOT NULL DEFAULT 0');
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookmarks_is_favorite ON bookmarks(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_last_opened_at ON bookmarks(last_opened_at);
  `);
}

function migrateFolderPinColumn(db) {
  if (!columnExists(db, 'folders', 'pin_order')) {
    db.exec('ALTER TABLE folders ADD COLUMN pin_order INTEGER');
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_folders_pin_order ON folders(pin_order);
  `);

  if (columnExists(db, 'bookmarks', 'pin_order')) {
    db.exec('UPDATE bookmarks SET pin_order = NULL WHERE pin_order IS NOT NULL');
  }
}

function migrateEventTitleColumn(db) {
  if (!columnExists(db, 'events', 'title')) {
    db.exec('ALTER TABLE events ADD COLUMN title TEXT');
  }
}

export function runMigrations(db) {
  db.exec(SCHEMA_SQL);
  migrateBookmarkStatusConstraint(db);
  migrateBookmarkDashboardColumns(db);
  migrateFolderPinColumn(db);
  migrateEventTitleColumn(db);
}
