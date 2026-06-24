export function isProbableBookmarkUrl(value) {
  const trimmed = String(value ?? '').trim();

  if (!trimmed || /\s/.test(trimmed)) {
    return false;
  }

  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    const hostname = parsed.hostname;

    if (!hostname) {
      return false;
    }

    if (hostname === 'localhost') {
      return true;
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      return true;
    }

    if (!hostname.includes('.')) {
      return false;
    }

    const parts = hostname.split('.');
    const tld = parts.at(-1);

    return parts.length >= 2 && tld.length >= 2;
  } catch {
    return false;
  }
}
