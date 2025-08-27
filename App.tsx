import { useState, useEffect } from 'react';
import ConfigurationModal from './components/ConfigurationModal';
import ServerWidget from './components/ServerWidget';
import { DEFAULT_CATEGORIES } from './constants';
import { Category, Website, Config } from './types';
import WebsiteEditModal from './components/WebsiteEditModal';
import CategoryEditModal from './components/CategoryEditModal';
import Header from './components/layout/Header';
import EditButton from './components/layout/EditButton';
import ConfigurationButton from './components/layout/ConfigurationButton';
import CategoryGroup from './components/layout/CategoryGroup';
import Wallpaper from './components/Wallpaper';

const defaultConfig: Config = {
  title: 'Vision Start',
  currentWallpapers: ['Abstract'],
  wallpaperFrequency: '1d',
  wallpaperBlur: 0,
  wallpaperBrightness: 100,
  wallpaperOpacity: 100,
  titleSize: 'medium',
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
  const [config, setConfig] = useState<Config>(() => {
    try {
      const storedConfig = localStorage.getItem('config');
      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        return { ...defaultConfig, ...parsedConfig };
      }
    } catch (error) {
      console.error('Error parsing config from localStorage', error);
    }
    return { ...defaultConfig };
  });

  useEffect(() => {
    localStorage.setItem('config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem('categories', JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories to localStorage', error);
    }
  }, [categories]);

  const handleSaveConfig = (newConfig: Config) => {
    setConfig(newConfig);
    setIsConfigModalOpen(false);
  };

  const handleWallpaperChange = (newConfig: Partial<Config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleSaveWebsite = (website: Partial<Website>) => {
    if (editingWebsite) {
      const idToUpdate = website.id ?? editingWebsite.id;
      const newCategories = categories.map(category => ({
        ...category,
        websites: category.websites.map(w =>
          w.id === idToUpdate ? { ...w, ...website, id: idToUpdate } : w
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
    const categoryIndex = categories.findIndex(cat => cat.websites.some(w => w.id === website.id));
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
      <Wallpaper
        wallpaperNames={config.currentWallpapers}
        blur={config.wallpaperBlur}
        brightness={config.wallpaperBrightness}
        opacity={config.wallpaperOpacity}
        wallpaperFrequency={config.wallpaperFrequency}
      />
      <EditButton isEditing={isEditing} onClick={() => setIsEditing(!isEditing)} />
      <ConfigurationButton onClick={() => setIsConfigModalOpen(true)} />

      <Header config={config} />

      <div className="flex flex-col gap-8 w-full mt-16">
        {categories.map((category) => (
          <CategoryGroup
            key={category.id}
            category={category}
            isEditing={isEditing}
            setEditingCategory={setEditingCategory}
            setIsCategoryModalOpen={setIsCategoryModalOpen}
            setAddingWebsite={setAddingWebsite}
            setEditingWebsite={setEditingWebsite}
            handleMoveWebsite={handleMoveWebsite}
            getHorizontalAlignmentClass={getHorizontalAlignmentClass}
            config={config}
          />
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

      {config.serverWidget.enabled && <ServerWidget config={config} />}

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
          onWallpaperChange={handleWallpaperChange}
        />
      )}
    </main>
  );
}

export default App;