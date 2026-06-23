export function resolveBookmarkStatus(metadata) {
  const lastStatus = metadata.lastStatus;
  const siteReachable = metadata.extra?.siteReachable !== false;

  if (lastStatus === 'error') {
    return 'error';
  }

  if (lastStatus === 'unknown') {
    return 'unknown';
  }

  if (lastStatus === 'dead' || !siteReachable) {
    return 'dead';
  }

  const streamStatus = extractStreamStatus(metadata);
  if (streamStatus) {
    return streamStatus;
  }

  return 'ok';
}

export function extractStreamStatus(metadata) {
  const extra = metadata.extra ?? {};
  if (!extra.isStream) {
    return null;
  }

  return extra.streamStatus ?? null;
}

export function isSiteReachable(lastStatus) {
  return lastStatus === 'ok' || lastStatus === 'unknown';
}

export function buildStreamExtra({ isStream, streamStatus, siteReachable, ...rest }) {
  return {
    ...rest,
    isStream,
    streamStatus: isStream ? streamStatus : null,
    siteReachable,
  };
}
