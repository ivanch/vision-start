
import { useState, useEffect } from 'react';
import { baseWallpapers } from './utils/baseWallpapers';
import { Wallpaper as WallpaperType } from '../types';
import { getWallpaperFromChromeStorageLocal } from './utils/StorageLocalManager';

interface WallpaperProps {
  wallpaperNames: string[];
  blur: number;
  brightness: number;
  opacity: number;
  wallpaperFrequency: string;
}

const getWallpaperUrlByName = async (name: string): Promise<string | undefined> => {
  const foundInBase = baseWallpapers.find((w: WallpaperType) => w.name === name);
  if (foundInBase) {
    return foundInBase.url || foundInBase.base64;
  }

  const userWallpapers: WallpaperType[] = JSON.parse(localStorage.getItem('userWallpapers') || '[]');
  const foundInUser = userWallpapers.find((w: WallpaperType) => w.name === name);
  if (foundInUser) {
    try {
      const wallpaperData = await getWallpaperFromChromeStorageLocal(name);
      if (wallpaperData && wallpaperData.startsWith('http')) {
        return wallpaperData;
      }
      return wallpaperData || undefined;
    } catch (error) {
      console.error('Error getting wallpaper from chrome storage', error);
      return undefined;
    }
  }

  return undefined;
};

const Wallpaper: React.FC<WallpaperProps> = ({ wallpaperNames, blur, brightness, opacity, wallpaperFrequency }) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [currentWallpaperIndex, setCurrentWallpaperIndex] = useState<number>(0);

  // Helper to parse wallpaperFrequency string to ms
  const parseFrequencyToMs = (freq: string): number => {
    if (!freq) return 24 * 60 * 60 * 1000; // default 1 day
    const match = freq.match(/(\d+)(h|d)/);
    if (!match) return 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'h') return value * 60 * 60 * 1000;
    if (unit === 'd') return value * 24 * 60 * 60 * 1000;
    return 24 * 60 * 60 * 1000;
  };

  useEffect(() => {
    const updateWallpaper = async () => {
      if (wallpaperNames.length === 0) return;
      // Read wallpaperState from localStorage
      const wallpaperState = JSON.parse(localStorage.getItem('wallpaperState') || '{}');
      const lastChange = wallpaperState.lastWallpaperChange ? new Date(wallpaperState.lastWallpaperChange).getTime() : 0;
      const now = Date.now();
      const freqMs = parseFrequencyToMs(wallpaperFrequency);
      let currentIndex = typeof wallpaperState.currentIndex === 'number' ? wallpaperState.currentIndex : 0;

      // If enough time has passed, pick a new wallpaper
      if (now - lastChange >= freqMs) {
        currentIndex = (currentIndex + 1) % wallpaperNames.length;
        localStorage.setItem('wallpaperState', JSON.stringify({
          lastWallpaperChange: new Date().toISOString(),
          currentIndex
        }));
      } else {
        // Keep currentIndex in sync with localStorage if not updating
        localStorage.setItem('wallpaperState', JSON.stringify({
          lastWallpaperChange: wallpaperState.lastWallpaperChange || new Date().toISOString(),
          currentIndex
        }));
      }
      setCurrentWallpaperIndex(currentIndex);
      const wallpaperName = wallpaperNames[currentIndex];
      const url = await getWallpaperUrlByName(wallpaperName);
      setImageUrl(url);
    };
    updateWallpaper();
    // No timer, just run on render/dependency change
  }, [wallpaperNames, wallpaperFrequency]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 -z-10 w-full h-full"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: `blur(${blur}px) brightness(${brightness / 100})`,
        opacity: opacity / 100,
        transition: 'filter 0.3s, opacity 0.3s',
      }}
      aria-label="Wallpaper background"
    />
  );
};

export default Wallpaper;
