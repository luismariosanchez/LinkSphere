export function getPinnedFolders(folders) {
  return folders.filter((folder) => folder.pinOrder != null);
}

export function filterAndSortFolders(folders, { search = '', sortBy = 'name' } = {}) {
  const normalized = search.trim().toLowerCase();

  let list = folders;

  if (normalized) {
    list = list.filter((folder) => folder.name.toLowerCase().includes(normalized));
  }

  return [...list].sort((a, b) => {
    if (sortBy === 'count') {
      const diff = (b.stats?.bookmarkCount ?? 0) - (a.stats?.bookmarkCount ?? 0);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    }

    return a.name.localeCompare(b.name);
  });
}
