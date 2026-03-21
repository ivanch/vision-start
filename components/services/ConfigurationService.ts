import { Config, Wallpaper } from '../../types';
import {
  addWallpaperToChromeStorageLocal,
  removeWallpaperFromChromeStorageLocal,
} from '../utils/StorageLocalManager';

const REQUIRED_LOCAL_STORAGE_KEYS = ['config', 'categories', 'userWallpapers', 'wallpaperState'] as const;
type RequiredLocalStorageKey = typeof REQUIRED_LOCAL_STORAGE_KEYS[number];

export const DEFAULT_CONFIG: Config = {
  title: 'Vision Start',
  currentWallpapers: ['Abstract'],
  wallpaperFrequency: '1d',
  wallpaperBlur: 0,
  wallpaperBrightness: 100,
  wallpaperOpacity: 100,
  titleSize: 'medium',
  alignment: 'middle',
  horizontalAlignment: 'middle',
  tileSize: 'medium',
  clock: {
    enabled: true,
    size: 'medium',
    font: 'Helvetica',
    format: 'h:mm A',
  },
  serverWidget: {
    enabled: false,
    pingFrequency: 15,
    servers: [],
  },
};

const safeParse = (value: string | null): unknown => {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toStorageString = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value);

export const ConfigurationService = {
  loadConfig(): Config {
    try {
      const stored = localStorage.getItem('config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('Error parsing config from localStorage', error);
    }
    return { ...DEFAULT_CONFIG };
  },

  saveConfig(config: Config): void {
    localStorage.setItem('config', JSON.stringify(config));
  },

  loadUserWallpapers(): Wallpaper[] {
    try {
      const stored = localStorage.getItem('userWallpapers');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  },

  saveUserWallpapers(wallpapers: Wallpaper[]): void {
    localStorage.setItem('userWallpapers', JSON.stringify(wallpapers));
  },

  async addWallpaper(name: string, url: string): Promise<Wallpaper> {
    const finalName = await addWallpaperToChromeStorageLocal(name, url);
    return { name: finalName };
  },

  async addWallpaperFile(file: File): Promise<Wallpaper> {
    return new Promise((resolve, reject) => {
      if (file.size > 4 * 1024 * 1024) {
        reject(new Error('File size exceeds 4MB. Please choose a smaller file.'));
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        if (base64.length > 4.5 * 1024 * 1024) {
          reject(new Error('The uploaded image is too large. Please choose a smaller file.'));
          return;
        }
        try {
          const finalName = await addWallpaperToChromeStorageLocal(file.name, base64);
          resolve({ name: finalName });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async deleteWallpaper(wallpaper: Wallpaper): Promise<void> {
    await removeWallpaperFromChromeStorageLocal(wallpaper.name);
  },

  exportConfig(): void {
    const exportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      requiredLocalStorageKeys: [...REQUIRED_LOCAL_STORAGE_KEYS],
      localStorage: REQUIRED_LOCAL_STORAGE_KEYS.reduce(
        (acc, key) => {
          acc[key] = safeParse(localStorage.getItem(key));
          return acc;
        },
        {} as Record<RequiredLocalStorageKey, unknown>,
      ),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vision-start-config-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async importConfig(file: File): Promise<{ config: Config; userWallpapers: Wallpaper[] }> {
    const fileContent = await file.text();
    const parsed = JSON.parse(fileContent);
    const localStorageData =
      parsed?.localStorage && typeof parsed.localStorage === 'object'
        ? parsed.localStorage
        : parsed;

    if (!localStorageData || typeof localStorageData !== 'object') {
      throw new Error('Invalid import file format.');
    }

    let importedAny = false;
    REQUIRED_LOCAL_STORAGE_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(localStorageData, key)) {
        const rawValue = (localStorageData as Record<string, unknown>)[key];
        localStorage.setItem(key, toStorageString(rawValue));
        importedAny = true;
      }
    });

    if (!importedAny) {
      throw new Error(`No required keys found. Expected: ${REQUIRED_LOCAL_STORAGE_KEYS.join(', ')}`);
    }

    const importedConfig = (localStorageData as Record<string, unknown>).config as Config;
    const importedUserWallpapers = (localStorageData as Record<string, unknown>)
      .userWallpapers as Wallpaper[];

    return {
      config: importedConfig || { ...DEFAULT_CONFIG },
      userWallpapers: Array.isArray(importedUserWallpapers) ? importedUserWallpapers : [],
    };
  },

  resetWallpaperState(): void {
    localStorage.setItem(
      'wallpaperState',
      JSON.stringify({
        lastWallpaperChange: new Date().toISOString(),
        currentIndex: 0,
      }),
    );
  },
};
