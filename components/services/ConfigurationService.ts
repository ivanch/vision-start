import { Category, Config, Wallpaper } from '../../types';
import { DEFAULT_CATEGORIES } from '../../constants';
import { baseWallpapers } from '../utils/baseWallpapers';
import {
  addWallpaperToChromeStorageLocal,
  checkChromeStorageLocalAvailable,
  removeWallpaperFromChromeStorageLocal,
} from '../utils/StorageLocalManager';
import { getFileNameFromUrl } from '../utils/urlUtils';

const REQUIRED_LOCAL_STORAGE_KEYS = ['config', 'categories', 'userWallpapers', 'wallpaperState'] as const;
type RequiredLocalStorageKey = typeof REQUIRED_LOCAL_STORAGE_KEYS[number];

export const DEFAULT_CONFIG: Config = {
  title: 'Vision Start',
  currentWallpapers: ['Beach'],
  wallpaperFrequency: '1d',
  wallpaperBlur: 0,
  wallpaperBrightness: 108,
  wallpaperOpacity: 96,
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

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const deepMerge = <T>(base: T, stored: unknown): T => {
  if (isPlainObject(base)) {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    const storedObj = isPlainObject(stored) ? stored : {};
    for (const key of Object.keys(result)) {
      result[key] = deepMerge(result[key], Object.prototype.hasOwnProperty.call(storedObj, key) ? storedObj[key] : undefined);
    }
    return result as T;
  }
  if (Array.isArray(base)) {
    return [...(Array.isArray(stored) ? stored : base)] as T;
  }
  if (stored === null) return base;
  return typeof stored === typeof base ? (stored as T) : base;
};

const boundedNumber = (value: number, fallback: number, min: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

const choice = (value: string, values: string[], fallback: string): string =>
  values.includes(value) ? value : fallback;

const hasStrings = (value: unknown, keys: string[]): value is Record<string, string> =>
  isPlainObject(value) && keys.every(key => typeof value[key] === 'string');

export const normalizeConfig = (stored: unknown): Config => {
  const config = deepMerge(DEFAULT_CONFIG, stored);
  config.currentWallpapers = [...new Set(config.currentWallpapers.filter(name => typeof name === 'string' && name.length > 0))];
  config.wallpaperBlur = boundedNumber(config.wallpaperBlur, DEFAULT_CONFIG.wallpaperBlur, 0, 50);
  config.wallpaperBrightness = boundedNumber(config.wallpaperBrightness, DEFAULT_CONFIG.wallpaperBrightness, 0, 200);
  config.wallpaperOpacity = boundedNumber(config.wallpaperOpacity, DEFAULT_CONFIG.wallpaperOpacity, 1, 100);
  config.titleSize = choice(config.titleSize, ['tiny', 'small', 'medium', 'large'], DEFAULT_CONFIG.titleSize);
  config.tileSize = choice(config.tileSize || 'medium', ['small', 'medium', 'large'], 'medium');
  config.alignment = choice(config.alignment, ['top', 'middle', 'bottom'], DEFAULT_CONFIG.alignment);
  config.horizontalAlignment = choice(config.horizontalAlignment, ['left', 'middle', 'right'], DEFAULT_CONFIG.horizontalAlignment);
  config.clock.size = choice(config.clock.size, ['tiny', 'small', 'medium', 'large'], DEFAULT_CONFIG.clock.size);
  config.clock.format = choice(config.clock.format, ['HH:mm', 'h:mm A'], DEFAULT_CONFIG.clock.format);
  config.serverWidget.pingFrequency = boundedNumber(config.serverWidget.pingFrequency, DEFAULT_CONFIG.serverWidget.pingFrequency, 5, 60);
  const serverIds = new Set<string>();
  config.serverWidget.servers = config.serverWidget.servers.filter(server => {
    if (!hasStrings(server, ['id', 'name', 'address']) || !server.id || serverIds.has(server.id)) return false;
    serverIds.add(server.id);
    return true;
  }).map(server => ({ id: server.id, name: server.name, address: server.address }));
  return config;
};

export const normalizeCategories = (stored: unknown): Category[] => {
  if (!Array.isArray(stored)) return normalizeCategories(DEFAULT_CATEGORIES);
  const categoryIds = new Set<string>();
  const websiteIds = new Set<string>();
  return stored.flatMap(category => {
    if (!hasStrings(category, ['id', 'name']) || !category.id || categoryIds.has(category.id)) return [];
    categoryIds.add(category.id);
    const websites = isPlainObject(category) && Array.isArray(category.websites) ? category.websites : [];
    return [{
      id: category.id,
      name: category.name,
      websites: websites.flatMap(website => {
        if (!hasStrings(website, ['id', 'name', 'url']) || !website.id || websiteIds.has(website.id)) return [];
        websiteIds.add(website.id);
        return [{ id: website.id, name: website.name, url: website.url, icon: typeof website.icon === 'string' ? website.icon : '', categoryId: category.id }];
      }),
    }];
  });
};

export const normalizeUserWallpapers = (stored: unknown): Wallpaper[] => {
  if (!Array.isArray(stored)) return [];
  const names = new Set(baseWallpapers.map(wallpaper => wallpaper.name));
  return stored.flatMap(wallpaper => {
    if (!hasStrings(wallpaper, ['name']) || !wallpaper.name || names.has(wallpaper.name)) return [];
    names.add(wallpaper.name);
    return [{
      name: wallpaper.name,
      ...(typeof wallpaper.url === 'string' ? { url: wallpaper.url } : {}),
      ...(typeof wallpaper.base64 === 'string' ? { base64: wallpaper.base64 } : {}),
    }];
  });
};

const assertWallpaperNameAvailable = (name: string): void => {
  const names = [...baseWallpapers, ...ConfigurationService.loadUserWallpapers()];
  if (name.startsWith('vision-start:icon:') || names.some(wallpaper => wallpaper.name === name)) {
    throw new Error('A wallpaper with this name already exists or the name is reserved. Please choose a different name.');
  }
};

export const ConfigurationService = {
  loadConfig(): Config {
    try {
      const stored = localStorage.getItem('config');
      if (stored) {
        const parsed = JSON.parse(stored);
        return normalizeConfig(parsed);
      }
    } catch (error) {
      console.error('Error parsing config from localStorage', error);
    }
    return normalizeConfig(null);
  },

  saveConfig(config: Config): void {
    try {
      localStorage.setItem('config', JSON.stringify(config));
    } catch (error) {
      console.error('Error saving config to localStorage', error);
    }
  },

  loadCategories(): Category[] {
    try {
      return normalizeCategories(safeParse(localStorage.getItem('categories')));
    } catch (error) {
      console.error('Error reading categories from localStorage', error);
      return normalizeCategories(null);
    }
  },

  loadUserWallpapers(): Wallpaper[] {
    try {
      const stored = localStorage.getItem('userWallpapers');
      if (stored) return normalizeUserWallpapers(JSON.parse(stored));
    } catch {
    }
    return [];
  },

  saveUserWallpapers(wallpapers: Wallpaper[]): void {
    localStorage.setItem('userWallpapers', JSON.stringify(wallpapers));
  },

  async addWallpaper(name: string, url: string): Promise<Wallpaper> {
    const trimmedUrl = url.trim();
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      throw new Error('Please enter a valid wallpaper URL.');
    }
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Wallpaper URLs must use HTTP or HTTPS.');
    }
    const finalName = name.trim() || getFileNameFromUrl(parsedUrl) || 'Wallpaper';
    assertWallpaperNameAvailable(finalName);
    return { name: finalName, url: parsedUrl.href };
  },

  async addWallpaperFile(file: File): Promise<Wallpaper> {
    if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
    assertWallpaperNameAvailable(file.name.trim());
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
          assertWallpaperNameAvailable(file.name.trim());
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
    if (wallpaper.url || wallpaper.base64 || !checkChromeStorageLocalAvailable()) return;
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
    if (file.size > 10 * 1024 * 1024) throw new Error('Configuration files must be no larger than 10MB.');
    const fileContent = await file.text();
    const parsed = JSON.parse(fileContent);
    const localStorageData =
      parsed?.localStorage && typeof parsed.localStorage === 'object'
        ? parsed.localStorage
        : parsed;

    if (!isPlainObject(localStorageData)) {
      throw new Error('Invalid import file format.');
    }

    const updates = new Map<RequiredLocalStorageKey, string>();
    for (const key of REQUIRED_LOCAL_STORAGE_KEYS) {
      if (Object.prototype.hasOwnProperty.call(localStorageData, key)) {
        const raw = localStorageData[key];
        const value = typeof raw === 'string' ? safeParse(raw) : raw;
        if (value === null) continue;
        if ((key === 'config' || key === 'wallpaperState') && !isPlainObject(value)) {
          throw new Error(`Invalid ${key} in import file.`);
        }
        if ((key === 'categories' || key === 'userWallpapers') && !Array.isArray(value)) {
          throw new Error(`Invalid ${key} in import file.`);
        }
        const normalized = key === 'config' ? normalizeConfig(value)
          : key === 'categories' ? normalizeCategories(value)
          : key === 'userWallpapers' ? normalizeUserWallpapers(value) : value;
        updates.set(key, toStorageString(normalized));
      }
    }

    if (updates.size === 0) {
      throw new Error(`No required keys found. Expected: ${REQUIRED_LOCAL_STORAGE_KEYS.join(', ')}`);
    }

    const previous = new Map([...updates.keys()].map(key => [key, localStorage.getItem(key)]));
    try {
      for (const [key, value] of updates) localStorage.setItem(key, value);
    } catch (error) {
      for (const key of updates.keys()) localStorage.removeItem(key);
      for (const [key, value] of previous) {
        if (value !== null) localStorage.setItem(key, value);
      }
      throw error;
    }

    return {
      config: this.loadConfig(),
      userWallpapers: this.loadUserWallpapers(),
    };
  },
};
