// TypeScript interface for window.chrome
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

export async function getCachedIconFromChromeStorageLocal(sourceUrl: string): Promise<string | null> {
  if (!checkChromeStorageLocalAvailable()) return null;

  return new Promise<string | null>((resolve) => {
    if (!window.chrome?.storage?.local) {
      resolve(null);
      return;
    }

    const key = getIconCacheKey(sourceUrl);
    window.chrome.storage.local.get([key], function (result: { [key: string]: string }) {
      if (window.chrome?.runtime?.lastError) {
        resolve(null);
        return;
      }
      resolve(result[key] || null);
    });
  });
}

export async function saveCachedIconToChromeStorageLocal(sourceUrl: string, dataUrl: string): Promise<boolean> {
  if (!checkChromeStorageLocalAvailable()) return false;

  return new Promise<boolean>((resolve) => {
    if (!window.chrome?.storage?.local) {
      resolve(false);
      return;
    }

    window.chrome.storage.local.set({ [getIconCacheKey(sourceUrl)]: dataUrl }, function () {
      resolve(!window.chrome?.runtime?.lastError);
    });
  });
}

export async function removeCachedIconFromChromeStorageLocal(sourceUrl: string): Promise<boolean> {
  if (!checkChromeStorageLocalAvailable()) return false;

  return new Promise<boolean>((resolve) => {
    if (!window.chrome?.storage?.local) {
      resolve(false);
      return;
    }

    window.chrome.storage.local.remove(getIconCacheKey(sourceUrl), function () {
      resolve(!window.chrome?.runtime?.lastError);
    });
  });
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
    finalName = finalName || parsedUrl.pathname.split('/').filter(Boolean).pop() || parsedUrl.hostname;
  }

  return new Promise<void>((resolve, reject) => {
    if (!window.chrome?.storage?.local) {
      reject(new Error('chrome.storage.local is not available'));
      return;
    }
    window.chrome.storage.local.set({ [finalName]: url }, function () {
      if (window.chrome?.runtime?.lastError) {
        reject(new Error(window.chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  }).then(() => finalName);
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
  return new Promise<string | null>((resolve, reject) => {
    if (window.chrome?.storage?.local) {
      window.chrome.storage.local.get([name], function (result: { [key: string]: string }) {
        if (window.chrome?.runtime?.lastError) {
          reject(new Error(window.chrome.runtime.lastError.message));
        } else {
          resolve(result[name] || null);
        }
      });
    } else {
      reject(new Error('chrome.storage.local is not available'));
    }
  });
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
  return new Promise<void>((resolve, reject) => {
    if (window.chrome?.storage?.local) {
      window.chrome.storage.local.remove(name, function () {
        if (window.chrome?.runtime?.lastError) {
          reject(new Error(window.chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    } else {
      reject(new Error('chrome.storage.local is not available'));
    }
  });
}
