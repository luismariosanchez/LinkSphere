import * as cheerio from 'cheerio';
import { fetchUrlWithHealthCheck, isResponseReadable } from './url-status.js';

export async function scrapeMetaTags(url) {
  const { response, lastStatus } = await fetchUrlWithHealthCheck(url);

  if (!response || !isResponseReadable(lastStatus)) {
    return { title: null, thumbnail: null, lastStatus };
  }

  try {
    const html = await response.text();
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content')?.trim()
      || $('meta[name="twitter:title"]').attr('content')?.trim()
      || $('title').text()?.trim()
      || null;

    const thumbnail =
      $('meta[property="og:image"]').attr('content')?.trim()
      || $('meta[name="twitter:image"]').attr('content')?.trim()
      || $('meta[name="twitter:image:src"]').attr('content')?.trim()
      || null;

    return { title, thumbnail, lastStatus };
  } catch (error) {
    console.log('[meta-scraper] error parseando', url, '→', error.message);
    return { title: null, thumbnail: null, lastStatus: lastStatus === 'ok' ? 'unknown' : lastStatus };
  }
}
