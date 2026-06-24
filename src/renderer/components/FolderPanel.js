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

export function FolderPanel({
  open,
  onClose,
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

  if (!open) {
    return null;
  }

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

    if (!window.confirm(`¿Eliminar carpeta "${folder.name}"?`)) {
      return;
    }

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
    <div className="folder-panel">
      <div className="folder-panel__backdrop" onClick={onClose} />
      <aside className="folder-panel__drawer">
        <div className="folder-panel__header">
          <h2>Carpetas</h2>
          <button type="button" className="folder-panel__close" onClick={onClose}>×</button>
        </div>

        <button
          type="button"
          className="btn-secondary folder-panel__add"
          onClick={() => setShowCreate((value) => !value)}
        >
          {showCreate ? 'Cancelar' : '+ Nueva carpeta'}
        </button>

        {showCreate && (
          <form className="folder-panel__create" onSubmit={handleCreate}>
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nombre…"
              disabled={creating}
              autoFocus
            />
            <button type="submit" disabled={creating || !newName.trim()}>Crear</button>
          </form>
        )}

        {error && <p className="error">{error}</p>}

        <ul className="folder-panel__list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={
                  selectedFolderId === item.id
                    ? 'folder-panel__item folder-panel__item--active'
                    : 'folder-panel__item'
                }
                onClick={() => {
                  onSelectFolder?.(item.id);
                  onClose();
                }}
              >
                <span>{item.name}</span>
                <span className="folder-panel__count">{countBookmarks(bookmarks, item.id)}</span>
              </button>
              {item.deletable && (
                <button
                  type="button"
                  className="folder-panel__delete"
                  onClick={(event) => handleDelete(item, event)}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
