import { useCallback, useEffect, useRef, useState } from 'react';
import sendIcon from './assets/icons/send_icon.svg';
import { apiClient } from './services/api.client.js';
import { isProbableBookmarkUrl } from '@shared/utils/url.js';

const PREVIEW_DEBOUNCE_MS = 400;
const FOCUS_DELAY_MS = 120;
const IGNORE_KEYS_MS = 200;

function looksLikeUrl(value) {
  return isProbableBookmarkUrl(value);
}

async function resolveTagIds(tagInput, allTags) {
  if (!tagInput.trim()) {
    return [];
  }

  const names = tagInput
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const ids = [];

  for (const name of names) {
    let tag = allTags.find((item) => item.name.toLowerCase() === name.toLowerCase());

    if (!tag) {
      tag = await apiClient.tags.create({ name });
      allTags.push(tag);
    }

    ids.push(tag.id);
  }

  return ids;
}

export function QuickAddApp() {
  const inputRef = useRef(null);
  const tagsCacheRef = useRef([]);
  const previewRequestRef = useRef(0);
  const ignoreKeysUntilRef = useRef(0);

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [folderId, setFolderId] = useState('');
  const [folders, setFolders] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const resetState = useCallback(() => {
    setUrl('');
    setTitle('');
    setTags('');
    setFolderId('');
    setPreview(null);
    setPreviewLoading(false);
    setSubmitting(false);
    setError(null);
    previewRequestRef.current += 1;
  }, []);

  const loadInitialData = useCallback(async () => {
    const [{ clipboardUrl }, folderList, tagList] = await Promise.all([
      apiClient.quickAdd.getInitial(),
      apiClient.folders.getAll(),
      apiClient.tags.getAll(),
    ]);

    tagsCacheRef.current = tagList;
    setFolders(folderList);
    setUrl(clipboardUrl ?? '');
    setTitle('');
    setTags('');
    setFolderId('');
    setPreview(null);
    setPreviewLoading(Boolean(clipboardUrl));
    setSubmitting(false);
    setError(null);

    window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
      if (clipboardUrl) {
        inputRef.current?.select();
      }
    }, FOCUS_DELAY_MS);
  }, []);

  useEffect(() => {
    const unsubscribe = apiClient.quickAdd.onShown(() => {
      resetState();
      ignoreKeysUntilRef.current = Date.now() + IGNORE_KEYS_MS;
      void loadInitialData();
    });

    return unsubscribe;
  }, [loadInitialData, resetState]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        void apiClient.quickAdd.hide();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!looksLikeUrl(url)) {
      setPreview(null);
      setPreviewLoading(false);
      return undefined;
    }

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setPreviewLoading(true);
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const metadata = await apiClient.quickAdd.preview(url.trim());

        if (previewRequestRef.current !== requestId) {
          return;
        }

        setPreview(metadata);
        setTitle((current) => current || metadata.title || '');
      } catch (err) {
        if (previewRequestRef.current !== requestId) {
          return;
        }

        setPreview(null);
        setError(err?.message ?? 'No se pudo obtener la vista previa');
      } finally {
        if (previewRequestRef.current === requestId) {
          setPreviewLoading(false);
        }
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [url]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedUrl = url.trim();

    if (!trimmedUrl || submitting) {
      return;
    }

    if (!looksLikeUrl(trimmedUrl)) {
      setError('Introduce una URL válida');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const tagIds = await resolveTagIds(tags, [...tagsCacheRef.current]);
      tagsCacheRef.current = await apiClient.tags.getAll();

      await apiClient.bookmarks.create({
        url: trimmedUrl,
        title: title.trim() || undefined,
        tagIds,
        folderId: folderId || undefined,
      });

      await apiClient.quickAdd.hide();
    } catch (err) {
      setError(err?.message ?? 'Error al crear bookmark');
    } finally {
      setSubmitting(false);
    }
  }

  const hasUrl = looksLikeUrl(url);

  function handleClose() {
    void apiClient.quickAdd.hide();
  }

  function handleInputKeyDown(event) {
    if (Date.now() >= ignoreKeysUntilRef.current) {
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
    }
  }

  return (
    <div className="quick-add">
      <div
        className="quick-add__backdrop"
        onMouseDown={handleClose}
        aria-hidden="true"
      />
      <div
        className="quick-add__panel"
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <form className="quick-add__form" onSubmit={handleSubmit}>
          <div className="quick-add__bar">
            <input
              ref={inputRef}
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              className="quick-add__input"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Pega o escribe una URL…"
              disabled={submitting}
            />
            <button
              type="submit"
              className="quick-add__submit"
              disabled={submitting || !url.trim()}
              aria-label="Crear bookmark"
            >
              <img src={sendIcon} alt="" className="quick-add__submit-icon" />
            </button>
          </div>

          {hasUrl && (
            <div className="quick-add__details">
              {(preview || previewLoading) && (
                <div className="quick-add__preview">
                  {preview?.thumbnail ? (
                    <img
                      src={preview.thumbnail}
                      alt=""
                      className="quick-add__preview-thumb"
                    />
                  ) : (
                    <div className="quick-add__preview-thumb quick-add__preview-thumb--empty" />
                  )}
                  <div className="quick-add__preview-meta">
                    <span className="quick-add__preview-type">
                      {previewLoading ? 'Obteniendo metadata…' : preview?.type ?? 'web'}
                    </span>
                    <span className="quick-add__preview-title">
                      {preview?.title || 'Sin título'}
                    </span>
                  </div>
                </div>
              )}

              <label className="quick-add__field">
                <span className="quick-add__label">Título</span>
                <input
                  type="text"
                  className="quick-add__field-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Título del bookmark"
                  disabled={submitting}
                />
              </label>

              <label className="quick-add__field">
                <span className="quick-add__label">Tags</span>
                <input
                  type="text"
                  className="quick-add__field-input"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="Separados por comas (opcional)"
                  disabled={submitting}
                />
              </label>

              <label className="quick-add__field">
                <span className="quick-add__label">Carpeta</span>
                <select
                  className="quick-add__field-input quick-add__select"
                  value={folderId}
                  onChange={(event) => setFolderId(event.target.value)}
                  disabled={submitting}
                >
                  <option value="">Sin carpeta</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {error && <p className="quick-add__error">{error}</p>}

          <p className="quick-add__hint">
            <kbd>Enter</kbd> crear · <kbd>Esc</kbd> cerrar
          </p>
        </form>
      </div>
    </div>
  );
}
