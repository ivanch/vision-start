import React, { useState, useRef, useEffect } from 'react';
import { Config, Wallpaper } from '../types';
import { baseWallpapers } from './utils/baseWallpapers';
import { checkChromeStorageLocalAvailable } from './utils/StorageLocalManager';
import { ConfigurationService } from './services/ConfigurationService';
import GeneralTab from './configuration/GeneralTab';
import ThemeTab from './configuration/ThemeTab';
import ClockTab from './configuration/ClockTab';
import ServerWidgetTab from './configuration/ServerWidgetTab';

interface ConfigurationModalProps {
  onClose: () => void;
  onSave: (config: Config) => void;
  currentConfig: Config;
  onWallpaperChange: (newConfig: Partial<Config>) => void;
  onNextWallpaper: () => void;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  onClose,
  onSave,
  currentConfig,
  onWallpaperChange,
  onNextWallpaper,
}) => {
  const [config, setConfig] = useState<Config>(currentConfig);
  const [activeTab, setActiveTab] = useState('general');
  const [userWallpapers, setUserWallpapers] = useState<Wallpaper[]>([]);
  const [chromeStorageAvailable, setChromeStorageAvailable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const isSaving = useRef(false);

  useEffect(() => {
    setChromeStorageAvailable(checkChromeStorageLocalAvailable());
    setUserWallpapers(ConfigurationService.loadUserWallpapers());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (!isSaving.current) {
        onWallpaperChange({ currentWallpapers: currentConfig.currentWallpapers });
      }
    };
  }, []);

  useEffect(() => {
    onWallpaperChange({ currentWallpapers: config.currentWallpapers });
    ConfigurationService.resetWallpaperState();
  }, [config.currentWallpapers]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 250);
  };

  const handleConfigChange = (updates: Partial<Config>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleAddWallpaper = async (name: string, url: string) => {
    const newWallpaper = await ConfigurationService.addWallpaper(name, url);
    const updated = [...userWallpapers, newWallpaper];
    setUserWallpapers(updated);
    ConfigurationService.saveUserWallpapers(updated);
    setConfig((prev) => ({
      ...prev,
      currentWallpapers: [...prev.currentWallpapers, newWallpaper.name],
    }));
  };

  const handleAddWallpaperFile = async (file: File) => {
    const newWallpaper = await ConfigurationService.addWallpaperFile(file);
    const updated = [...userWallpapers, newWallpaper];
    setUserWallpapers(updated);
    ConfigurationService.saveUserWallpapers(updated);
    setConfig((prev) => ({
      ...prev,
      currentWallpapers: [...prev.currentWallpapers, newWallpaper.name],
    }));
  };

  const handleDeleteWallpaper = async (wallpaper: Wallpaper) => {
    try {
      await ConfigurationService.deleteWallpaper(wallpaper);
      const updated = userWallpapers.filter((w) => w.name !== wallpaper.name);
      setUserWallpapers(updated);
      ConfigurationService.saveUserWallpapers(updated);
      const newCurrentWallpapers = config.currentWallpapers.filter((n) => n !== wallpaper.name);
      setConfig((prev) => ({ ...prev, currentWallpapers: newCurrentWallpapers }));
      onWallpaperChange({ currentWallpapers: newCurrentWallpapers });
    } catch (error) {
      alert('Error deleting wallpaper. Please try again.');
      console.error(error);
    }
  };

  const handleImportConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { config: importedConfig, userWallpapers: importedWallpapers } =
        await ConfigurationService.importConfig(file);
      setConfig(importedConfig);
      setUserWallpapers(importedWallpapers);
      onWallpaperChange({ currentWallpapers: importedConfig.currentWallpapers || [] });
      onSave(importedConfig);
      alert('Configuration imported successfully. The page will reload to apply all data.');
      window.location.reload();
    } catch (error) {
      alert('Could not import configuration. Please use a valid export JSON file.');
      console.error(error);
    } finally {
      event.target.value = '';
    }
  };

  const allWallpapers = [...baseWallpapers, ...userWallpapers];

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'theme', label: 'Theme' },
    { id: 'clock', label: 'Clock' },
    { id: 'serverWidget', label: 'Server Widget' },
  ];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className={`liquid-modal-backdrop fixed inset-0 transition-opacity duration-200 ease-ios ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      <div
        ref={menuRef}
        className={`liquid-drawer fixed top-0 right-0 h-full w-full max-w-xl text-white flex flex-col transition-transform duration-300 ease-spring transform ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 sm:p-8 flex-grow overflow-y-auto">
          <h2 className="liquid-title-text text-3xl font-extrabold mb-6">Configuration</h2>

          <div className="liquid-surface grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-2xl p-1 mb-7">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`liquid-focus rounded-xl px-3 py-2 text-sm font-bold transition-all duration-200 ease-ios ${
                  activeTab === tab.id
                    ? 'bg-cyan-400/25 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'general' && (
            <GeneralTab config={config} onChange={handleConfigChange} />
          )}
          {activeTab === 'theme' && (
            <ThemeTab
              config={config}
              onChange={handleConfigChange}
              userWallpapers={userWallpapers}
              allWallpapers={allWallpapers}
              chromeStorageAvailable={chromeStorageAvailable}
              onAddWallpaper={handleAddWallpaper}
              onAddWallpaperFile={handleAddWallpaperFile}
              onDeleteWallpaper={handleDeleteWallpaper}
              onNextWallpaper={onNextWallpaper}
            />
          )}
          {activeTab === 'clock' && (
            <ClockTab config={config} onChange={handleConfigChange} />
          )}
          {activeTab === 'serverWidget' && (
            <ServerWidgetTab config={config} onChange={handleConfigChange} />
          )}
        </div>

        <div className="p-6 sm:p-8 border-t border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => ConfigurationService.exportConfig()}
                className="liquid-button liquid-button-secondary liquid-focus text-sm py-2 px-4"
              >
                Export
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="liquid-button liquid-button-secondary liquid-focus text-sm py-2 px-4"
              >
                Import
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportConfig}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  isSaving.current = true;
                  onSave(config);
                }}
                className="liquid-button liquid-button-success liquid-focus py-2.5 px-5"
              >
                Save & Close
              </button>
              <button
                onClick={handleClose}
                className="liquid-button liquid-button-secondary liquid-focus py-2.5 px-5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationModal;
