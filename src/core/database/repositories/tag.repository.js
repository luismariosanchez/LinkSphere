import { generateId } from '../../../shared/utils/id.js';

function mapTagRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
  };
}

export class TagRepository {
  constructor(db) {
    this.db = db;
  }

  create(input) {
    const id = input.id ?? generateId();

    this.db
      .prepare('INSERT INTO tags (id, name) VALUES (@id, @name)')
      .run({ id, name: input.name });

    return this.getById(id);
  }

  getById(id) {
    const row = this.db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    return mapTagRow(row);
  }

  getAll() {
    const rows = this.db.prepare('SELECT * FROM tags ORDER BY name ASC').all();
    return rows.map(mapTagRow);
  }

  update(id, input) {
    const existing = this.getById(id);
    if (!existing) {
      return null;
    }

    if (input.name === undefined) {
      return existing;
    }

    this.db
      .prepare('UPDATE tags SET name = @name WHERE id = @id')
      .run({ id, name: input.name });

    return this.getById(id);
  }

  delete(id) {
    const existing = this.getById(id);
    if (!existing) {
      return false;
    }

    this.db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return true;
  }

  getByBookmarkId(bookmarkId) {
    const rows = this.db
      .prepare(`
        SELECT t.*
        FROM tags t
        INNER JOIN bookmark_tags bt ON bt.tag_id = t.id
        WHERE bt.bookmark_id = ?
        ORDER BY t.name ASC
      `)
      .all(bookmarkId);

    return rows.map(mapTagRow);
  }

  getByName(name) {
    const row = this.db
      .prepare('SELECT * FROM tags WHERE LOWER(name) = LOWER(?)')
      .get(name);

    return mapTagRow(row);
  }

  findOrCreateByName(name) {
    const existing = this.getByName(name);
    if (existing) {
      return existing;
    }

    return this.create({ name });
  }
}
