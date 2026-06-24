import { buildBookmarkQueryParams } from '../../domain/bookmarks/bookmark-query-params.js';
import { enrichBookmarkCard, enrichBookmarkList } from '../../domain/bookmarks/bookmark-presenter.js';
import { buildDashboardGridQuery } from '../../domain/dashboard/dashboard-grid-query.js';

const NEWS_LIMIT = 12;
const BOOKMARKS_PAGE_SIZE = 50;

export class DashboardService {
  constructor({
    bookmarkCrudService,
    bookmarkQueryService,
    folderService,
    tagsRepo,
  }) {
    this.bookmarkCrudService = bookmarkCrudService;
    this.bookmarkQueryService = bookmarkQueryService;
    this.folderService = folderService;
    this.tagsRepo = tagsRepo;
  }

  async getData(input = {}) {
    const mode = input.mode ?? 'dashboard';
    const tags = this.tagsRepo.getAll();
    const folders = this.folderService.getAllFolders();
    const bookmarks = this.bookmarkCrudService.getAll();

    const base = {
      tags,
      folders,
      bookmarks,
      isEmpty: bookmarks.length === 0,
    };

    if (mode === 'bookmarks') {
      const filters = buildBookmarkQueryParams({
        search: input.search ?? '',
        folderId: input.folderId ?? 'all',
        tagId: input.tagId ?? '',
        type: input.type ?? 'all',
        favoriteFilter: input.favoriteFilter ?? 'all',
        pinnedFilter: input.pinnedFilter ?? 'all',
        sortBy: input.sortBy ?? 'title',
        offset: input.bookmarksOffset ?? 0,
        limit: input.bookmarksLimit ?? BOOKMARKS_PAGE_SIZE,
      });

      const page = this.bookmarkQueryService.queryBookmarks(filters);
      const enrichedItems = enrichBookmarkList(page.items, { tags, folders });

      return {
        ...base,
        bookmarksPage: {
          items: enrichedItems,
          total: page.total,
          hasMore: page.hasMore,
          offset: (input.bookmarksOffset ?? 0) + page.items.length,
        },
      };
    }

    const [newsData, pinnedFolders, gridResult] = await Promise.all([
      Promise.resolve(this.bookmarkQueryService.getLatestNewsEvents(NEWS_LIMIT)),
      Promise.resolve(this.folderService.getPinnedFolders()),
      this.bookmarkQueryService.queryBookmarks(buildDashboardGridQuery(input)),
    ]);

    const newsItems = newsData.map((item) => ({
      event: item.event,
      card: enrichBookmarkCard(item.bookmark, {
        tags,
        folders,
        folderName: item.folderName,
        lastEvent: item.event,
      }),
    }));

    const gridBookmarks = enrichBookmarkList(gridResult.items, { tags, folders });

    return {
      ...base,
      newsItems,
      pinnedFolders,
      gridBookmarks,
    };
  }
}
