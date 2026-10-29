import { memo, useState, useEffect } from 'react';
import { baseWallpapers } from './utils/baseWallpapers';
import { Wallpaper as WallpaperType } from '../types';
import { getWallpaperFromChromeStorageLocal } from './utils/StorageLocalManager';
import { getRandomWallpaperIndex, getWallpaperFrequencyMs, loadWallpaperState, saveWallpaperState } from './utils/wallpaperUtils';
import { ConfigurationService } from './services/ConfigurationService';

interface WallpaperProps {
  wallpaperNames: string[];
  blur: number;
  brightness: number;
  opacity: number;
  wallpaperFrequency: string;
  wallpaperVersion: number;
}

const MAX_WALLPAPER_URL_CACHE = 3;
const wallpaperUrlCache = new Map<string, string | undefined>();

const rememberWallpaperUrl = (name: string, resolved: string | undefined): void => {
  if (resolved?.startsWith('data:')) return;
  wallpaperUrlCache.set(name, resolved);
  while (wallpaperUrlCache.size > MAX_WALLPAPER_URL_CACHE) {
    const oldest = wallpaperUrlCache.keys().next().value;
    if (oldest === undefined) break;
    wallpaperUrlCache.delete(oldest);
  }
};

const MAX_WALLPAPER_OBJECT_URLS = 2;
const wallpaperObjectUrls = new Map<string, string>();

const revokeWallpaperObjectUrls = (keepNames?: string[]): void => {
  for (const [name, url] of wallpaperObjectUrls) {
    if (keepNames?.includes(name)) continue;
    URL.revokeObjectURL(url);
    wallpaperObjectUrls.delete(name);
  }
};

const rememberWallpaperObjectUrl = (name: string, url: string): string => {
  const existing = wallpaperObjectUrls.get(name);
  if (existing) {
    URL.revokeObjectURL(url);
    return existing;
  }
  wallpaperObjectUrls.set(name, url);
  while (wallpaperObjectUrls.size > MAX_WALLPAPER_OBJECT_URLS) {
    const [oldestName, oldestUrl] = wallpaperObjectUrls.entries().next().value ?? [];
    if (oldestName === undefined || oldestUrl === undefined) break;
    URL.revokeObjectURL(oldestUrl);
    wallpaperObjectUrls.delete(oldestName);
  }
  return url;
};

const dataUrlToObjectUrl = (dataUrl: string): string => {
  const header = dataUrl.match(/^data:([^;,]*)((?:;[^;,]*)*),/);
  if (!header || typeof URL.createObjectURL !== 'function') return dataUrl;
  try {
    const payload = dataUrl.slice(header[0].length);
    const type = header[1] || 'application/octet-stream';
    if (!/;base64/i.test(header[2])) {
      return URL.createObjectURL(new Blob([decodeURIComponent(payload)], { type }));
    }
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type }));
  } catch {
    return dataUrl;
  }
};

const getWallpaperUrlByName = async (name: string): Promise<string | undefined> => {
  if (!name) return undefined;
  if (wallpaperUrlCache.has(name)) return wallpaperUrlCache.get(name);
  const objectUrl = wallpaperObjectUrls.get(name);
  if (objectUrl) return objectUrl;

  let resolved: string | undefined;
  const foundInBase = baseWallpapers.find((w: WallpaperType) => w.name === name);
  if (foundInBase) {
    resolved = foundInBase.url || foundInBase.base64;
  } else {
    try {
      const storedUserWallpapers = ConfigurationService.loadUserWallpapers();
      const foundInUser = storedUserWallpapers.find((w: WallpaperType) => w.name === name);
      if (foundInUser) {
        resolved = foundInUser.url || foundInUser.base64;
        if (!resolved) {
          try {
            resolved = (await getWallpaperFromChromeStorageLocal(name)) || undefined;
          } catch (error) {
            console.error('Error getting wallpaper from chrome storage', error);
            resolved = undefined;
          }
        }
      }
    } catch (error) {
      console.error('Error reading userWallpapers from localStorage', error);
      resolved = undefined;
    }
  }

  if (resolved?.startsWith('data:')) {
    const url = dataUrlToObjectUrl(resolved);
    return url.startsWith('blob:') ? rememberWallpaperObjectUrl(name, url) : url;
  }
  rememberWallpaperUrl(name, resolved);
  return resolved;
};

const getWallpaperFilter = (blur: number, brightness: number): string => {
  const filters = [
    blur > 0 ? `blur(${blur}px)` : '',
    brightness !== 100 ? `brightness(${brightness / 100})` : '',
  ].filter(Boolean);
  return filters.length > 0 ? filters.join(' ') : 'none';
};

const Wallpaper: React.FC<WallpaperProps> = ({ wallpaperNames, blur, brightness, opacity, wallpaperFrequency, wallpaperVersion }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let revision = 0;
    wallpaperUrlCache.clear();
    revokeWallpaperObjectUrls(wallpaperNames);

    const updateWallpaper = async () => {
      const request = ++revision;
      clearTimeout(timer);
      if (document.visibilityState !== 'visible') return;
      if (wallpaperNames.length === 0) {
        setImageUrl(undefined);
        saveWallpaperState([], 0, loadWallpaperState([]).lastChange);
        return;
      }

      const now = Date.now();
      const { currentIndex, lastChange } = loadWallpaperState(wallpaperNames, now);
      const freqMs = getWallpaperFrequencyMs(wallpaperFrequency);
      const shouldRotate = wallpaperNames.length > 1 && now - lastChange >= freqMs;
      let resolvedIndex = shouldRotate
        ? getRandomWallpaperIndex(wallpaperNames.length, currentIndex)
        : currentIndex;
      let resolvedUrl: string | undefined;

      for (let i = 0; i < wallpaperNames.length; i++) {
        const url = await getWallpaperUrlByName(wallpaperNames[resolvedIndex]);
        if (cancelled || request !== revision) return;
        if (url) {
          resolvedUrl = url;
          break;
        }
        resolvedIndex = (resolvedIndex + 1) % wallpaperNames.length;
      }

      if (cancelled || request !== revision) return;
      const nextLastChange = shouldRotate || resolvedIndex !== currentIndex ? Date.now() : lastChange;
      saveWallpaperState(wallpaperNames, resolvedIndex, nextLastChange);
      setImageUrl(resolvedUrl);
      if (wallpaperNames.length > 1) {
        timer = setTimeout(refresh, Math.max(1, nextLastChange + freqMs - Date.now()));
      }
    };
    const refresh = () => {
      void updateWallpaper().catch(error => console.error('Error updating wallpaper', error));
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
      else {
        ++revision;
        clearTimeout(timer);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'wallpaperState' || event.key === 'userWallpapers' || event.key === null) {
        wallpaperUrlCache.clear();
        if (event.key !== 'wallpaperState') revokeWallpaperObjectUrls();
        refresh();
      }
    };
    refresh();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      wallpaperUrlCache.clear();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [wallpaperNames, wallpaperFrequency, wallpaperVersion]);

  useEffect(() => () => revokeWallpaperObjectUrls(), []);

  if (!imageUrl) return null;

  return (
    <>
      <div
        className="wallpaper-layer wallpaper-transition"
        style={{
          backgroundImage: `url(${JSON.stringify(imageUrl)})`,
          filter: getWallpaperFilter(blur, brightness),
          transform: blur > 0 ? 'scale(1.015)' : 'none',
          opacity: opacity / 100,
        }}
        aria-label="Wallpaper background"
      />
      <div className="wallpaper-luminance" aria-hidden="true" />
    </>
  );
};

export default memo(Wallpaper);
