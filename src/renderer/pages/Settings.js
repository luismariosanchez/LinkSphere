import { useCallback, useEffect, useState } from 'react';
import { RulesEditor } from '../components/RulesEditor.js';
import { apiClient } from '../services/api.client.js';

function ImportOverlay({ progress }) {
  const current = progress?.current ?? 0;
  const total = progress?.total ?? 0;
  const hasTotal = total > 0;

  return (
    <div className="import-overlay" role="status" aria-live="polite">
      <div className="import-overlay__panel">
        <p className="import-overlay__title">Importando bookmarks…</p>
        <p className="muted import-overlay__hint">
          Resolviendo metadata con providers. Puede tardar varios minutos.
        </p>
        {hasTotal && (
          <p className="import-overlay__progress">
            {current} / {total}
            {progress?.imported !== undefined && (
              <span className="muted"> · importados: {progress.imported}</span>
            )}
          </p>
        )}
        <div className="import-overlay__bar">
          <div
            className="import-overlay__bar-fill"
            style={{ width: hasTotal ? `${Math.round((current / total) * 100)}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
}

export function Settings({ onDataChanged }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(null);
  const [transferMessage, setTransferMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.settings.get();
      setSettings(data);
    } catch (err) {
      setError(err?.message ?? 'Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function handleExport() {
    setTransferLoading(true);
    setTransferMessage(null);
    setError(null);

    try {
      const result = await apiClient.bookmarks.exportToFile();

      if (result.canceled) {
        return;
      }

      setTransferMessage(`Exportados a ${result.filePath}`);
    } catch (err) {
      setError(err?.message ?? 'Error al exportar bookmarks');
    } finally {
      setTransferLoading(false);
    }
  }

  async function handleImport() {
    setTransferLoading(true);
    setImportProgress({ phase: 'start', current: 0, total: 0 });
    setTransferMessage(null);
    setError(null);

    const unsubscribe = apiClient.bookmarks.onImportProgress((progress) => {
      setImportProgress(progress);
    });

    try {
      const result = await apiClient.bookmarks.importFromFile();

      if (result.canceled) {
        return;
      }

      const errorCount = result.errors?.length ?? 0;
      setTransferMessage(
        `Importados: ${result.imported}, omitidos: ${result.skipped}, errores: ${errorCount}`,
      );
      onDataChanged?.();
    } catch (err) {
      setError(err?.message ?? 'Error al importar bookmarks');
    } finally {
      unsubscribe();
      setImportProgress(null);
      setTransferLoading(false);
    }
  }

  async function handleWipeData() {
    const confirmed = window.confirm(
      '¿Borrar todos los datos?\n\nSe eliminarán bookmarks, tags, carpetas y eventos. Esta acción no se puede deshacer.',
    );

    if (!confirmed) {
      return;
    }

    setTransferLoading(true);
    setTransferMessage(null);
    setError(null);

    try {
      await apiClient.app.wipeData();
      setTransferMessage('Todos los datos han sido eliminados.');
      onDataChanged?.();
    } catch (err) {
      setError(err?.message ?? 'Error al borrar datos');
    } finally {
      setTransferLoading(false);
    }
  }

  async function handleChange(partial) {
    setSaving(true);
    setError(null);

    try {
      const updated = await apiClient.settings.update(partial);
      setSettings(updated);
    } catch (err) {
      setError(err?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <main className="page page--settings">
        <p className="muted">Cargando configuración…</p>
      </main>
    );
  }

  const intervalMinutes = Math.round(settings.schedulerInterval / 60000);
  const isImporting = transferLoading && importProgress !== null;

  return (
    <main className="page page--settings">
      {isImporting && <ImportOverlay progress={importProgress} />}

      <header className="page__header">
        <div>
          <h1>Settings</h1>
          <p className="muted">Configuración global del sistema</p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="panel settings-panel">
        <label className="settings-row">
          <span>
            <strong>Modo debug</strong>
            <span className="muted settings-row__hint">Activa logs internos y event stream</span>
          </span>
          <input
            type="checkbox"
            checked={settings.debugMode}
            disabled={saving || transferLoading}
            onChange={(event) => void handleChange({ debugMode: event.target.checked })}
          />
        </label>

        <label className="settings-row">
          <span>
            <strong>Intervalo del scheduler (minutos)</strong>
            <span className="muted settings-row__hint">Frecuencia de revisión automática</span>
          </span>
          <input
            type="number"
            min={1}
            max={1440}
            value={intervalMinutes}
            disabled={saving || transferLoading}
            onChange={(event) => {
              const minutes = Number(event.target.value);
              if (minutes > 0) {
                void handleChange({ schedulerInterval: minutes * 60000 });
              }
            }}
          />
        </label>

        <label className="settings-row">
          <span>
            <strong>Auto-tagging</strong>
            <span className="muted settings-row__hint">Asignar tags automáticamente según reglas</span>
          </span>
          <input
            type="checkbox"
            checked={settings.autoTagging}
            disabled={saving || transferLoading}
            onChange={(event) => void handleChange({ autoTagging: event.target.checked })}
          />
        </label>

        <label className="settings-row">
          <span>
            <strong>Auto-refresh</strong>
            <span className="muted settings-row__hint">Revisar bookmarks en segundo plano</span>
          </span>
          <input
            type="checkbox"
            checked={settings.autoRefresh}
            disabled={saving || transferLoading}
            onChange={(event) => void handleChange({ autoRefresh: event.target.checked })}
          />
        </label>
      </section>

      <section className="panel settings-panel">
        <h2 className="settings-panel__title">Rules Editor</h2>
        <p className="muted settings-panel__desc">
          Define keywords para sugerir tags y carpetas al crear o editar bookmarks
        </p>

        <RulesEditor disabled={saving || transferLoading} />
      </section>

      <section className="panel settings-panel">
        <h2 className="settings-panel__title">Importar / Exportar</h2>
        <p className="muted settings-panel__desc">
          Formato HTML compatible con Chrome y Firefox
        </p>

        <div className="settings-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={transferLoading}
            onClick={() => void handleExport()}
          >
            {transferLoading && !isImporting ? 'Exportando…' : 'Exportar bookmarks'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={transferLoading}
            onClick={() => void handleImport()}
          >
            {isImporting ? 'Importando…' : 'Importar bookmarks'}
          </button>
        </div>

        {transferMessage && <p className="settings-transfer-msg">{transferMessage}</p>}
      </section>

      <section className="panel settings-panel settings-panel--danger">
        <h2 className="settings-panel__title">Zona peligrosa</h2>
        <p className="muted settings-panel__desc">
          Elimina todos los bookmarks, tags, carpetas y eventos de la base de datos
        </p>

        <div className="settings-actions">
          <button
            type="button"
            className="btn-danger"
            disabled={transferLoading}
            onClick={() => void handleWipeData()}
          >
            Borrar todos los datos
          </button>
        </div>
      </section>
    </main>
  );
}
