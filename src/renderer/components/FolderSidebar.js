import { useState } from 'react';
import { apiClient } from '../services/api.client.js';

function countBookmarks(bookmarks, folderId) {
  if (folderId === 'all') {
    return bookmarks.length;
  }

  if (folderId === 'none') {
    return bookmarks.filter((bookmark) => !bookmark.folderId).length;
  }

  return bookmarks.filter((bookmark) => bookmark.folderId === folderId).length;
}

export function FolderSidebar({
  folders,
  bookmarks,
  selectedFolderId,
  onSelectFolder,
  onFolderCreated,
  onFolderDeleted,
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate(event) {
    event.preventDefault();

    const name = newName.trim();
    if (!name) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const created = await apiClient.folders.create({ name });
      onFolderCreated?.(created);
      onSelectFolder?.(created.id);
      setNewName('');
      setShowCreate(false);
    } catch (err) {
      setError(err?.message ?? 'Error al crear carpeta');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(folder, event) {
    event.stopPropagation();

    if (!window.confirm(`¿Eliminar carpeta "${folder.name}"? Los bookmarks quedarán sin carpeta.`)) {
      return;
    }

    setError(null);

    try {
      await apiClient.folders.delete(folder.id);
      onFolderDeleted?.(folder.id);
      if (selectedFolderId === folder.id) {
        onSelectFolder?.('all');
      }
    } catch (err) {
      setError(err?.message ?? 'Error al eliminar carpeta');
    }
  }

  const items = [
    { id: 'all', name: 'Todos', deletable: false },
    { id: 'none', name: 'Sin carpeta', deletable: false },
    ...folders.map((folder) => ({ ...folder, deletable: true })),
  ];

  return (
    <aside className="folder-sidebar">
      <div className="folder-sidebar__header">
        <h2>Carpetas</h2>
        <button
          type="button"
          className="btn-secondary folder-sidebar__add"
          onClick={() => setShowCreate((value) => !value)}
        >
          {showCreate ? '×' : '+'}
        </button>
      </div>

      {showCreate && (
        <form className="folder-sidebar__create" onSubmit={handleCreate}>
          <input
            type="text"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Nombre…"
            disabled={creating}
            autoFocus
          />
          <button type="submit" disabled={creating || !newName.trim()}>
            Crear
          </button>
        </form>
      )}

      {error && <p className="error folder-sidebar__error">{error}</p>}

      <ul className="folder-sidebar__list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={
                selectedFolderId === item.id
                  ? 'folder-sidebar__item folder-sidebar__item--active'
                  : 'folder-sidebar__item'
              }
              onClick={() => onSelectFolder?.(item.id)}
            >
              <span className="folder-sidebar__name">{item.name}</span>
              <span className="folder-sidebar__count">
                {countBookmarks(bookmarks, item.id)}
              </span>
            </button>
            {item.deletable && (
              <button
                type="button"
                className="folder-sidebar__delete"
                onClick={(event) => handleDelete(item, event)}
                title="Eliminar carpeta"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
