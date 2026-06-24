import { EVENT_TYPES } from '../../shared/constants/events.js';
import { STREAM_STATUS } from '../../shared/constants/stream.js';

function buildPayload({ oldValue, newValue, url, timestamp = Date.now() }) {
  return { oldValue, newValue, url, timestamp };
}

function snapshotFromMetadata(metadata) {
  const extra = metadata.extra ?? {};

  return {
    title: metadata.title,
    thumbnail: metadata.thumbnail,
    type: metadata.type,
    isStream: Boolean(extra.isStream),
    streamStatus: extra.streamStatus ?? null,
  };
}

export function detectBookmarkEvents({ before, metadata, url, isNew = false }) {
  const events = [];
  const timestamp = Date.now();
  const prevState = before?.state?.data ?? null;
  const nextState = metadata.extra ?? null;
  const prevStreamStatus = prevState?.isStream ? (prevState.streamStatus ?? null) : null;
  const nextStreamStatus = nextState?.isStream ? (nextState.streamStatus ?? null) : null;

  console.log('Previous streamStatus:', prevStreamStatus);
  console.log('New streamStatus:', nextStreamStatus);
  console.log('Live state changed:', prevStreamStatus !== nextStreamStatus);

  if (isNew) {
    events.push({
      type: EVENT_TYPES.NEW_BOOKMARK,
      payload: buildPayload({
        oldValue: null,
        newValue: snapshotFromMetadata(metadata),
        url,
        timestamp,
      }),
    });
    return events;
  }

  if (before.title !== metadata.title) {
    events.push({
      type: EVENT_TYPES.TITLE_CHANGED,
      payload: buildPayload({
        oldValue: before.title,
        newValue: metadata.title,
        url,
        timestamp,
      }),
    });
  }

  if (before.thumbnail !== metadata.thumbnail) {
    events.push({
      type: EVENT_TYPES.THUMBNAIL_CHANGED,
      payload: buildPayload({
        oldValue: before.thumbnail,
        newValue: metadata.thumbnail,
        url,
        timestamp,
      }),
    });
  }

  if (before.type !== metadata.type) {
    events.push({
      type: EVENT_TYPES.TYPE_DETECTED,
      payload: buildPayload({
        oldValue: before.type,
        newValue: metadata.type,
        url,
        timestamp,
      }),
    });
  }

  const prevVideoId = prevState?.videoId ?? null;
  const nextVideoId = nextState?.videoId ?? null;
  if (prevVideoId && nextVideoId && prevVideoId !== nextVideoId) {
    events.push({
      type: EVENT_TYPES.YOUTUBE_NEW_VIDEO,
      payload: buildPayload({
        oldValue: prevVideoId,
        newValue: nextVideoId,
        url,
        timestamp,
      }),
    });
  }

  if (prevStreamStatus !== STREAM_STATUS.LIVE && nextStreamStatus === STREAM_STATUS.LIVE) {
    events.push({
      type: EVENT_TYPES.LIVE_STARTED,
      payload: buildPayload({
        oldValue: prevStreamStatus,
        newValue: STREAM_STATUS.LIVE,
        url,
        timestamp,
      }),
    });
  }

  if (prevStreamStatus === STREAM_STATUS.LIVE && nextStreamStatus === STREAM_STATUS.OFFLINE) {
    events.push({
      type: EVENT_TYPES.LIVE_ENDED,
      payload: buildPayload({
        oldValue: STREAM_STATUS.LIVE,
        newValue: STREAM_STATUS.OFFLINE,
        url,
        timestamp,
      }),
    });
  }

  const prevReachable = prevState?.siteReachable ?? (
    before.lastStatus === 'ok'
    || before.lastStatus === 'live'
    || before.lastStatus === 'offline'
    || before.lastStatus === 'unknown'
  );
  const nextReachable = nextState?.siteReachable ?? (
    metadata.lastStatus === 'ok'
    || metadata.lastStatus === 'live'
    || metadata.lastStatus === 'offline'
    || metadata.lastStatus === 'unknown'
  );
  if (prevReachable && !nextReachable) {
    events.push({
      type: EVENT_TYPES.SITE_DOWN,
      payload: buildPayload({
        oldValue: prevReachable,
        newValue: nextReachable,
        url,
        timestamp,
      }),
    });
  }
  if (!prevReachable && nextReachable) {
    events.push({
      type: EVENT_TYPES.SITE_UP,
      payload: buildPayload({
        oldValue: prevReachable,
        newValue: nextReachable,
        url,
        timestamp,
      }),
    });
  }

  return events;
}
