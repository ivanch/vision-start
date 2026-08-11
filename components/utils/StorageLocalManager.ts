// TypeScript interface for window.chrome
import { getFileNameFromUrl } from './urlUtils';

declare global {
  interface Window {
    chrome?: {
      storage?: {
        local?: {
          set: (items: object, callback?: () => void) => void;
          get: (keys: string[] | string, callback: (items: { [key: string]: string }) => void) => void;
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

export async function getCachedIconFromChromeStorageLocal(sourceUrl: string): Promise<string | null> {
  if (!checkChromeStorageLocalAvailable()) return null;
  try {
    const key = getIconCacheKey(sourceUrl);
    const result = await chromeLocalCall<StorageResult>((cb) =>
      window.chrome?.storage?.local?.get([key], cb),
    );
    return result[key] || null;
  } catch {
    return null;
  }
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

  await chromeLocalCall<void>((cb) =>
    window.chrome?.storage?.local?.set({ [finalName]: url }, cb),
  );
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
  return result[name] || null;
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