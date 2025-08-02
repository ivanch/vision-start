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

/**
 * Adds a new wallpaper to chrome.storage.local.
 * If the URL is fetchable, it will be stored as base64 and the name will be derived from the URL.
 * If the URL is not fetchable (e.g., CORS), it will be stored as a URL and the provided name will be used.
 * @param name Wallpaper name (string), used as a fallback.
 * @param url Wallpaper image URL (string) or base64 data URL.
 * @returns Promise<string> The name under which the wallpaper was stored.
 * @throws Error if chrome.storage.local is unavailable or if a name is not provided for a non-fetchable URL.
 */
export async function addWallpaperToChromeStorageLocal(name: string, url: string): Promise<string> {
  if (!checkChromeStorageLocalAvailable()) {
    throw new Error('chrome.storage.local is not available');
  }

  if (url.startsWith('data:')) {
    // This is a base64 encoded image from a file upload.
    // The name is the file name.
    return new Promise<void>((resolve, reject) => {
      if (window.chrome?.storage?.local) {
        window.chrome.storage.local.set({ [name]: url }, function () {
          if (window.chrome?.runtime?.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('chrome.storage.local is not available'));
      }
    }).then(() => name);
  }

  // This is a URL. Let's try to fetch it.
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image');
    const imageBlob = await response.blob();
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    // If successful, use the filename from URL as the name.
    const finalName = url.substring(url.lastIndexOf('/') + 1).replace(/[?#].*$/, '') || name;
    return new Promise<void>((resolve, reject) => {
      if (window.chrome?.storage?.local) {
        window.chrome.storage.local.set({ [finalName]: base64 }, function () {
          if (window.chrome?.runtime?.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('chrome.storage.local is not available'));
      }
    }).then(() => finalName);
  } catch (error) {
    // If fetch fails (e.g., CORS), store the URL directly with the user-provided name.
    console.warn('Could not fetch wallpaper, storing URL instead. Error:', error);
    if (!name) {
      throw new Error("A name for the wallpaper is required when the URL can't be accessed.");
    }
    return new Promise<void>((resolve, reject) => {
      if (window.chrome?.storage?.local) {
        window.chrome.storage.local.set({ [name]: url }, function () {
          if (window.chrome?.runtime?.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } else {
        reject(new Error('chrome.storage.local is not available'));
      }
    }).then(() => name);
  }
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