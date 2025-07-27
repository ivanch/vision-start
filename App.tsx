import React, { useState, useEffect } from 'react';
import WebsiteTile from './components/WebsiteTile';
import ConfigurationModal from './components/ConfigurationModal';
import Clock from './components/Clock';
import ServerWidget from './components/ServerWidget';
import { DEFAULT_CATEGORIES } from './constants';
import { Category, Website, Wallpaper } from './types';
import Dropdown from './components/Dropdown';
import WebsiteEditModal from './components/WebsiteEditModal';
import CategoryEditModal from './components/CategoryEditModal';

import { baseWallpapers } from './components/utils/baseWallpapers';

const defaultConfig = {
  title: 'Vision Start',
  subtitle: 'Your personal portal to the web.',
  backgroundUrls: ['https://i.imgur.com/C6ynAtX.jpeg'],
  wallpaperFrequency: '1d',
  wallpaperBlur: 0,
  wallpaperBrightness: 100,
  wallpaperOpacity: 100,
  titleSize: 'medium',
  subtitleSize: 'medium',
  alignment: 'middle',
  horizontalAlignment: 'middle',
  clock: {
    enabled: true,
    size: 'medium',
    font: 'Helvetica',
    format: 'h:mm A',
  },
  serverWidget: {
    enabled: false,
    pingFrequency: 15,
    servers: [],
  },
};

const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const storedCategories = localStorage.getItem('categories');
      if (storedCategories) {
        return JSON.parse(storedCategories);
      }
    } catch (error) {
      console.error('Error parsing categories from localStorage', error);
    }
    return DEFAULT_CATEGORIES;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [addingWebsite, setAddingWebsite] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [config, setConfig] = useState(() => {
    try {
      const storedConfig = localStorage.getItem('config');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        if (!parsedConfig.backgroundUrls) {
          parsedConfig.backgroundUrls = [parsedConfig.backgroundUrl].filter(Boolean);
        }
        return { ...defaultConfig, ...parsedConfig };
      }
    } catch (error) {
      console.error('Error parsing config from localStorage', error);
    }
    return { ...defaultConfig };
  });
  const [userWallpapers, setUserWallpapers] = useState<Wallpaper[]>(() => {
    const storedUserWallpapers = localStorage.getItem('userWallpapers');
    return storedUserWallpapers ? JSON.parse(storedUserWallpapers) : [];
  });
  const [currentWallpaper, setCurrentWallpaper] = useState<string>('');

  const allWallpapers = [...baseWallpapers, ...userWallpapers];

  useEffect(() => {
    const getFrequencyInMs = (frequency: string) => {
      const value = parseInt(frequency.slice(0, -1));
      const unit = frequency.slice(-1);
      if (unit === 'h') return value * 60 * 60 * 1000;
      if (unit === 'd') return value * 24 * 60 * 60 * 1000;
      return 24 * 60 * 60 * 1000; // Default to 1 day
    };

    const wallpaperState = JSON.parse(localStorage.getItem('wallpaperState') || '{}');
    const lastChanged = wallpaperState.lastChanged ? new Date(wallpaperState.lastChanged).getTime() : 0;
    const frequency = getFrequencyInMs(config.wallpaperFrequency);

    const updateWallpaper = () => {
      const availableWallpapers = allWallpapers.filter(w => config.backgroundUrls.includes(w.url || w.base64));
      if (availableWallpapers.length > 0) {
        const currentIndex = availableWallpapers.findIndex(w => (w.url || w.base64) === wallpaperState.current);
        const nextIndex = (currentIndex + 1) % availableWallpapers.length;
        const newWallpaper = availableWallpapers[nextIndex];
        const newWallpaperUrl = newWallpaper.url || newWallpaper.base64;
        setCurrentWallpaper(newWallpaperUrl || '');
        localStorage.setItem('wallpaperState', JSON.stringify({ current: newWallpaper.name, lastChanged: new Date().toISOString() }));
      } else {
        setCurrentWallpaper('');
      }
    };

    if (Date.now() - lastChanged > frequency) {
      updateWallpaper();
    } else {
      const currentWallpaperName = wallpaperState.current;
      const wallpaper = allWallpapers.find(w => w.name === currentWallpaperName);
      if (wallpaper) {
        setCurrentWallpaper(wallpaper.url || wallpaper.base64 || '');
      } else {
        const firstWallpaperUrl = config.backgroundUrls[0] || '';
        const firstWallpaper = allWallpapers.find(w => (w.url || w.base64) === firstWallpaperUrl);
        setCurrentWallpaper(firstWallpaperUrl);
        if (firstWallpaper) {
          localStorage.setItem('wallpaperState', JSON.stringify({ current: firstWallpaper.name, lastChanged: new Date().toISOString() }));
        }
      }
    }
  }, [config.backgroundUrls, config.wallpaperFrequency, allWallpapers]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('config', JSON.stringify(config));
  }, [categories, config]);

  const handleSaveConfig = (newConfig: any) => {
    setConfig(newConfig);
    setIsConfigModalOpen(false);
  };

  const handleSaveWebsite = (website: Partial<Website>) => {
    if (editingWebsite) {
      const newCategories = categories.map(category => ({
        ...category,
        websites: category.websites.map(w =>
          w.id === website.id ? { ...w, ...website } : w
        ),
      }));
      setCategories(newCategories);
      setEditingWebsite(null);
    } else if (addingWebsite) {
      const newWebsite: Website = {
        id: Date.now().toString(),
        name: website.name || '',
        url: website.url || '',
        icon: website.icon || '',
        categoryId: addingWebsite.id,
      };
      const newCategories = categories.map(category =>
        category.id === addingWebsite.id
          ? { ...category, websites: [...category.websites, newWebsite] }
          : category
      );
      setCategories(newCategories);
      setAddingWebsite(null);
    }
  };

  const handleSaveCategory = (name: string) => {
    if (editingCategory) {
      const newCategories = categories.map(category =>
        category.id === editingCategory.id ? { ...category, name } : category
      );
      setCategories(newCategories);
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        name,
        websites: [],
      };
      setCategories([...categories, newCategory]);
    }
    setEditingCategory(null);
    setIsCategoryModalOpen(false);
  };

  const handleDeleteWebsite = () => {
    if (!editingWebsite) return;

    const newCategories = categories.map(category => ({
      ...category,
      websites: category.websites.filter(w => w.id !== editingWebsite.id),
    }));
    setCategories(newCategories);
    setEditingWebsite(null);
  };

  const handleDeleteCategory = () => {
    if (!editingCategory) return;

    const newCategories = categories.filter(c => c.id !== editingCategory.id);
    setCategories(newCategories);
    setEditingCategory(null);
    setIsCategoryModalOpen(false);
  };

  const handleMoveWebsite = (website: Website, direction: 'left' | 'right') => {
    const categoryIndex = categories.findIndex(c => c.id === website.categoryId);
    if (categoryIndex === -1) return;

    const category = categories[categoryIndex];
    const websiteIndex = category.websites.findIndex(w => w.id === website.id);
    if (websiteIndex === -1) return;

    const newCategories = [...categories];
    const newWebsites = [...category.websites];
    const [movedWebsite] = newWebsites.splice(websiteIndex, 1);

    if (direction === 'left') {
      const newCategoryIndex = (categoryIndex - 1 + categories.length) % categories.length;
      newCategories[categoryIndex] = { ...category, websites: newWebsites };
      const destCategory = newCategories[newCategoryIndex];
      const destWebsites = [...destCategory.websites, { ...movedWebsite, categoryId: destCategory.id }];
      newCategories[newCategoryIndex] = { ...destCategory, websites: destWebsites };
    } else {
      const newCategoryIndex = (categoryIndex + 1) % categories.length;
      newCategories[categoryIndex] = { ...category, websites: newWebsites };
      const destCategory = newCategories[newCategoryIndex];
      const destWebsites = [...destCategory.websites, { ...movedWebsite, categoryId: destCategory.id }];
      newCategories[newCategoryIndex] = { ...destCategory, websites: destWebsites };
    }

    setCategories(newCategories);
  };

  const getAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'top':
        return 'justify-start';
      case 'middle':
        return 'justify-center';
      case 'bottom':
        return 'justify-end';
      default:
        return 'justify-center';
    }
  };

  const getClockSizeClass = (size: string) => {
    switch (size) {
      case 'tiny':
        return 'text-3xl';
      case 'small':
        return 'text-4xl';
      case 'medium':
        return 'text-5xl';
      case 'large':
        return 'text-6xl';
      default:
        return 'text-5xl';
    }
  };

  const getTitleSizeClass = (size: string) => {
    switch (size) {
      case 'tiny':
        return 'text-4xl';
      case 'small':
        return 'text-5xl';
      case 'medium':
        return 'text-6xl';
      case 'large':
        return 'text-7xl';
      default:
        return 'text-6xl';
    }
  };

  const getSubtitleSizeClass = (size: string) => {
    switch (size) {
      case 'tiny':
        return 'text-lg';
      case 'small':
        return 'text-xl';
      case 'medium':
        return 'text-2xl';
      case 'large':
        return 'text-3xl';
      default:
        return 'text-2xl';
    }
  };

  const getHorizontalAlignmentClass = (alignment: string) => {
    switch (alignment) {
      case 'left':
        return 'justify-start';
      case 'middle':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-center';
    }
  };

  return (

    <main
      className={`min-h-screen w-full flex flex-col items-center ${getAlignmentClass(config.alignment)} p-4`}
    >
      <div
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-fixed -z-10"
        style={{
          backgroundImage: `url('${currentWallpaper}')`,
          filter: `blur(${config.wallpaperBlur}px) brightness(${config.wallpaperBrightness}%)`,
          opacity: `${config.wallpaperOpacity}%`,
        }}
      ></div>
      <div className="absolute top-4 left-4">
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          className="bg-black/25 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white flex items-center gap-2 hover:bg-white/25 transition-colors"
          style={{ fontSize: '12px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
          </svg>
          {isEditing ? 'Done' : ''}
        </button>
      </div>
      <div className="absolute top-4 right-4">
        <button 
          onClick={() => setIsConfigModalOpen(true)} 
          className="bg-black/25 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white flex items-center gap-2 hover:bg-white/25 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-gear-wide" viewBox="0 0 16 16">
            <path d="M8.932.727c-.243-.97-1.62-.97-1.864 0l-.071.286a.96.96 0 0 1-1.622.434l-.205-.211c-.695-.719-1.888-.03-1.613.931l.08.284a.96.96 0 0 1-1.186 1.187l-.284-.081c-.96-.275-1.65.918-.931 1.613l.211.205a.96.96 0 0 1-.434 1.622l-.286.071c-.97.243-.97 1.62 0 1.864l.286.071a.96.96 0 0 1 .434 1.622l-.211.205c-.719.695-.03 1.888.931 1.613l.284-.08a.96.96 0 0 1 1.187 1.187l-.081.283c-.275.96.918 1.65 1.613.931l.205-.211a.96.96 0 0 1 1.622.434l.071.286c.243.97 1.62.97 1.864 0l.071-.286a.96.96 0 0 1 1.622-.434l.205.211c.695.719 1.888.03 1.613-.931l-.08-.284a.96.96 0 0 1 1.187-1.187l.283.081c.96.275 1.65-.918-.931-1.613l-.211-.205a.96.96 0 0 1 .434-1.622l.286-.071c.97-.243.97-1.62 0-1.864l-.286-.071a.96.96 0 0 1-.434-1.622l.211-.205c.719-.695.03-1.888-.931-1.613l-.284.08a.96.96 0 0 1-1.187-1.186l.081-.284c.275-.96-.918-1.65-1.613-.931l-.205.211a.96.96 0 0 1-1.622-.434zM8 12.997a4.998 4.998 0 1 1 0-9.995 4.998 4.998 0 0 1 0 9.996z"/>
          </svg>
        </button>
      </div>

      {/* Absolute top-center Clock */}
      {config.clock.enabled && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex justify-center w-auto p-2">
          <Clock config={config} getClockSizeClass={getClockSizeClass} />
        </div>
      )}

      <div className={`flex flex-col ${config.alignment === 'bottom' ? 'mt-auto' : ''} items-center`}>
          {(config.title || config.subtitle) && (
            <div className="text-center">
              <h1 
                className={`${getTitleSizeClass(config.titleSize)} font-extrabold text-white tracking-tighter mb-3 mt-4`}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
              >
                {config.title}
              </h1>
              <p 
                className={`${getSubtitleSizeClass(config.subtitleSize)} text-slate-300`}
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
              >
                {config.subtitle}
              </p>
            </div>
          )}
      </div>

      <div className="flex flex-col gap-8 w-full mt-16">
        {categories.map((category) => (
          <div key={category.id} className="w-full">
            <div className={`flex ${getHorizontalAlignmentClass(config.horizontalAlignment)} items-center mb-4 w-full ${config.horizontalAlignment !== 'middle' ? 'px-8' : ''}`}>
              <h2 className={`text-2xl font-bold text-white ${config.horizontalAlignment === 'left' ? 'text-left' : config.horizontalAlignment === 'right' ? 'text-right' : 'text-center'} ${config.horizontalAlignment !== 'middle' ? 'w-full' : ''}`}>{category.name}</h2>
              {isEditing && (
                <button
                  onClick={() => {
                    setEditingCategory(category);
                    setIsCategoryModalOpen(true);
                  }}
                  className={`ml-2 text-white/50 hover:text-white transition-all duration-300 ease-in-out transform ${isEditing ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zM1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                  </svg>
                </button>
              )}
            </div>
            <div className={`flex flex-wrap ${getHorizontalAlignmentClass(config.horizontalAlignment)} gap-6`}>
              {category.websites.map((website) => (
                <WebsiteTile
                  key={website.id}
                  website={website}
                  isEditing={isEditing}
                  onEdit={setEditingWebsite}
                  onMove={handleMoveWebsite}
                  tileSize={config.tileSize}
                />
              ))}
              {isEditing && (
                <button
                  onClick={() => setAddingWebsite(category)}
                  className={`text-white/50 hover:text-white transition-all duration-300 ease-in-out transform ${isEditing ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
        {isEditing && (
          <div className={`flex justify-center transition-all duration-300 ease-in-out transform ${isEditing ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsCategoryModalOpen(true);
              }}
              className="text-white/50 hover:text-white transition-colors"
            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
            </button>
          </div>
        )}
      </div>

      {config.serverWidget.enabled && (
        <div className="absolute bottom-4 right-4">
          <ServerWidget config={config} />
        </div>
      )}

      {(editingWebsite || addingWebsite) && (
        <WebsiteEditModal
          website={editingWebsite || undefined}
          edit={!!editingWebsite}
          onClose={() => {
            setEditingWebsite(null);
            setAddingWebsite(null);
          }}
          onSave={handleSaveWebsite}
          onDelete={handleDeleteWebsite}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryEditModal
          category={editingCategory || undefined}
          edit={!!editingCategory}
          onClose={() => {
            setEditingCategory(null);
            setIsCategoryModalOpen(false);
          }}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
        />
      )}

      {isConfigModalOpen && (
        <ConfigurationModal 
          currentConfig={config}
          onClose={() => setIsConfigModalOpen(false)} 
          onSave={handleSaveConfig} 
        />
      )}
    </main>
  );
}

export default App;