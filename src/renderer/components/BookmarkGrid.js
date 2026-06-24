import { BookmarkList } from './BookmarkList.js';

export function BookmarkGrid({ items, bookmarks, onEdit, onOpen }) {
  const listItems = items ?? bookmarks?.map((bookmark) => ({ bookmark })) ?? [];

  return (
    <BookmarkList
      items={listItems}
      onEdit={onEdit}
      onOpen={onOpen}
    />
  );
}
