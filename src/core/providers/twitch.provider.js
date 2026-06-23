import { BookmarkProvider } from './provider.interface.js';
import { detectTwitchStreamInfo } from './utils/live-detector.js';
import { fetchPageContent } from './utils/page-scraper.js';
import { buildStreamExtra, isSiteReachable } from './utils/stream-status.js';
import { normalizeUrl } from './utils/url.js';

const TWITCH_HOST_RE = /(?:^|\.)twitch\.tv$/i;

export class TwitchProvider extends BookmarkProvider {
  constructor() {
    super('twitch');
  }

  canHandle(url) {
    try {
      const parsed = new URL(normalizeUrl(url));
      return TWITCH_HOST_RE.test(parsed.hostname);
    } catch {
      return TWITCH_HOST_RE.test(url);
    }
  }

  async enrich(url) {
    const normalizedUrl = normalizeUrl(url);
    const page = await fetchPageContent(normalizedUrl);
    const { isStream, streamStatus } = detectTwitchStreamInfo(page.html, normalizedUrl);

    let title = page.title;
    let thumbnail = page.thumbnail;
    const lastStatus = page.lastStatus;

    try {
      const oembedUrl = `https://api.twitch.tv/v4/oembed?url=${encodeURIComponent(normalizedUrl)}`;
      const response = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'MarcadoresApp/0.1' },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        const data = await response.json();
        title = data.title ?? title;
        thumbnail = data.thumbnail_url ?? thumbnail;
      }
    } catch (error) {
      console.log('[TwitchProvider] oEmbed falló →', error.message);
    }

    console.log('Provider stream:', { isStream, streamStatus });

    return {
      title: title || normalizedUrl,
      thumbnail,
      type: 'twitch',
      url: normalizedUrl,
      lastStatus,
      extra: buildStreamExtra({
        isStream,
        streamStatus,
        siteReachable: isSiteReachable(lastStatus),
      }),
    };
  }
}
