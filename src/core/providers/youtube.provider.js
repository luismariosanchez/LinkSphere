import { BookmarkProvider } from './provider.interface.js';
import { detectYouTubeStreamInfo } from './utils/live-detector.js';
import { fetchPageContent } from './utils/page-scraper.js';
import { buildStreamExtra, isSiteReachable } from './utils/stream-status.js';
import { extractYouTubeVideoId, normalizeUrl } from './utils/url.js';

const YOUTUBE_HOST_RE = /(?:^|\.)youtube\.com$/i;
const YOUTU_BE_RE = /youtu\.be/i;

export class YouTubeProvider extends BookmarkProvider {
  constructor() {
    super('youtube');
  }

  canHandle(url) {
    try {
      const parsed = new URL(normalizeUrl(url));
      return YOUTUBE_HOST_RE.test(parsed.hostname) || YOUTU_BE_RE.test(parsed.hostname);
    } catch {
      return YOUTUBE_HOST_RE.test(url) || YOUTU_BE_RE.test(url);
    }
  }

  async enrich(url) {
    const normalizedUrl = normalizeUrl(url);
    const videoId = extractYouTubeVideoId(normalizedUrl);
    const page = await fetchPageContent(normalizedUrl);
    const { isStream, streamStatus } = detectYouTubeStreamInfo(page.html, normalizedUrl);

    let title = page.title;
    let thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : page.thumbnail;
    const lastStatus = page.lastStatus;

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
      const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(10000) });

      if (response.ok) {
        const data = await response.json();
        title = data.title ?? title;
        thumbnail = data.thumbnail_url ?? thumbnail;
      }
    } catch (error) {
      console.log('[YouTubeProvider] oEmbed falló →', error.message);
    }

    console.log('Provider stream:', { isStream, streamStatus });

    return {
      title: title || normalizedUrl,
      thumbnail,
      type: 'youtube',
      url: normalizedUrl,
      lastStatus,
      extra: buildStreamExtra({
        isStream,
        streamStatus,
        siteReachable: isSiteReachable(lastStatus),
        ...(videoId ? { videoId } : {}),
      }),
    };
  }
}
