import { useState } from 'react';
import { apiClient } from '../services/api.client.js';

export function QuickAddBookmark({ open, onClose, onCreated }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!open) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const bookmark = await apiClient.ingestion.ingest({
        url: url.trim(),
        title: title.trim() || undefined,
        source: 'manual',
      });

      setUrl('');
      setTitle('');
      onCreated?.(bookmark);
      onClose?.();
    } catch (err) {
      setError(err?.message ?? 'Error al guardar bookmark');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) {
      return;
    }

    setError(null);
    onClose?.();
  }

  return (
    <div className="modal-overlay quick-add-overlay" onClick={handleClose} role="presentation">
      <div
        className="modal quick-add-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="quick-add-title"
      >
        <div className="modal__header">
          <h2 id="quick-add-title">Quick Add Bookmark</h2>
          <button type="button" className="btn-icon" onClick={handleClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <p className="muted quick-add-modal__hint">Ctrl+Shift+A · Ingestion manual</p>

        {error && <p className="error">{error}</p>}

        <form className="quick-add-modal__form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field">
            <span className="field__label">URL</span>
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              disabled={saving}
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span className="field__label">Título (opcional)</span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
            />
          </label>

          <div className="quick-add-modal__actions">
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving || !url.trim()}>
              {saving ? 'Guardando…' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
