import {
  checkChromeStorageLocalAvailable,
  getCachedIconFromChromeStorageLocal,
  removeCachedIconFromChromeStorageLocal,
  saveCachedIconToChromeStorageLocal,
} from './StorageLocalManager';

const MAX_CACHED_ICON_BYTES = 256 * 1024;
const MAX_RESOLVED_ICONS = 50;
const MAX_RESOLVED_ICON_MEMORY = 2 * 1024 * 1024;
const MAX_CONCURRENT_ICON_REQUESTS = 4;
let resolvedIconBytes = 0;
let activeIconRequests = 0;
const iconRequestQueue: (() => void)[] = [];
const resolvedIconCache = new Map<string, string>();
const iconCacheLookups = new Map<string, Promise<string | null>>();
const iconCacheRequests = new Map<string, Promise<string | null>>();

const rememberResolvedIcon = (iconUrl: string, dataUrl: string): void => {
  resolvedIconBytes -= (resolvedIconCache.get(iconUrl)?.length ?? 0) * 2;
  resolvedIconCache.delete(iconUrl);
  resolvedIconCache.set(iconUrl, dataUrl);
  resolvedIconBytes += dataUrl.length * 2;
  while (resolvedIconCache.size > MAX_RESOLVED_ICONS || resolvedIconBytes > MAX_RESOLVED_ICON_MEMORY) {
    const oldest = resolvedIconCache.keys().next().value;
    if (oldest === undefined) break;
    resolvedIconBytes -= (resolvedIconCache.get(oldest)?.length ?? 0) * 2;
    resolvedIconCache.delete(oldest);
  }
};

const isDataUrl = (value: string): boolean => value.startsWith('data:');

const isCacheableIconUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidCachedIcon = (value: string | null): value is string =>
  typeof value === 'string' && value.startsWith('data:image/') && value.length <= Math.ceil(MAX_CACHED_ICON_BYTES * 4 / 3) + 256;

const readIconBlob = async (response: Response): Promise<Blob | null> => {
  const contentType = (response.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
  if (!contentType.startsWith('image/') || Number(response.headers.get('content-length')) > MAX_CACHED_ICON_BYTES || !response.body) {
    await response.body?.cancel();
    return null;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_CACHED_ICON_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value as Uint8Array<ArrayBuffer>);
    }
    return bytes > 0 ? new Blob(chunks, { type: contentType }) : null;
  } finally {
    reader.releaseLock();
  }
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not convert icon to a data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read icon data'));
    reader.readAsDataURL(blob);
  });

const TRUSTED_TLDS = new Set([
  'com',
  'org',
  'net',
  'gov',
  'edu',
  'io',
  'co',
  'dev',
  'app',
  'me',
  'ai',
  'info',
  'br',
  'uk',
  'de',
]);

const isTrustedTld = (hostname: string): boolean => {
  if (!hostname || !hostname.includes('.')) return false;
  const parts = hostname.toLowerCase().split('.');
  const lastPart = parts[parts.length - 1];
  return TRUSTED_TLDS.has(lastPart);
};

const getIconFetchSource = (iconUrl: string): string | null => {
  try {
    const url = new URL(iconUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (
      (url.hostname === 'www.google.com' || url.hostname === 'google.com') &&
      url.pathname.startsWith('/s2/favicons')
    ) {
      const domain = url.searchParams.get('domain');
      if (domain) {
        let cleanHost = domain.trim().replace(/^https?:\/\//i, '');
        try {
          cleanHost = new URL(`https://${cleanHost}`).hostname;
        } catch {
          // ignore parsing error
        }
        if (cleanHost && isTrustedTld(cleanHost)) {
          return `https://icon.horse/icon/${encodeURIComponent(cleanHost)}`;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
};

async function getWebsiteIcon(rawUrl: string): Promise<string> {
  const trimmed = rawUrl.trim();
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const targetUrl = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(targetUrl);
    if (!isTrustedTld(parsed.hostname)) {
      if (!hasProtocol) {
        return `http://${parsed.host}/favicon.ico`;
      }
      return `${parsed.origin}/favicon.ico`;
    }
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(rawUrl)}&sz=128`;
  }
}

async function getCachedWebsiteIcon(iconUrl: string): Promise<string | null> {
  if (isDataUrl(iconUrl)) return iconUrl;

  const inMemoryIcon = resolvedIconCache.get(iconUrl);
  if (inMemoryIcon) return inMemoryIcon;
  if (!isCacheableIconUrl(iconUrl) || !checkChromeStorageLocalAvailable()) return null;

  const existingLookup = iconCacheLookups.get(iconUrl);
  if (existingLookup) return existingLookup;

  const lookup = getCachedIconFromChromeStorageLocal(iconUrl)
    .then((cachedIcon) => {
      if (isValidCachedIcon(cachedIcon)) {
        rememberResolvedIcon(iconUrl, cachedIcon);
        return cachedIcon;
      }
      if (cachedIcon) void removeCachedIconFromChromeStorageLocal(iconUrl);
      return null;
    })
    .catch(() => null)
    .finally(() => {
      iconCacheLookups.delete(iconUrl);
    });

  iconCacheLookups.set(iconUrl, lookup);
  return lookup;
}

async function cacheWebsiteIcon(iconUrl: string): Promise<string | null> {
  if (!isCacheableIconUrl(iconUrl) || !checkChromeStorageLocalAvailable()) return null;

  const inMemoryIcon = resolvedIconCache.get(iconUrl);
  if (inMemoryIcon) return inMemoryIcon;

  const existingRequest = iconCacheRequests.get(iconUrl);
  if (existingRequest) return existingRequest;
  if (iconCacheRequests.size >= MAX_RESOLVED_ICONS) return null;

  const request = (async () => {
    const cachedIcon = await getCachedWebsiteIcon(iconUrl);
    if (cachedIcon) return cachedIcon;

    const fetchSource = getIconFetchSource(iconUrl);
    if (!fetchSource) return null;

    if (activeIconRequests >= MAX_CONCURRENT_ICON_REQUESTS) {
      await new Promise<void>(resolve => iconRequestQueue.push(resolve));
    } else {
      activeIconRequests++;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(fetchSource, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok || response.type === 'opaque') return null;

      const blob = await readIconBlob(response);
      if (!blob) return null;

      const dataUrl = await blobToDataUrl(blob);
      rememberResolvedIcon(iconUrl, dataUrl);
      await saveCachedIconToChromeStorageLocal(iconUrl, dataUrl);
      return dataUrl;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
      controller.abort();
      const nextRequest = iconRequestQueue.shift();
      if (nextRequest) nextRequest();
      else activeIconRequests--;
    }
  })().finally(() => {
    iconCacheRequests.delete(iconUrl);
  });

  iconCacheRequests.set(iconUrl, request);
  return request;
}

async function removeCachedWebsiteIcon(iconUrl: string): Promise<void> {
  resolvedIconBytes -= (resolvedIconCache.get(iconUrl)?.length ?? 0) * 2;
  resolvedIconCache.delete(iconUrl);
  iconCacheLookups.delete(iconUrl);
  await removeCachedIconFromChromeStorageLocal(iconUrl);
}

export {
  cacheWebsiteIcon,
  getCachedWebsiteIcon,
  getWebsiteIcon,
  removeCachedWebsiteIcon,
};
