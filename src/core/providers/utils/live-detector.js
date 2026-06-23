import { STREAM_STATUS } from '../../../shared/constants/stream.js';
import { isTwitchStreamUrl, isYouTubeStreamUrl } from './url.js';

function isYouTubeLiveHtml(html) {
  if (!html) {
    return false;
  }

  if (/\"liveBroadcastContent\"\s*:\s*\"live\"/i.test(html)) {
    return true;
  }

  if (/\"isLiveNow\"\s*:\s*true/i.test(html)) {
    return true;
  }

  return false;
}

export function detectYouTubeStreamInfo(html, url) {
  if (isYouTubeStreamUrl(url)) {
    return {
      isStream: true,
      streamStatus: isYouTubeLiveHtml(html) ? STREAM_STATUS.LIVE : STREAM_STATUS.OFFLINE,
    };
  }

  const broadcastMatch = html?.match(/"liveBroadcastContent"\s*:\s*"(\w+)"/i);
  if (broadcastMatch) {
    const value = broadcastMatch[1].toLowerCase();

    if (value === 'live') {
      return { isStream: true, streamStatus: STREAM_STATUS.LIVE };
    }

    if (value === 'upcoming') {
      return { isStream: true, streamStatus: STREAM_STATUS.OFFLINE };
    }

    if (value === 'none') {
      return { isStream: false, streamStatus: null };
    }
  }

  if (isYouTubeLiveHtml(html)) {
    return { isStream: true, streamStatus: STREAM_STATUS.LIVE };
  }

  return { isStream: false, streamStatus: null };
}

function isTwitchLiveHtml(html) {
  if (!html) {
    return false;
  }

  if (/\"isLiveBroadcast\"\s*:\s*true/i.test(html)) {
    return true;
  }

  if (/\"isStreamLive\"\s*:\s*true/i.test(html)) {
    return true;
  }

  return false;
}

export function detectTwitchStreamInfo(html, url) {
  if (!isTwitchStreamUrl(url)) {
    return { isStream: false, streamStatus: null };
  }

  return {
    isStream: true,
    streamStatus: isTwitchLiveHtml(html) ? STREAM_STATUS.LIVE : STREAM_STATUS.OFFLINE,
  };
}
