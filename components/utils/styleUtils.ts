export const SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: 'tiny', label: 'Tiny' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export const TILE_SIZE_CLASSES: Record<string, string> = {
  small: 'w-28 h-28',
  medium: 'w-32 h-32',
  large: 'w-36 h-36',
};

export const getTileSizeClass = (size: string | undefined): string =>
  TILE_SIZE_CLASSES[size ?? ''] ?? 'w-32 h-32';

export const ICON_PIXEL_SIZES: Record<string, number> = {
  small: 34,
  medium: 42,
  large: 48,
};

export const getIconPixelSize = (size: string | undefined): number =>
  ICON_PIXEL_SIZES[size ?? ''] ?? 40;

export const ICON_LOADING_PIXEL_SIZES: Record<string, number> = {
  small: 24,
  medium: 32,
  large: 40,
};

export const getIconLoadingPixelSize = (size: string | undefined): number =>
  ICON_LOADING_PIXEL_SIZES[size ?? ''] ?? 32;

export const CLOCK_SIZE_CLASSES: Record<string, string> = {
  tiny: 'text-3xl',
  small: 'text-4xl',
  medium: 'text-5xl',
  large: 'text-6xl',
};

export const getClockSizeClass = (size: string): string =>
  CLOCK_SIZE_CLASSES[size] ?? 'text-5xl';

export const TITLE_SIZE_CLASSES: Record<string, string> = {
  tiny: 'text-4xl',
  small: 'text-5xl',
  medium: 'text-6xl',
  large: 'text-7xl',
};

export const getTitleSizeClass = (size: string): string =>
  TITLE_SIZE_CLASSES[size] ?? 'text-6xl';

export const ALIGNMENT_CLASSES: Record<string, string> = {
  top: 'justify-start',
  left: 'justify-start',
  middle: 'justify-center',
  bottom: 'justify-end',
  right: 'justify-end',
};

export const getAlignmentClass = (alignment: string): string =>
  ALIGNMENT_CLASSES[alignment] ?? 'justify-center';