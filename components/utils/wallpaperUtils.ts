export const MIN_WALLPAPER_FREQUENCY_HOURS = 1;
export const MAX_WALLPAPER_FREQUENCY_HOURS = 48;
export const DEFAULT_WALLPAPER_FREQUENCY_HOURS = 24;

export const getWallpaperFrequencyHours = (frequency: string): number => {
  if (!frequency) return DEFAULT_WALLPAPER_FREQUENCY_HOURS;
  const match = frequency.match(/^(\d+)(h|d)$/);
  if (!match) return DEFAULT_WALLPAPER_FREQUENCY_HOURS;
  const value = parseInt(match[1], 10);
  const hours = match[2] === 'd' ? value * 24 : value;
  return Math.min(MAX_WALLPAPER_FREQUENCY_HOURS, Math.max(MIN_WALLPAPER_FREQUENCY_HOURS, hours));
};

export const getWallpaperFrequencyMs = (frequency: string): number =>
  getWallpaperFrequencyHours(frequency) * 60 * 60 * 1000;

export const formatWallpaperFrequency = (hours: number): string =>
  `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

export const getRandomWallpaperIndex = (wallpaperCount: number, currentIndex: number): number => {
  if (wallpaperCount <= 1) return 0;
  const offset = Math.floor(Math.random() * (wallpaperCount - 1)) + 1;
  return (currentIndex + offset) % wallpaperCount;
};