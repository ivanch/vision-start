import { useState, useEffect } from 'react';
import { baseWallpapers } from './utils/baseWallpapers';
import { Wallpaper as WallpaperType } from '../types';
import { getWallpaperFromChromeStorageLocal } from './utils/StorageLocalManager';
import { getRandomWallpaperIndex, getWallpaperFrequencyMs } from './utils/wallpaperUtils';

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

    const updateWallpaper = async () => {
      if (wallpaperNames.length === 0) {
        if (!cancelled) setImageUrl(undefined);
        localStorage.setItem(
          'wallpaperState',
          JSON.stringify({ lastWallpaperChange: new Date().toISOString(), currentIndex: 0 }),
        );
        return;
      }

      const wallpaperState = JSON.parse(localStorage.getItem('wallpaperState') || '{}');
      const lastChange = wallpaperState.lastWallpaperChange
        ? new Date(wallpaperState.lastWallpaperChange).getTime()
        : 0;
      const now = Date.now();
      const freqMs = getWallpaperFrequencyMs(wallpaperFrequency);

      let storedIndex =
        typeof wallpaperState.currentIndex === 'number' ? wallpaperState.currentIndex : 0;
      if (storedIndex < 0 || storedIndex >= wallpaperNames.length) storedIndex = 0;

      const shouldRotate = now - lastChange >= freqMs;
      let resolvedIndex = shouldRotate
        ? getRandomWallpaperIndex(wallpaperNames.length, storedIndex)
        : storedIndex;

      const tried = new Set<number>();
      let resolvedUrl: string | undefined;

      for (let i = 0; i < wallpaperNames.length; i++) {
        if (tried.has(resolvedIndex)) break;
        tried.add(resolvedIndex);
        const url = await getWallpaperUrlByName(wallpaperNames[resolvedIndex]);
        if (cancelled) return;
        if (url) {
          resolvedUrl = url;
          break;
        }
        resolvedIndex = (resolvedIndex + 1) % wallpaperNames.length;
      }

      if (cancelled) return;

      const nextLastChange = shouldRotate
        ? new Date().toISOString()
        : wallpaperState.lastWallpaperChange || new Date().toISOString();

      localStorage.setItem(
        'wallpaperState',
        JSON.stringify({
          lastWallpaperChange: nextLastChange,
          currentIndex: resolvedIndex,
        }),
      );

      setImageUrl(resolvedUrl);
    };
    updateWallpaper();

    return () => {
      cancelled = true;
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