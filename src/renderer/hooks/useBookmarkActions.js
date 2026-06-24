import { useCallback, useMemo } from 'react';
import { apiClient } from '../services/api.client.js';

export function useBookmarkActions({ onEdit, onChanged }) {
  const edit = useCallback((bookmark) => {
    onEdit?.(bookmark);
  }, [onEdit]);

  const rescan = useCallback(async (bookmark) => {
    await apiClient.bookmarks.rescan(bookmark.id);
    onChanged?.();
  }, [onChanged]);

  const toggleFavorite = useCallback(async (bookmark) => {
    await apiClient.bookmarks.update(bookmark.id, {
      isFavorite: !bookmark.isFavorite,
    });
    onChanged?.();
  }, [onChanged]);

  const remove = useCallback(async (bookmark) => {
    if (!window.confirm(`¿Eliminar "${bookmark.title}"?`)) {
      return;
    }

    await apiClient.bookmarks.delete(bookmark.id);
    onChanged?.();
  }, [onChanged]);

  return useMemo(() => ({
    edit,
    rescan,
    toggleFavorite,
    delete: remove,
  }), [edit, rescan, toggleFavorite, remove]);
}
