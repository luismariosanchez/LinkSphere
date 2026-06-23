export function inferProviderFromUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();

    if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
      return 'youtube';
    }

    if (hostname.includes('twitch.tv')) {
      return 'twitch';
    }

    return 'generic';
  } catch {
    return 'generic';
  }
}
