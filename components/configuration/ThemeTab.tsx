import React, { useState } from 'react';
import Dropdown from '../Dropdown';
import { Config, Wallpaper } from '../../types';
import RangeSlider from './RangeSlider';
import { TrashIcon } from '../icons';
import {
  getWallpaperFrequencyHours,
  formatWallpaperFrequency,
  MIN_WALLPAPER_FREQUENCY_HOURS,
  MAX_WALLPAPER_FREQUENCY_HOURS,
} from '../utils/wallpaperUtils';

interface ThemeTabProps {
  config: Config;
  onChange: (updates: Partial<Config>) => void;
  userWallpapers: Wallpaper[];
  allWallpapers: Wallpaper[];
  chromeStorageAvailable: boolean;
  onAddWallpaper: (name: string, url: string) => Promise<void>;
  onAddWallpaperFile: (file: File) => Promise<void>;
  onDeleteWallpaper: (wallpaper: Wallpaper) => Promise<void>;
  onRandomWallpaper: () => void;
}

const ThemeTab: React.FC<ThemeTabProps> = ({
  config,
  onChange,
  userWallpapers,
  allWallpapers,
  chromeStorageAvailable,
  onAddWallpaper,
  onAddWallpaperFile,
  onDeleteWallpaper,
  onRandomWallpaper,
}) => {
  const [newWallpaperName, setNewWallpaperName] = useState('');
  const [newWallpaperUrl, setNewWallpaperUrl] = useState('');
  const wallpaperFrequencyHours = getWallpaperFrequencyHours(config.wallpaperFrequency);

  const handleAddWallpaper = async () => {
    if (newWallpaperUrl.trim() === '') return;
    try {
      await onAddWallpaper(newWallpaperName, newWallpaperUrl);
      setNewWallpaperName('');
      setNewWallpaperUrl('');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Error adding wallpaper. Please check the URL and try again.',
      );
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onAddWallpaperFile(file);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error adding wallpaper. Please try again.');
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
        <RangeSlider
          label="Change Frequency"
          value={wallpaperFrequencyHours}
          min={MIN_WALLPAPER_FREQUENCY_HOURS}
          max={MAX_WALLPAPER_FREQUENCY_HOURS}
          formatValue={formatWallpaperFrequency}
          onChange={(value) => onChange({ wallpaperFrequency: `${value}h` })}
        />
      )}
      <RangeSlider
        label="Wallpaper Blur"
        value={config.wallpaperBlur}
        min={0}
        max={50}
        valueSuffix="px"
        onChange={(value) => onChange({ wallpaperBlur: value })}
      />
      <RangeSlider
        label="Wallpaper Brightness"
        value={config.wallpaperBrightness}
        min={0}
        max={200}
        valueSuffix="%"
        onChange={(value) => onChange({ wallpaperBrightness: value })}
      />
      <RangeSlider
        label="Wallpaper Opacity"
        value={config.wallpaperOpacity}
        min={1}
        max={100}
        valueSuffix="%"
        onChange={(value) => onChange({ wallpaperOpacity: value })}
      />
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
                <TrashIcon size={16} />
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
          {chromeStorageAvailable && (
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
                />
              </label>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-center pt-2">
        <button
          onClick={onRandomWallpaper}
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
          Random Wallpaper
        </button>
      </div>
    </div>
  );
};

export default ThemeTab;