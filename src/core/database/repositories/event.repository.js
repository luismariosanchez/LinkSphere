import { generateId } from '../../../shared/utils/id.js';
import { nowIso, parseJson, toJson } from '../utils.js';

function mapEventRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    bookmarkId: row.bookmark_id,
    type: row.type,
    title: row.title ?? null,
    payload: parseJson(row.payload_json),
    createdAt: row.created_at,
  };
}

export class EventRepository {
  constructor(db) {
    this.db = db;
  }

  create(input) {
    const id = input.id ?? generateId();
    const createdAt = input.createdAt ?? nowIso();

    this.db
      .prepare(`
        INSERT INTO events (id, bookmark_id, type, title, payload_json, created_at)
        VALUES (@id, @bookmarkId, @type, @title, @payloadJson, @createdAt)
      `)
      .run({
        id,
        bookmarkId: input.bookmarkId,
        type: input.type,
        title: input.title ?? null,
        payloadJson: toJson(input.payload ?? {}),
        createdAt,
      });

    return this.getById(id);
  }

  getById(id) {
    const row = this.db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    return mapEventRow(row);
  }

  getAll() {
    const rows = this.db
      .prepare('SELECT * FROM events ORDER BY created_at DESC')
      .all();

    return rows.map(mapEventRow);
  }

  getLatest(limit = 20) {
    const rows = this.db
      .prepare(`
        SELECT * FROM events
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(limit);

    return rows.map(mapEventRow);
  }

  getLatestByTypes(types, limit = 20) {
    if (!types?.length) {
      return [];
    }

    const placeholders = types.map(() => '?').join(', ');
    const rows = this.db
      .prepare(`
        SELECT * FROM events
        WHERE type IN (${placeholders})
        ORDER BY created_at DESC
        LIMIT ?
      `)
      .all(...types, limit);

    return rows.map(mapEventRow);
  }

  update(id, input) {
    const existing = this.getById(id);
    if (!existing) {
      return null;
    }

    const fields = [];
    const params = { id };

    if (input.bookmarkId !== undefined) {
      fields.push('bookmark_id = @bookmarkId');
      params.bookmarkId = input.bookmarkId;
    }
    if (input.type !== undefined) {
      fields.push('type = @type');
      params.type = input.type;
    }
    if (input.title !== undefined) {
      fields.push('title = @title');
      params.title = input.title;
    }
    if (input.payload !== undefined) {
      fields.push('payload_json = @payloadJson');
      params.payloadJson = toJson(input.payload);
    }

    if (fields.length === 0) {
      return existing;
    }

    this.db
      .prepare(`UPDATE events SET ${fields.join(', ')} WHERE id = @id`)
      .run(params);

    return this.getById(id);
  }

  delete(id) {
    const existing = this.getById(id);
    if (!existing) {
      return false;
    }

    this.db.prepare('DELETE FROM events WHERE id = ?').run(id);
    return true;
  }

  getByBookmarkId(bookmarkId) {
    const rows = this.db
      .prepare(`
        SELECT * FROM events
        WHERE bookmark_id = ?
        ORDER BY created_at DESC
      `)
      .all(bookmarkId);

    return rows.map(mapEventRow);
  }

  pruneOldEvents(bookmarkId, maxCount = 3) {
    const rows = this.db
      .prepare(`
        SELECT id FROM events
        WHERE bookmark_id = ?
        ORDER BY created_at DESC
      `)
      .all(bookmarkId);

    if (rows.length <= maxCount) {
      return 0;
    }

    const deleteStmt = this.db.prepare('DELETE FROM events WHERE id = ?');
    const toDelete = rows.slice(maxCount);

    for (const row of toDelete) {
      deleteStmt.run(row.id);
    }

    return toDelete.length;
  }
}
