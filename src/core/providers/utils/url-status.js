export const FETCH_TIMEOUT_MS = 12000;
export const MAX_REDIRECTS = 10;

export const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
};

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export function classifyHttpStatus(statusCode) {
  if (statusCode >= 200 && statusCode < 300) {
    return 'ok';
  }

  if (REDIRECT_STATUSES.has(statusCode)) {
    return 'ok';
  }

  if (statusCode === 403 || statusCode === 429 || statusCode === 401) {
    return 'unknown';
  }

  if (statusCode === 404) {
    return 'dead';
  }

  if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
    return 'error';
  }

  if (statusCode >= 500) {
    return 'error';
  }

  if (statusCode >= 400) {
    return 'unknown';
  }

  return 'unknown';
}

export function classifyFetchError(error) {
  const message = String(error?.message ?? '').toLowerCase();
  const code = error?.cause?.code ?? error?.code ?? '';

  if (error?.name === 'TimeoutError' || message.includes('timeout') || message.includes('timed out')) {
    return 'dead';
  }

  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || message.includes('getaddrinfo')) {
    return 'dead';
  }

  if (['ECONNREFUSED', 'ECONNRESET', 'EHOSTUNREACH', 'ENETUNREACH', 'UND_ERR_CONNECT_TIMEOUT'].includes(code)) {
    return 'dead';
  }

  if (message.includes('certificate') || code === 'CERT_HAS_EXPIRED' || code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
    return 'unknown';
  }

  if (message.includes('fetch failed') || message.includes('network')) {
    return 'dead';
  }

  return 'dead';
}

function logHealthCheck({ url, redirectChain, finalStatusCode, lastStatus }) {
  console.log('URL:', url);
  console.log('Final status code:', finalStatusCode ?? 'N/A');
  console.log('Redirect chain:', redirectChain);
  console.log('Classification result:', lastStatus);
}

export async function fetchUrlWithHealthCheck(url, options = {}) {
  const redirectChain = [];
  let currentUrl = url;
  let response = null;
  let finalStatusCode = null;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      response = await fetch(currentUrl, {
        method: options.method ?? 'GET',
        headers: { ...DEFAULT_HEADERS, ...options.headers },
        redirect: 'manual',
        signal: AbortSignal.timeout(options.timeoutMs ?? FETCH_TIMEOUT_MS),
      });

      finalStatusCode = response.status;
      redirectChain.push({ url: currentUrl, status: response.status });

      if (REDIRECT_STATUSES.has(response.status)) {
        const location = response.headers.get('location');

        if (!location || hop >= MAX_REDIRECTS) {
          break;
        }

        currentUrl = new URL(location, currentUrl).href;
        continue;
      }

      break;
    }

    const lastStatus = classifyHttpStatus(finalStatusCode);
    logHealthCheck({ url, redirectChain, finalStatusCode, lastStatus });

    return {
      response,
      redirectChain,
      finalStatusCode,
      finalUrl: currentUrl,
      lastStatus,
    };
  } catch (error) {
    const lastStatus = classifyFetchError(error);
    logHealthCheck({ url, redirectChain, finalStatusCode: null, lastStatus });
    console.log('[url-status] fetch error:', error.message);

    return {
      response: null,
      redirectChain,
      finalStatusCode: null,
      finalUrl: currentUrl,
      lastStatus,
      error,
    };
  }
}

export function resolveStatusFromHttp(response) {
  if (!response) {
    return 'error';
  }

  return classifyHttpStatus(response.status);
}

export function isResponseReadable(status) {
  return status === 'ok' || status === 'unknown';
}

export async function checkUrlStatus(url) {
  const { lastStatus } = await fetchUrlWithHealthCheck(url);
  return lastStatus;
}
