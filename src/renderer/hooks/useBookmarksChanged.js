import { useEffect } from 'react';
import { apiClient } from '../services/api.client.js';

export function useBookmarksChanged(onChanged) {
  useEffect(() => {
    return apiClient.bookmarksChanged.onChanged(onChanged);
  }, [onChanged]);
}
