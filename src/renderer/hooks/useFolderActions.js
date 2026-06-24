import { useCallback, useMemo } from 'react';
import { apiClient } from '../services/api.client.js';

export function useFolderActions({ onChanged, onDeleted } = {}) {
  const rename = useCallback(async (folder) => {
    const newName = window.prompt('Nuevo nombre:', folder.name);

    if (!newName) {
      return;
    }

    const trimmed = newName.trim();

    if (!trimmed || trimmed === folder.name) {
      return;
    }

    await apiClient.folders.update(folder.id, { name: trimmed });
    onChanged?.();
  }, [onChanged]);

  const togglePin = useCallback(async (folder) => {
    if (folder.pinOrder != null) {
      await apiClient.folders.update(folder.id, { pinOrder: null });
    } else {
      const pinned = await apiClient.folders.getPinned();
      const nextOrder = pinned.reduce(
        (max, item) => Math.max(max, item.pinOrder ?? 0),
        0,
      ) + 1;

      await apiClient.folders.update(folder.id, { pinOrder: nextOrder });
    }

    onChanged?.();
  }, [onChanged]);

  const remove = useCallback(async (folder) => {
    if (!window.confirm(`¿Eliminar carpeta "${folder.name}"? Los bookmarks quedarán sin carpeta.`)) {
      return;
    }

    await apiClient.folders.delete(folder.id);
    onDeleted?.(folder);
    onChanged?.();
  }, [onChanged, onDeleted]);

  return useMemo(() => ({
    rename,
    togglePin,
    delete: remove,
  }), [rename, togglePin, remove]);
}
