// TypeScript interface for window.chrome
import { getFileNameFromUrl } from './urlUtils';

declare global {
  interface Window {
    chrome?: {
      storage?: {
        local?: {
          set: (items: object, callback?: () => void) => void;
          get: (keys: string[] | string | null, callback: (items: { [key: string]: string }) => void) => void;
          getKeys?: (callback: (keys: string[]) => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
      };
      runtime?: {
        lastError?: { message: string };
      };
    };
  }
}

let isChromeStorageLocalAvailable: boolean | null = null;

const ICON_CACHE_KEY_PREFIX = 'vision-start:icon:';

const getIconCacheKey = (sourceUrl: string): string =>
  `${ICON_CACHE_KEY_PREFIX}${encodeURIComponent(sourceUrl)}`;

/**
 * Checks if chrome.storage.local is available and caches the result.
 */
export function checkChromeStorageLocalAvailable(): boolean {
  if (isChromeStorageLocalAvailable !== null) return isChromeStorageLocalAvailable;
  isChromeStorageLocalAvailable =
    typeof window !== 'undefined' &&
    typeof window.chrome !== 'undefined' &&
    typeof window.chrome.storage !== 'undefined' &&
    typeof window.chrome.storage.local !== 'undefined';
  return isChromeStorageLocalAvailable;
}

type StorageResult = { [key: string]: string };

const chromeLocalCall = <T>(
  operation: (callback: (result: T) => void) => void,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    if (!window.chrome?.storage?.local) {
      reject(new Error('chrome.storage.local is not available'));
      return;
    }
    operation((result) => {
      if (window.chrome?.runtime?.lastError) {
        reject(new Error(window.chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });

let pendingIconLookups: Map<string, ((value: string | null) => void)[]> | null = null;

const flushIconLookups = async (): Promise<void> => {
  const lookups = pendingIconLookups;
  pendingIconLookups = null;
  if (!lookups) return;
  let result: StorageResult = {};
  try {
    result = await chromeLocalCall<StorageResult>((cb) =>
      window.chrome?.storage?.local?.get([...lookups.keys()], cb),
    );
  } catch {
    result = {};
  }
  for (const [key, resolvers] of lookups) {
    const value = typeof result[key] === 'string' ? result[key] || null : null;
    resolvers.forEach(resolve => resolve(value));
  }
};

export function getCachedIconFromChromeStorageLocal(sourceUrl: string): Promise<string | null> {
  if (!checkChromeStorageLocalAvailable()) return Promise.resolve(null);
  return new Promise(resolve => {
    if (!pendingIconLookups) {
      pendingIconLookups = new Map();
      queueMicrotask(() => void flushIconLookups());
    }
    const key = getIconCacheKey(sourceUrl);
    pendingIconLookups.set(key, [...(pendingIconLookups.get(key) ?? []), resolve]);
  });
}

export async function saveCachedIconToChromeStorageLocal(sourceUrl: string, dataUrl: string): Promise<boolean> {
  if (!checkChromeStorageLocalAvailable()) return false;
  try {
    await chromeLocalCall<void>((cb) =>
      window.chrome?.storage?.local?.set({ [getIconCacheKey(sourceUrl)]: dataUrl }, cb),
    );
    return true;
  } catch {
    return false;
  }
}

export async function removeCachedIconFromChromeStorageLocal(sourceUrl: string): Promise<boolean> {
  if (!checkChromeStorageLocalAvailable()) return false;
  try {
    await chromeLocalCall<void>((cb) =>
      window.chrome?.storage?.local?.remove(getIconCacheKey(sourceUrl), cb),
    );
    return true;
  } catch {
    return false;
  }
}

export async function pruneCachedIconsFromChromeStorageLocal(keepSourceUrls: string[]): Promise<number> {
  if (!checkChromeStorageLocalAvailable()) return 0;
  try {
    const keep = new Set(keepSourceUrls.map(getIconCacheKey));
    const local = window.chrome?.storage?.local;
    const keys = local?.getKeys
      ? await chromeLocalCall<string[]>((cb) => local.getKeys?.(cb))
      : Object.keys(await chromeLocalCall<StorageResult>((cb) => local?.get(null, cb)));
    const stale = keys.filter(key => key.startsWith(ICON_CACHE_KEY_PREFIX) && !keep.has(key));
    if (stale.length === 0) return 0;
    await chromeLocalCall<void>((cb) =>
      window.chrome?.storage?.local?.remove(stale, cb),
    );
    return stale.length;
  } catch {
    return 0;
  }
}

/**
 * Adds a new wallpaper to chrome.storage.local.
 * File uploads are stored as base64 while remote wallpapers remain URLs.
 * @param name Wallpaper name (string), used as a fallback.
 * @param url Wallpaper image URL (string) or base64 data URL.
 * @returns Promise<string> The name under which the wallpaper was stored.
 * @throws Error if chrome.storage.local is unavailable or the wallpaper data is invalid.
 */
export async function addWallpaperToChromeStorageLocal(name: string, url: string): Promise<string> {
  if (!checkChromeStorageLocalAvailable()) {
    throw new Error('chrome.storage.local is not available');
  }

  let finalName = name.trim();
  if (url.startsWith('data:')) {
    if (!finalName) throw new Error('A name is required for an uploaded wallpaper.');
  } else {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error('Please enter a valid wallpaper URL.');
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Wallpaper URLs must use HTTP or HTTPS.');
    }
    finalName = finalName || getFileNameFromUrl(parsedUrl);
  }

  try {
    await chromeLocalCall<void>((cb) =>
      window.chrome?.storage?.local?.set({ [finalName]: url }, cb),
    );
  } catch (error) {
    if (error instanceof Error && /quota/i.test(error.message)) {
      throw new Error('Not enough extension storage for this wallpaper. Delete an uploaded wallpaper and try again.');
    }
    throw error;
  }
  return finalName;
}

/**
 * Gets a specific wallpaper from chrome.storage.local by name.
 * @param name Wallpaper name (string)
 * @returns Promise<string | null> (base64 string or null)
 * @throws Error if chrome.storage.local is unavailable
 */
export async function getWallpaperFromChromeStorageLocal(name: string): Promise<string | null> {
  if (!checkChromeStorageLocalAvailable()) {
    throw new Error('chrome.storage.local is not available');
  }
  const result = await chromeLocalCall<StorageResult>((cb) =>
    window.chrome?.storage?.local?.get([name], cb),
  );
  return typeof result[name] === 'string' ? result[name] || null : null;
}

/**
 * Removes a wallpaper from chrome.storage.local by name.
 * @param name Wallpaper name (string)
 * @returns Promise<void>
 * @throws Error if chrome.storage.local is unavailable
 */
export async function removeWallpaperFromChromeStorageLocal(name: string): Promise<void> {
  if (!checkChromeStorageLocalAvailable()) {
    throw new Error('chrome.storage.local is not available');
  }
  await chromeLocalCall<void>((cb) =>
    window.chrome?.storage?.local?.remove(name, cb),
  );
}
