import { enrichBookmarkList } from '../../domain/bookmarks/bookmark-presenter.js';
import { filterAndSortFolders, getPinnedFolders } from '../../domain/folders/folder-list.js';

const BOOKMARKS_PAGE_SIZE = 50;

export class FoldersViewService {
  constructor({
    folderService,
    bookmarkQueryService,
    tagsRepo,
  }) {
    this.folderService = folderService;
    this.bookmarkQueryService = bookmarkQueryService;
    this.tagsRepo = tagsRepo;
  }

  async getViewData(input = {}) {
    const tags = this.tagsRepo.getAll();
    const folders = this.folderService.getAllFoldersWithStats();
    const pinnedFolders = getPinnedFolders(folders);
    const filteredFolders = filterAndSortFolders(folders, {
      search: input.search ?? '',
      sortBy: input.sortBy ?? 'name',
    });

    const result = {
      tags,
      folders,
      pinnedFolders,
      filteredFolders,
      folderDetail: null,
    };

    const activeFolderId = input.activeFolderId ?? null;

    if (!activeFolderId) {
      return result;
    }

    const folder = this.folderService.getFolderById(activeFolderId);

    if (!folder) {
      return {
        ...result,
        folderNotFound: true,
      };
    }

    const offset = input.bookmarksOffset ?? 0;
    const bookmarksResult = this.bookmarkQueryService.getBookmarksByFolder(activeFolderId, {
      offset,
      limit: input.bookmarksLimit ?? BOOKMARKS_PAGE_SIZE,
      sortBy: 'title',
      sortDir: 'asc',
      search: input.search?.trim() || undefined,
    });

    const enrichedItems = enrichBookmarkList(bookmarksResult.items, { tags, folders });

    result.folderDetail = {
      folder,
      bookmarksPage: {
        items: enrichedItems,
        total: bookmarksResult.total,
        hasMore: bookmarksResult.hasMore,
        offset: offset + bookmarksResult.items.length,
      },
    };

    return result;
  }
}
