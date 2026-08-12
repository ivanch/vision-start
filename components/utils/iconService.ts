import {
  checkChromeStorageLocalAvailable,
  getCachedIconFromChromeStorageLocal,
  removeCachedIconFromChromeStorageLocal,
  saveCachedIconToChromeStorageLocal,
} from './StorageLocalManager';

const MAX_CACHED_ICON_BYTES = 256 * 1024;
const MAX_RESOLVED_ICONS = 50;
const resolvedIconCache = new Map<string, string>();
const iconCacheLookups = new Map<string, Promise<string | null>>();
const iconCacheRequests = new Map<string, Promise<string | null>>();

const rememberResolvedIcon = (iconUrl: string, dataUrl: string): void => {
  resolvedIconCache.set(iconUrl, dataUrl);
  if (resolvedIconCache.size > MAX_RESOLVED_ICONS) {
    const oldest = resolvedIconCache.keys().next().value;
    if (oldest !== undefined) resolvedIconCache.delete(oldest);
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
  typeof value === 'string' && isDataUrl(value);

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

  const request = (async () => {
    const cachedIcon = await getCachedWebsiteIcon(iconUrl);
    if (cachedIcon) return cachedIcon;

    const fetchSource = getIconFetchSource(iconUrl);
    if (!fetchSource) return null;

    try {
      const response = await fetch(fetchSource);
      if (!response.ok || response.type === 'opaque') return null;

      const blob = await response.blob();
      const contentType = (blob.type || response.headers.get('content-type') || '')
        .split(';', 1)[0]
        .trim()
        .toLowerCase();
      if (!contentType.startsWith('image/') || blob.size === 0 || blob.size > MAX_CACHED_ICON_BYTES) {
        return null;
      }

      const dataUrl = await blobToDataUrl(blob);
      rememberResolvedIcon(iconUrl, dataUrl);
      await saveCachedIconToChromeStorageLocal(iconUrl, dataUrl);
      return dataUrl;
    } catch {
      return null;
    }
  })().finally(() => {
    iconCacheRequests.delete(iconUrl);
  });

  iconCacheRequests.set(iconUrl, request);
  return request;
}

async function removeCachedWebsiteIcon(iconUrl: string): Promise<void> {
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
