const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL
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
    CHECK(last_status IN ('ok', 'dead', 'error', 'live', 'offline', 'unknown'))
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
        CHECK(last_status IN ${BOOKMARK_STATUS_CHECK})
    );

    INSERT INTO bookmarks_migrated (
      id, url, title, type, folder_id, thumbnail, created_at, last_checked, last_status
    )
    SELECT
      id, url, title, type, folder_id, thumbnail, created_at, last_checked, last_status
    FROM bookmarks;

    DROP TABLE bookmarks;
    ALTER TABLE bookmarks_migrated RENAME TO bookmarks;

    CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_id ON bookmarks(folder_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON bookmarks(type);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_last_status ON bookmarks(last_status);

    PRAGMA foreign_keys = ON;
  `);
}

export function runMigrations(db) {
  db.exec(SCHEMA_SQL);
  migrateBookmarkStatusConstraint(db);
}
