import * as cheerio from 'cheerio';
import { fetchUrlWithHealthCheck } from '../utils/url-status.js';

const FAVICON_REL_VALUES = new Set(['icon', 'shortcut icon']);

function resolveAbsoluteUrl(href, baseUrl) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

export function extractFaviconCandidates(html, baseUrl) {
  if (!html) {
    return [];
  }

  const $ = cheerio.load(html);
  const candidates = [];
  const seen = new Set();

  $('link[rel][href]').each((_, element) => {
    const rel = ($(element).attr('rel') ?? '').trim().toLowerCase();

    if (!FAVICON_REL_VALUES.has(rel)) {
      return;
    }

    const href = $(element).attr('href')?.trim();

    if (!href) {
      return;
    }

    const absoluteUrl = resolveAbsoluteUrl(href, baseUrl);

    if (!absoluteUrl || seen.has(absoluteUrl)) {
      return;
    }

    seen.add(absoluteUrl);
    candidates.push(absoluteUrl);
  });

  return candidates;
}

export function buildDefaultFaviconUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

async function isFaviconReachable(faviconUrl) {
  const { response } = await fetchUrlWithHealthCheck(faviconUrl, { timeoutMs: 8000 });
  return Boolean(response?.ok);
}

export async function resolveFaviconThumbnail(url, html) {
  const candidates = [
    ...extractFaviconCandidates(html, url),
    buildDefaultFaviconUrl(url),
  ].filter(Boolean);

  const uniqueCandidates = [...new Set(candidates)];

  for (const candidate of uniqueCandidates) {
    try {
      if (await isFaviconReachable(candidate)) {
        return candidate;
      }
    } catch (error) {
      console.log('[favicon] error comprobando', candidate, '→', error.message);
    }
  }

  return null;
}
