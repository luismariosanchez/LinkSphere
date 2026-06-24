import { generateId } from '../../../shared/utils/id.js';
import { buildBookmarkQuery } from '../../bookmarks/bookmark-query.js';
import { nowIso, parseJson, toJson } from '../utils.js';

function mapBookmarkRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    url: row.url,
    title: row.title,
    type: row.type,
    folderId: row.folder_id,
    thumbnail: row.thumbnail,
    createdAt: row.created_at,
    lastChecked: row.last_checked,
    lastStatus: row.last_status,
    isFavorite: Boolean(row.is_favorite),
    lastOpenedAt: row.last_opened_at ?? null,
    openCount: row.open_count ?? 0,
  };
}

export class BookmarkRepository {
  constructor(db) {
    this.db = db;
  }

  #getTagIds(bookmarkId) {
    const rows = this.db
      .prepare('SELECT tag_id FROM bookmark_tags WHERE bookmark_id = ?')
      .all(bookmarkId);

    return rows.map((row) => row.tag_id);
  }

  #attachTags(bookmark) {
    if (!bookmark) {
      return null;
    }

    return {
      ...bookmark,
      tagIds: this.#getTagIds(bookmark.id),
    };
  }

  #setTags(bookmarkId, tagIds = []) {
    const deleteStmt = this.db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?');
    const insertStmt = this.db.prepare(
      'INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
    );

    deleteStmt.run(bookmarkId);

    for (const tagId of tagIds) {
      insertStmt.run(bookmarkId, tagId);
    }
  }

  create(input) {
    const id = input.id ?? generateId();
    const createdAt = input.createdAt ?? nowIso();

    const insert = this.db.prepare(`
      INSERT INTO bookmarks (
        id, url, title, type, folder_id, thumbnail, created_at, last_checked, last_status,
        is_favorite, last_opened_at, open_count
      ) VALUES (
        @id, @url, @title, @type, @folderId, @thumbnail, @createdAt, @lastChecked, @lastStatus,
        @isFavorite, @lastOpenedAt, @openCount
      )
    `);

    const runCreate = this.db.transaction((data) => {
      insert.run({
        id: data.id,
        url: data.url,
        title: data.title,
        type: data.type ?? 'unknown',
        folderId: data.folderId ?? null,
        thumbnail: data.thumbnail ?? null,
        createdAt: data.createdAt,
        lastChecked: data.lastChecked ?? null,
        lastStatus: data.lastStatus ?? 'ok',
        isFavorite: data.isFavorite ? 1 : 0,
        lastOpenedAt: data.lastOpenedAt ?? null,
        openCount: data.openCount ?? 0,
      });

      if (data.tagIds?.length) {
        this.#setTags(data.id, data.tagIds);
      }

      if (data.state) {
        this.updateState(data.id, data.state);
      }
    });

    runCreate({ ...input, id, createdAt });

    return this.getById(id);
  }

  getById(id) {
    const row = this.db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
    return this.#attachTags(mapBookmarkRow(row));
  }

  getByUrl(url) {
    const row = this.db.prepare('SELECT * FROM bookmarks WHERE url = ?').get(url);
    return this.#attachTags(mapBookmarkRow(row));
  }

  getAll() {
    const rows = this.db.prepare('SELECT * FROM bookmarks ORDER BY created_at DESC').all();
    return rows.map((row) => this.#attachTags(mapBookmarkRow(row)));
  }

  getRecentBookmarks(limit = 10) {
    const rows = this.db
      .prepare(`
        SELECT * FROM bookmarks
        ORDER BY COALESCE(last_opened_at, created_at) DESC
        LIMIT ?
      `)
      .all(limit);

    return rows.map((row) => this.#attachTags(mapBookmarkRow(row)));
  }

  getFavoriteBookmarks() {
    const rows = this.db
      .prepare(`
        SELECT * FROM bookmarks
        WHERE is_favorite = 1
        ORDER BY created_at DESC
      `)
      .all();

    return rows.map((row) => this.#attachTags(mapBookmarkRow(row)));
  }

  getLiveBookmarks(limit = 20, statuses = ['live']) {
    if (!statuses?.length) {
      return [];
    }

    const placeholders = statuses.map(() => '?').join(', ');
    const rows = this.db
      .prepare(`
        SELECT DISTINCT b.*
        FROM bookmarks b
        LEFT JOIN bookmark_state bs ON bs.bookmark_id = b.id
        WHERE b.last_status IN (${placeholders})
           OR json_extract(bs.data_json, '$.streamStatus') = 'live'
        ORDER BY COALESCE(b.last_checked, b.created_at) DESC
        LIMIT ?
      `)
      .all(...statuses, limit);

    return rows.map((row) => this.#attachTags(mapBookmarkRow(row)));
  }

  queryBookmarks(filters = {}) {
    const { countSql, selectSql, params } = buildBookmarkQuery(filters);

    const totalRow = this.db.prepare(countSql).get(params);
    const total = totalRow?.total ?? 0;

    const rows = this.db.prepare(selectSql).all(params);
    const items = rows.map((row) => this.#attachTags(mapBookmarkRow(row)));

    return {
      items,
      total,
      offset: params.offset,
      limit: params.limit,
      hasMore: params.offset + items.length < total,
    };
  }

  recordOpen(id) {
    const existing = this.getById(id);

    if (!existing) {
      return null;
    }

    const openedAt = nowIso();

    this.db
      .prepare(`
        UPDATE bookmarks
        SET last_opened_at = @openedAt,
            open_count = open_count + 1
        WHERE id = @id
      `)
      .run({ id, openedAt });

    return this.getById(id);
  }

  update(id, input) {
    const existing = this.getById(id);
    if (!existing) {
      return null;
    }

    const fields = [];
    const params = { id };

    if (input.url !== undefined) {
      fields.push('url = @url');
      params.url = input.url;
    }
    if (input.title !== undefined) {
      fields.push('title = @title');
      params.title = input.title;
    }
    if (input.type !== undefined) {
      fields.push('type = @type');
      params.type = input.type;
    }
    if (input.folderId !== undefined) {
      fields.push('folder_id = @folderId');
      params.folderId = input.folderId;
    }
    if (input.thumbnail !== undefined) {
      fields.push('thumbnail = @thumbnail');
      params.thumbnail = input.thumbnail;
    }
    if (input.lastChecked !== undefined) {
      fields.push('last_checked = @lastChecked');
      params.lastChecked = input.lastChecked;
    }
    if (input.lastStatus !== undefined) {
      fields.push('last_status = @lastStatus');
      params.lastStatus = input.lastStatus;
    }
    if (input.isFavorite !== undefined) {
      fields.push('is_favorite = @isFavorite');
      params.isFavorite = input.isFavorite ? 1 : 0;
    }
    if (input.lastOpenedAt !== undefined) {
      fields.push('last_opened_at = @lastOpenedAt');
      params.lastOpenedAt = input.lastOpenedAt;
    }
    if (input.openCount !== undefined) {
      fields.push('open_count = @openCount');
      params.openCount = input.openCount;
    }

    const runUpdate = this.db.transaction(() => {
      if (fields.length > 0) {
        this.db
          .prepare(`UPDATE bookmarks SET ${fields.join(', ')} WHERE id = @id`)
          .run(params);
      }

      if (input.tagIds !== undefined) {
        this.#setTags(id, input.tagIds);
      }
    });

    runUpdate();

    return this.getById(id);
  }

  delete(id) {
    const existing = this.getById(id);
    if (!existing) {
      return false;
    }

    this.db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
    return true;
  }

  getWithState(id) {
    const row = this.db
      .prepare(`
        SELECT
          b.*,
          bs.data_json,
          bs.hash,
          bs.updated_at AS state_updated_at
        FROM bookmarks b
        LEFT JOIN bookmark_state bs ON bs.bookmark_id = b.id
        WHERE b.id = ?
      `)
      .get(id);

    if (!row) {
      return null;
    }

    const bookmark = this.#attachTags(mapBookmarkRow(row));

    return {
      ...bookmark,
      state: row.data_json === null || row.data_json === undefined
        ? null
        : {
            bookmarkId: row.id,
            data: parseJson(row.data_json),
            hash: row.hash,
            updatedAt: row.state_updated_at,
          },
    };
  }

  updateState(bookmarkId, input) {
    const bookmark = this.getById(bookmarkId);
    if (!bookmark) {
      return null;
    }

    const dataJson = toJson(input.data ?? input.dataJson ?? {});
    const hash = input.hash ?? '';
    const updatedAt = input.updatedAt ?? nowIso();

    this.db
      .prepare(`
        INSERT INTO bookmark_state (bookmark_id, data_json, hash, updated_at)
        VALUES (@bookmarkId, @dataJson, @hash, @updatedAt)
        ON CONFLICT(bookmark_id) DO UPDATE SET
          data_json = excluded.data_json,
          hash = excluded.hash,
          updated_at = excluded.updated_at
      `)
      .run({ bookmarkId, dataJson, hash, updatedAt });

    return this.getWithState(bookmarkId);
  }
}
