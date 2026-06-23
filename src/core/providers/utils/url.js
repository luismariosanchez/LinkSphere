export function normalizeUrl(url) {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function extractYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }

    if (/youtube\.com$/i.test(parsed.hostname) || /youtube\.com$/i.test(parsed.hostname.replace(/^www\./, ''))) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }

      const embedMatch = parsed.pathname.match(/^\/embed\/([^/?]+)/);
      if (embedMatch) {
        return embedMatch[1];
      }

      const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shortsMatch) {
        return shortsMatch[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function isYouTubeStreamUrl(url) {
  try {
    const parsed = new URL(normalizeUrl(url));
    const path = parsed.pathname;

    if (/\/live\/?$/i.test(path)) {
      return true;
    }

    if (/\/@[^/]+\/live\/?$/i.test(path)) {
      return true;
    }

    if (/\/channel\/[^/]+\/live\/?$/i.test(path)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function isTwitchStreamUrl(url) {
  try {
    const parsed = new URL(normalizeUrl(url));
    const path = parsed.pathname;

    if (!path || path === '/') {
      return false;
    }

    if (/^\/(videos|clip|clips|directory|settings|downloads|inventory|p)\b/i.test(path)) {
      return false;
    }

    if (/^\/[^/]+\/?$/.test(path)) {
      return true;
    }

    if (/\/live\/?$/.test(path)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
