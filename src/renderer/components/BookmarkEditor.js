import { useEffect, useState } from 'react';
import { apiClient } from '../services/api.client.js';
import { getStatusLabel, getTypeLabel } from '../utils/bookmarks.js';
import { SuggestionChips } from './SuggestionChips.js';
import { TagSelector } from './TagSelector.js';

export function BookmarkEditor({
  bookmarkId,
  allTags,
  allFolders,
  onSaved,
  onClose,
  onTagCreated,
  onFolderCreated,
}) {
  const [bookmark, setBookmark] = useState(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [tagIds, setTagIds] = useState([]);
  const [folderId, setFolderId] = useState('');
  const [suggestedFolders, setSuggestedFolders] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!bookmarkId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.bookmarks.getWithState(bookmarkId);

        if (!cancelled && data) {
          setBookmark(data);
          setTitle(data.title ?? '');
          setUrl(data.url ?? '');
          setTagIds(data.tagIds ?? []);
          setFolderId(data.folderId ?? '');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? 'Error al cargar bookmark');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [bookmarkId]);

  useEffect(() => {
    if (!bookmark) {
      return;
    }

    const tagNames = tagIds
      .map((id) => allTags.find((tag) => tag.id === id)?.name)
      .filter(Boolean);

    const currentFolderName = allFolders.find((folder) => folder.id === folderId)?.name ?? '';

    void apiClient.suggestions.get({
      title,
      url,
      tagNames,
      currentFolderName,
      metadata: {
        type: bookmark.type,
        lastStatus: bookmark.lastStatus,
        extra: bookmark.state?.data ?? {},
      },
    }).then((result) => {
      setSuggestedFolders(result.suggestedFolders ?? []);
      setSuggestedTags(result.suggestedTags ?? []);
    });
  }, [bookmark, title, url, tagIds, folderId, allTags, allFolders]);

  async function handleApplyFolder(name) {
    setSaving(true);
    setError(null);

    try {
      const existing = allFolders.find(
        (folder) => folder.name.toLowerCase() === name.toLowerCase(),
      );

      if (existing) {
        setFolderId(existing.id);
        return;
      }

      const created = await apiClient.folders.create({ name });
      onFolderCreated?.(created);
      setFolderId(created.id);
    } catch (err) {
      setError(err?.message ?? 'Error al aplicar carpeta');
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyTag(name) {
    setSaving(true);
    setError(null);

    try {
      const existing = allTags.find(
        (tag) => tag.name.toLowerCase() === name.toLowerCase(),
      );

      if (existing) {
        if (!tagIds.includes(existing.id)) {
          setTagIds((current) => [...current, existing.id]);
        }
        return;
      }

      const created = await apiClient.tags.create({ name });
      onTagCreated?.(created);
      setTagIds((current) => [...current, created.id]);
    } catch (err) {
      setError(err?.message ?? 'Error al aplicar tag');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    setSaving(true);
    setError(null);

    try {
      await apiClient.bookmarks.update(bookmarkId, {
        title: title.trim(),
        url: url.trim(),
        tagIds,
        folderId: folderId || null,
      });
      onSaved?.();
      onClose?.();
    } catch (err) {
      setError(err?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (!bookmarkId) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal bookmark-editor"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="bookmark-editor-title"
      >
        <div className="modal__header">
          <h2 id="bookmark-editor-title">Editar bookmark</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {loading && <p className="muted">Cargando…</p>}
        {error && <p className="error">{error}</p>}

        {bookmark && !loading && (
          <form className="bookmark-editor__form" onSubmit={handleSave}>
            <label className="field">
              <span className="field__label">Título</span>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={saving}
                required
              />
            </label>

            <label className="field">
              <span className="field__label">URL</span>
              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                disabled={saving}
                required
              />
            </label>

            {(suggestedFolders.length > 0 || suggestedTags.length > 0) && (
              <div className="suggestions-panel">
                <SuggestionChips
                  label="Carpetas sugeridas"
                  items={suggestedFolders}
                  disabled={saving}
                  onSelect={(name) => void handleApplyFolder(name)}
                />
                <SuggestionChips
                  label="Tags sugeridos"
                  items={suggestedTags}
                  disabled={saving}
                  onSelect={(name) => void handleApplyTag(name)}
                />
              </div>
            )}

            <div className="field">
              <span className="field__label">Tags</span>
              <TagSelector
                allTags={allTags}
                selectedTagIds={tagIds}
                onChange={setTagIds}
                onTagCreated={onTagCreated}
                disabled={saving}
              />
            </div>

            <label className="field">
              <span className="field__label">Carpeta</span>
              <select
                value={folderId}
                onChange={(event) => setFolderId(event.target.value)}
                disabled={saving}
              >
                <option value="">Sin carpeta</option>
                {allFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="bookmark-editor__meta muted">
              <span>{getTypeLabel(bookmark.type)}</span>
              <span>{getStatusLabel(bookmark.lastStatus)}</span>
              {bookmark.lastChecked && (
                <span>Revisado: {new Date(bookmark.lastChecked).toLocaleString()}</span>
              )}
            </div>

            <div className="bookmark-editor__actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
