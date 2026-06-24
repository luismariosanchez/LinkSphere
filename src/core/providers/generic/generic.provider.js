import { BaseProvider } from '../base.provider.js';
import { fetchPageContent } from '../utils/page-scraper.js';
import { isSiteReachable } from '../utils/stream-status.js';
import { normalizeUrl } from '../utils/url.js';
import { resolveFaviconThumbnail } from './favicon.js';

export class GenericProvider extends BaseProvider {
  constructor() {
    super('generic');
  }

  canHandle() {
    return true;
  }

  async enrich(url) {
    const normalizedUrl = normalizeUrl(url);
    const page = await fetchPageContent(normalizedUrl);
    const lastStatus = page.lastStatus ?? 'error';

    let thumbnail = page.thumbnail;

    if (!thumbnail) {
      thumbnail = await resolveFaviconThumbnail(normalizedUrl, page.html);
    }

    return {
      title: page.title || normalizedUrl,
      thumbnail,
      type: 'generic',
      url: normalizedUrl,
      lastStatus,
      extra: {
        siteReachable: isSiteReachable(lastStatus),
      },
    };
  }
}
