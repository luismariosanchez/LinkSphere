import { generateId } from '../../../shared/utils/id.js';

function mapFolderRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
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
        INSERT INTO folders (id, name, parent_id)
        VALUES (@id, @name, @parentId)
      `)
      .run({
        id,
        name: input.name,
        parentId: input.parentId ?? null,
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

  updateFolder(id, input) {
    return this.update(id, input);
  }

  deleteFolder(id) {
    return this.delete(id);
  }
}
