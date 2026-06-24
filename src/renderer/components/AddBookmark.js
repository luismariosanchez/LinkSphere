import { useEffect, useState } from 'react';
import sendIcon from '../assets/icons/send_icon.svg';
import { apiClient } from '../services/api.client.js';

export function AddBookmark({ open, onClose, onCreated }) {
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = url.trim();
    if (!trimmed || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await apiClient.bookmarks.create({ url: trimmed });
      setUrl('');
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      setError(err?.message ?? 'Error al crear bookmark');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-bookmark-overlay" onClick={onClose}>
      <div className="add-bookmark-overlay__content" onClick={(event) => event.stopPropagation()}>
        <form className="add-bookmark-bar" onSubmit={handleSubmit}>
          <input
            type="url"
            className="add-bookmark-bar__input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Pega una URL…"
            disabled={submitting}
            autoFocus
          />
          <button
            type="submit"
            className="add-bookmark-bar__submit"
            disabled={submitting || !url.trim()}
            aria-label="Añadir bookmark"
          >
            <img src={sendIcon} alt="" className="add-bookmark-bar__icon" />
          </button>
        </form>
        {error && <p className="add-bookmark-overlay__error">{error}</p>}
      </div>
    </div>
  );
}
