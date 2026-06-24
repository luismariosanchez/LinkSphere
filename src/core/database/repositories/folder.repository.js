import { generateId } from '../../../shared/utils/id.js';

function mapFolderRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    pinOrder: row.pin_order ?? null,
  };
}

export class FolderRepository {
  constructor(db) {
    this.db = db;
  }

  create(input) {
    const id = input.id ?? generateId();

    this.db
      .prepare(`
        INSERT INTO folders (id, name, parent_id, pin_order)
        VALUES (@id, @name, @parentId, @pinOrder)
      `)
      .run({
        id,
        name: input.name,
        parentId: input.parentId ?? null,
        pinOrder: input.pinOrder ?? null,
      });

    return this.getById(id);
  }

  getById(id) {
    const row = this.db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    return mapFolderRow(row);
  }

  getAll() {
    const rows = this.db.prepare('SELECT * FROM folders ORDER BY name ASC').all();
    return rows.map(mapFolderRow);
  }

  update(id, input) {
    const existing = this.getById(id);
    if (!existing) {
      return null;
    }

    const fields = [];
    const params = { id };

    if (input.name !== undefined) {
      fields.push('name = @name');
      params.name = input.name;
    }
    if (input.parentId !== undefined) {
      fields.push('parent_id = @parentId');
      params.parentId = input.parentId;
    }
    if (input.pinOrder !== undefined) {
      fields.push('pin_order = @pinOrder');
      params.pinOrder = input.pinOrder;
    }

    if (fields.length === 0) {
      return existing;
    }

    this.db
      .prepare(`UPDATE folders SET ${fields.join(', ')} WHERE id = @id`)
      .run(params);

    return this.getById(id);
  }

  delete(id) {
    const existing = this.getById(id);
    if (!existing) {
      return false;
    }

    this.db.prepare('DELETE FROM folders WHERE id = ?').run(id);
    return true;
  }

  getByName(name) {
    const row = this.db
      .prepare('SELECT * FROM folders WHERE LOWER(name) = LOWER(?)')
      .get(name);

    return mapFolderRow(row);
  }

  findOrCreateByName(name) {
    const existing = this.getByName(name);
    if (existing) {
      return existing;
    }

    return this.create({ name });
  }

  createFolder(input) {
    return this.create(input);
  }

  getFolders() {
    return this.getAll();
  }

  getPinnedFolders() {
    const rows = this.db
      .prepare(`
        SELECT * FROM folders
        WHERE pin_order IS NOT NULL
        ORDER BY pin_order ASC, name COLLATE NOCASE ASC
      `)
      .all();

    return rows.map(mapFolderRow);
  }

  #mapStatsRow(row) {
    return {
      bookmarkCount: row.bookmark_count ?? 0,
      favoritesCount: row.favorites_count ?? 0,
      pinnedCount: row.pin_order != null ? 1 : 0,
    };
  }

  getAllWithStats() {
    const rows = this.db
      .prepare(`
        SELECT
          f.id,
          f.name,
          f.parent_id,
          f.pin_order,
          COUNT(b.id) AS bookmark_count,
          COALESCE(SUM(CASE WHEN b.is_favorite = 1 THEN 1 ELSE 0 END), 0) AS favorites_count
        FROM folders f
        LEFT JOIN bookmarks b ON b.folder_id = f.id
        GROUP BY f.id
        ORDER BY f.name COLLATE NOCASE ASC
      `)
      .all();

    return rows.map((row) => ({
      ...mapFolderRow(row),
      stats: this.#mapStatsRow(row),
    }));
  }

  getFolderStats(folderId) {
    const folder = this.getById(folderId);

    if (!folder) {
      return null;
    }

    const row = this.db
      .prepare(`
        SELECT
          COUNT(b.id) AS bookmark_count,
          COALESCE(SUM(CASE WHEN b.is_favorite = 1 THEN 1 ELSE 0 END), 0) AS favorites_count
        FROM bookmarks b
        WHERE b.folder_id = @folderId
      `)
      .get({ folderId });

    return {
      folderId,
      bookmarkCount: row?.bookmark_count ?? 0,
      favoritesCount: row?.favorites_count ?? 0,
      pinnedCount: folder.pinOrder != null ? 1 : 0,
      isPinned: folder.pinOrder != null,
    };
  }

  updateFolder(id, input) {
    return this.update(id, input);
  }

  deleteFolder(id) {
    return this.delete(id);
  }
}
