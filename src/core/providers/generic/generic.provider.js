import { BaseProvider } from '../base.provider.js';
import { scrapeMetaTags } from '../utils/meta-scraper.js';
import { isSiteReachable } from '../utils/stream-status.js';
import { normalizeUrl } from '../utils/url.js';

export class GenericProvider extends BaseProvider {
  constructor() {
    super('generic');
  }

  canHandle() {
    return true;
  }

  async enrich(url) {
    const normalizedUrl = normalizeUrl(url);
    const meta = await scrapeMetaTags(normalizedUrl);
    const lastStatus = meta.lastStatus ?? 'error';

    return {
      title: meta.title || normalizedUrl,
      thumbnail: meta.thumbnail,
      type: 'generic',
      url: normalizedUrl,
      lastStatus,
      extra: {
        siteReachable: isSiteReachable(lastStatus),
      },
    };
  }
}
