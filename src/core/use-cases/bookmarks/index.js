import { CreateBookmarkUseCase } from './create-bookmark.use-case.js';
import { UpdateBookmarkUseCase } from './update-bookmark.use-case.js';
import { DeleteBookmarkUseCase } from './delete-bookmark.use-case.js';
import { GetBookmarksUseCase } from './get-bookmarks.use-case.js';
import { GetFolderBookmarksUseCase } from './get-folder-bookmarks.use-case.js';
import { GetRecentBookmarksUseCase } from './get-recent-bookmarks.use-case.js';
import { GetFavoriteBookmarksUseCase } from './get-favorite-bookmarks.use-case.js';
import { RescanBookmarkUseCase } from './rescan-bookmark.use-case.js';
import { ImportBookmarksUseCase } from './import-bookmarks.use-case.js';
import { ExportBookmarksUseCase } from './export-bookmarks.use-case.js';
import { GetLatestBookmarkEventsUseCase } from './get-latest-events.use-case.js';
import { RecordBookmarkOpenUseCase } from './record-bookmark-open.use-case.js';
import { OpenBookmarkUseCase } from './open-bookmark.use-case.js';

export function createBookmarkUseCases({
  bookmarkService,
  bookmarkQueryService,
  bookmarkInteractionService,
}) {
  return {
    create: new CreateBookmarkUseCase({ bookmarkService }),
    update: new UpdateBookmarkUseCase({ bookmarkService }),
    delete: new DeleteBookmarkUseCase({ bookmarkService }),
    get: new GetBookmarksUseCase({ bookmarkService, bookmarkQueryService }),
    getByFolder: new GetFolderBookmarksUseCase({ bookmarkQueryService }),
    getRecent: new GetRecentBookmarksUseCase({ bookmarkQueryService }),
    getFavorites: new GetFavoriteBookmarksUseCase({ bookmarkQueryService }),
    rescan: new RescanBookmarkUseCase({ bookmarkInteractionService }),
    import: new ImportBookmarksUseCase({ bookmarkService }),
    export: new ExportBookmarksUseCase({ bookmarkService }),
    getLatestEvents: new GetLatestBookmarkEventsUseCase({ bookmarkQueryService }),
    recordOpen: new RecordBookmarkOpenUseCase({ bookmarkInteractionService }),
    open: new OpenBookmarkUseCase({ bookmarkInteractionService }),
  };
}

export {
  CreateBookmarkUseCase,
  UpdateBookmarkUseCase,
  DeleteBookmarkUseCase,
  GetBookmarksUseCase,
  GetFolderBookmarksUseCase,
  GetRecentBookmarksUseCase,
  GetFavoriteBookmarksUseCase,
  RescanBookmarkUseCase,
  ImportBookmarksUseCase,
  ExportBookmarksUseCase,
  GetLatestBookmarkEventsUseCase,
  RecordBookmarkOpenUseCase,
  OpenBookmarkUseCase,
};