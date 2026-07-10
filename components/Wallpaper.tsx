
import { useState, useEffect, useRef } from 'react';
import { baseWallpapers } from './utils/baseWallpapers';
import { Wallpaper as WallpaperType } from '../types';
import { getWallpaperFromChromeStorageLocal } from './utils/StorageLocalManager';

interface WallpaperProps {
  wallpaperNames: string[];
  blur: number;
  brightness: number;
  opacity: number;
  wallpaperFrequency: string;
  wallpaperVersion: number;
}

const MIN_WALLPAPER_FREQUENCY_MS = 60 * 60 * 1000;
const MAX_WALLPAPER_FREQUENCY_MS = 48 * 60 * 60 * 1000;
const DEFAULT_WALLPAPER_FREQUENCY_MS = 24 * 60 * 60 * 1000;

const parseFrequencyToMs = (freq: string): number => {
  if (!freq) return DEFAULT_WALLPAPER_FREQUENCY_MS;
  const match = freq.match(/^(\d+)(h|d)$/);
  if (!match) return DEFAULT_WALLPAPER_FREQUENCY_MS;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const frequencyMs = unit === 'd' ? value * 24 * 60 * 60 * 1000 : value * 60 * 60 * 1000;
  return Math.min(MAX_WALLPAPER_FREQUENCY_MS, Math.max(MIN_WALLPAPER_FREQUENCY_MS, frequencyMs));
};

const wallpaperUrlCache = new Map<string, string | undefined>();

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
        try {
          const wallpaperData = await getWallpaperFromChromeStorageLocal(name);
          if (wallpaperData && wallpaperData.startsWith('http')) {
            resolved = wallpaperData;
          } else {
            resolved = wallpaperData || undefined;
          }
        } catch (error) {
          console.error('Error getting wallpaper from chrome storage', error);
          resolved = undefined;
        }
      }
    } catch (error) {
      console.error('Error reading userWallpapers from localStorage', error);
      resolved = undefined;
    }
  }

  wallpaperUrlCache.set(name, resolved);
  return resolved;
};

const Wallpaper: React.FC<WallpaperProps> = ({ wallpaperNames, blur, brightness, opacity, wallpaperFrequency, wallpaperVersion }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const resolvedRef = useRef(false);

  useEffect(() => {
    const updateWallpaper = async () => {
      if (wallpaperNames.length === 0) {
        setImageUrl(undefined);
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
      const freqMs = parseFrequencyToMs(wallpaperFrequency);

      let storedIndex =
        typeof wallpaperState.currentIndex === 'number' ? wallpaperState.currentIndex : 0;
      if (storedIndex < 0 || storedIndex >= wallpaperNames.length) storedIndex = 0;

      const shouldRotate = now - lastChange >= freqMs;
      let resolvedIndex = shouldRotate
        ? (storedIndex + 1) % wallpaperNames.length
        : storedIndex;

      const tried = new Set<number>();
      let resolvedUrl: string | undefined;

      for (let i = 0; i < wallpaperNames.length; i++) {
        if (tried.has(resolvedIndex)) break;
        tried.add(resolvedIndex);
        const url = await getWallpaperUrlByName(wallpaperNames[resolvedIndex]);
        if (url) {
          resolvedUrl = url;
          break;
        }
        resolvedIndex = (resolvedIndex + 1) % wallpaperNames.length;
      }

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

      resolvedRef.current = true;
      setImageUrl(resolvedUrl);
    };
    updateWallpaper();
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
