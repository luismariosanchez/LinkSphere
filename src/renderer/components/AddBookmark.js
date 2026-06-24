import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import sendIcon from '../assets/icons/send_icon.svg';
import { apiClient } from '../services/api.client.js';

export function AddBookmark({ open, onClose, onCreated }) {
  const inputRef = useRef(null);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setUrl('');
    setError(null);

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 0);

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
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

  return createPortal(
    <div className="add-bookmark-overlay" onClick={onClose}>
      <div
        className="add-bookmark-overlay__content"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <form className="add-bookmark-bar" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            className="add-bookmark-bar__input"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Escribe o pega una URL…"
            disabled={submitting}
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
    </div>,
    document.body,
  );
}
