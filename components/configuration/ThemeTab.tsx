import React, { useRef, useState } from 'react';
import Dropdown from '../Dropdown';
import { Config, Wallpaper } from '../../types';

interface ThemeTabProps {
  config: Config;
  onChange: (updates: Partial<Config>) => void;
  userWallpapers: Wallpaper[];
  allWallpapers: Wallpaper[];
  chromeStorageAvailable: boolean;
  onAddWallpaper: (name: string, url: string) => Promise<void>;
  onAddWallpaperFile: (file: File) => Promise<void>;
  onDeleteWallpaper: (wallpaper: Wallpaper) => Promise<void>;
  onNextWallpaper: () => void;
}

type RangeStyle = React.CSSProperties & { '--range-progress': string };

const getRangeStyle = (value: number, min: number, max: number): RangeStyle => {
  const progress = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return { '--range-progress': `${progress}%` };
};

const MIN_WALLPAPER_FREQUENCY_HOURS = 1;
const MAX_WALLPAPER_FREQUENCY_HOURS = 48;
const DEFAULT_WALLPAPER_FREQUENCY_HOURS = 24;

const clampWallpaperFrequencyHours = (hours: number): number =>
  Math.min(MAX_WALLPAPER_FREQUENCY_HOURS, Math.max(MIN_WALLPAPER_FREQUENCY_HOURS, Math.round(hours)));

const getWallpaperFrequencyHours = (frequency: string): number => {
  const match = frequency.match(/^(\d+)(h|d)$/);
  if (!match) return DEFAULT_WALLPAPER_FREQUENCY_HOURS;
  const value = Number(match[1]);
  const hours = match[2] === 'd' ? value * 24 : value;
  return clampWallpaperFrequencyHours(hours);
};

const formatWallpaperFrequency = (hours: number): string =>
  `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

const ThemeTab: React.FC<ThemeTabProps> = ({
  config,
  onChange,
  userWallpapers,
  allWallpapers,
  chromeStorageAvailable,
  onAddWallpaper,
  onAddWallpaperFile,
  onDeleteWallpaper,
  onNextWallpaper,
}) => {
  const [newWallpaperName, setNewWallpaperName] = useState('');
  const [newWallpaperUrl, setNewWallpaperUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wallpaperFrequencyHours = getWallpaperFrequencyHours(config.wallpaperFrequency);

  const handleAddWallpaper = async () => {
    if (newWallpaperUrl.trim() === '') return;
    try {
      await onAddWallpaper(newWallpaperName, newWallpaperUrl);
      setNewWallpaperName('');
      setNewWallpaperUrl('');
    } catch (error) {
      alert('Error adding wallpaper. Please check the URL and try again.');
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onAddWallpaperFile(file);
    } catch (error: any) {
      alert(error?.message || 'Error adding wallpaper. Please try again.');
      console.error(error);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-slate-300 text-sm font-semibold">Background</label>
        <Dropdown
          name="currentWallpapers"
          value={config.currentWallpapers}
          onChange={(e) => onChange({ currentWallpapers: e.target.value as string[] })}
          multiple
          options={allWallpapers.map((w) => ({ value: w.name, label: w.name }))}
        />
      </div>
      {Array.isArray(config.currentWallpapers) && config.currentWallpapers.length > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-slate-300 text-sm font-semibold">Change Frequency</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={MIN_WALLPAPER_FREQUENCY_HOURS}
              max={MAX_WALLPAPER_FREQUENCY_HOURS}
              step="1"
              value={wallpaperFrequencyHours}
              onChange={(e) => onChange({ wallpaperFrequency: `${Number(e.target.value)}h` })}
              className="liquid-range"
              style={getRangeStyle(
                wallpaperFrequencyHours,
                MIN_WALLPAPER_FREQUENCY_HOURS,
                MAX_WALLPAPER_FREQUENCY_HOURS,
              )}
            />
            <span className="w-20 text-right text-sm text-slate-200">
              {formatWallpaperFrequency(wallpaperFrequencyHours)}
            </span>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-slate-300 text-sm font-semibold">Wallpaper Blur</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="50"
            value={config.wallpaperBlur}
            onChange={(e) => onChange({ wallpaperBlur: Number(e.target.value) })}
            className="liquid-range"
            style={getRangeStyle(config.wallpaperBlur, 0, 50)}
          />
          <span className="w-12 text-right text-sm text-slate-200">{config.wallpaperBlur}px</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-slate-300 text-sm font-semibold">Wallpaper Brightness</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="200"
            value={config.wallpaperBrightness}
            onChange={(e) => onChange({ wallpaperBrightness: Number(e.target.value) })}
            className="liquid-range"
            style={getRangeStyle(config.wallpaperBrightness, 0, 200)}
          />
          <span className="w-12 text-right text-sm text-slate-200">{config.wallpaperBrightness}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-slate-300 text-sm font-semibold">Wallpaper Opacity</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="100"
            value={config.wallpaperOpacity}
            onChange={(e) => onChange({ wallpaperOpacity: Number(e.target.value) })}
            className="liquid-range"
            style={getRangeStyle(config.wallpaperOpacity, 1, 100)}
          />
          <span className="w-12 text-right text-sm text-slate-200">{config.wallpaperOpacity}%</span>
        </div>
      </div>
      {chromeStorageAvailable && (
        <>
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-2">User Wallpapers</h3>
            <div className="flex flex-col gap-2">
              {userWallpapers.map((wallpaper) => (
                <div
                  key={wallpaper.name}
                  className="liquid-surface flex items-center justify-between rounded-xl p-2.5"
                >
                  <span className="truncate">{wallpaper.name}</span>
                  <button
                    onClick={() => onDeleteWallpaper(wallpaper)}
                    className="liquid-edit-action liquid-focus text-red-300 hover:text-red-100"
                    aria-label={`Delete ${wallpaper.name}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      className="bi bi-trash"
                      viewBox="0 0 16 16"
                    >
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                      <path
                        fillRule="evenodd"
                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-2">Add New Wallpaper</h3>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Wallpaper Name (optional for URLs)"
                value={newWallpaperName}
                onChange={(e) => setNewWallpaperName(e.target.value)}
                className="liquid-input p-2.5"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Image URL"
                  value={newWallpaperUrl}
                  onChange={(e) => setNewWallpaperUrl(e.target.value)}
                  className="liquid-input p-2.5"
                />
                <button
                  onClick={handleAddWallpaper}
                  className="liquid-button liquid-button-primary liquid-focus py-2.5 px-4"
                >
                  Add
                </button>
              </div>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="liquid-surface liquid-ghost-tile flex flex-col items-center justify-center w-full h-32 cursor-pointer transition-all duration-200 ease-ios"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-8 h-8 mb-4 text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP, etc.</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                  />
                </label>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="flex justify-center pt-2">
        <button
          onClick={onNextWallpaper}
          disabled={config.currentWallpapers.length === 0}
          className="liquid-surface liquid-control liquid-focus disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-4 rounded-2xl"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 .5-.5h5.379L8.646 5.354a.5.5 0 1 1 .708-.708l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 0 1-.708-.708L10.379 8H5a.5.5 0 0 1-.5-.5z" />
          </svg>
          Next Wallpaper
        </button>
      </div>
    </div>
  );
};

export default ThemeTab;
