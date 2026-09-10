import { useState, useEffect } from 'react';
import { baseWallpapers } from './utils/baseWallpapers';
import { Wallpaper as WallpaperType } from '../types';
import { getWallpaperFromChromeStorageLocal } from './utils/StorageLocalManager';
import { getRandomWallpaperIndex, getWallpaperFrequencyMs, loadWallpaperState, saveWallpaperState } from './utils/wallpaperUtils';

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
  wallpaperUrlCache.set(name, resolved);
  while (wallpaperUrlCache.size > MAX_WALLPAPER_URL_CACHE) {
    const oldest = wallpaperUrlCache.keys().next().value;
    if (oldest === undefined) break;
    wallpaperUrlCache.delete(oldest);
  }
};

const getWallpaperUrlByName = async (name: string): Promise<string | undefined> => {
  if (!name) return undefined;
  if (wallpaperUrlCache.has(name)) return wallpaperUrlCache.get(name);

  let resolved: string | undefined;
  const foundInBase = baseWallpapers.find((w: WallpaperType) => w.name === name);
  if (foundInBase) {
    resolved = foundInBase.url || foundInBase.base64;
  } else {
    try {
      const storedUserWallpapers: WallpaperType[] =
        JSON.parse(localStorage.getItem('userWallpapers') || '[]');
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

  rememberWallpaperUrl(name, resolved);
  return resolved;
};

const Wallpaper: React.FC<WallpaperProps> = ({ wallpaperNames, blur, brightness, opacity, wallpaperFrequency, wallpaperVersion }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let revision = 0;
    wallpaperUrlCache.clear();

    const updateWallpaper = async () => {
      const request = ++revision;
      clearTimeout(timer);
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
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'wallpaperState' || event.key === 'userWallpapers' || event.key === null) {
        wallpaperUrlCache.clear();
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
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [wallpaperNames, wallpaperFrequency, wallpaperVersion]);

  if (!imageUrl) return null;

  return (
    <>
      <div
        className="wallpaper-layer wallpaper-transition"
        style={{
          backgroundImage: `url(${imageUrl})`,
          filter: `blur(${blur}px) brightness(${brightness / 100})`,
          opacity: opacity / 100,
        }}
        aria-label="Wallpaper background"
      />
      <div className="wallpaper-luminance" aria-hidden="true" />
    </>
  );
};

export default Wallpaper;
