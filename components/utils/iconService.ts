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

async function getWebsiteIcon(rawUrl: string): Promise<string> {
  let targetUrl = rawUrl.trim();
  if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const response = await fetch(targetUrl);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const appleTouchIcon = doc.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
      const href = appleTouchIcon.getAttribute('href');
      if (href) {
        return new URL(href, targetUrl).href;
      }
    }

    const iconLink = doc.querySelector('link[rel="icon"][type="image/png"]') || doc.querySelector('link[rel="icon"]');
    if (iconLink) {
      const href = iconLink.getAttribute('href');
      if (href) {
        return new URL(href, targetUrl).href;
      }
    }
  } catch (error) {
    console.error('Error fetching and parsing HTML for icon:', error);
  }

  try {
    const hostname = new URL(targetUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
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

    try {
      const response = await fetch(iconUrl, { mode: 'cors' });
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
