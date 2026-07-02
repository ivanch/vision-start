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
      <div className="flex items-center justify-between">
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
        <div className="flex items-center justify-between">
          <label className="text-slate-300 text-sm font-semibold">Change Frequency</label>
          <Dropdown
            name="wallpaperFrequency"
            value={config.wallpaperFrequency}
            onChange={(e) => onChange({ wallpaperFrequency: e.target.value as string })}
            options={[
              { value: '1h', label: '1 hour' },
              { value: '3h', label: '3 hours' },
              { value: '6h', label: '6 hours' },
              { value: '12h', label: '12 hours' },
              { value: '1d', label: '1 day' },
              { value: '2d', label: '2 days' },
            ]}
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <label className="text-slate-300 text-sm font-semibold">Wallpaper Blur</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="50"
            value={config.wallpaperBlur}
            onChange={(e) => onChange({ wallpaperBlur: Number(e.target.value) })}
            className="w-48"
          />
          <span>{config.wallpaperBlur}px</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="text-slate-300 text-sm font-semibold">Wallpaper Brightness</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="200"
            value={config.wallpaperBrightness}
            onChange={(e) => onChange({ wallpaperBrightness: Number(e.target.value) })}
            className="w-48"
          />
          <span>{config.wallpaperBrightness}%</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="text-slate-300 text-sm font-semibold">Wallpaper Opacity</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="100"
            value={config.wallpaperOpacity}
            onChange={(e) => onChange({ wallpaperOpacity: Number(e.target.value) })}
            className="w-48"
          />
          <span>{config.wallpaperOpacity}%</span>
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
                  className="flex items-center justify-between bg-white/10 p-2 rounded-lg"
                >
                  <span className="truncate">{wallpaper.name}</span>
                  <button
                    onClick={() => onDeleteWallpaper(wallpaper)}
                    className="text-red-500 hover:text-red-400"
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
                className="bg-white/10 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Image URL"
                  value={newWallpaperUrl}
                  onChange={(e) => setNewWallpaperUrl(e.target.value)}
                  className="bg-white/10 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button
                  onClick={handleAddWallpaper}
                  className="bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-white font-bold py-2 px-4 rounded-lg transition-all duration-150 ease-ios"
                >
                  Add
                </button>
              </div>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white/5 border-white/20 hover:bg-white/10"
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
          className="flex items-center gap-2 bg-black/25 backdrop-blur-md border border-white/10 hover:bg-white/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all duration-150 ease-ios"
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
