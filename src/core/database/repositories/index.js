import { BookmarkRepository } from './bookmark.repository.js';
import { FolderRepository } from './folder.repository.js';
import { TagRepository } from './tag.repository.js';
import { EventRepository } from './event.repository.js';

export {
  BookmarkRepository,
  FolderRepository,
  TagRepository,
  EventRepository,
};

export function createRepositories(db) {
  return {
    bookmarks: new BookmarkRepository(db),
    folders: new FolderRepository(db),
    tags: new TagRepository(db),
    events: new EventRepository(db),
  };
}
