import React from 'react';
import WebsiteTile from '../WebsiteTile';
import { Category, Website } from '../../types';

interface CategoryGroupProps {
  category: Category;
  isEditing: boolean;
  setEditingCategory: (category: Category) => void;
  setIsCategoryModalOpen: (isOpen: boolean) => void;
  setAddingWebsite: (category: Category) => void;
  setEditingWebsite: (website: Website) => void;
  handleMoveWebsite: (website: Website, direction: 'left' | 'right') => void;
  getHorizontalAlignmentClass: (alignment: string) => string;
  config: {
    horizontalAlignment: string;
    tileSize?: string;
  };
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  isEditing,
  setEditingCategory,
  setIsCategoryModalOpen,
  setAddingWebsite,
  setEditingWebsite,
  handleMoveWebsite,
  getHorizontalAlignmentClass,
  config,
}) => {
  return (
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
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
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
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryGroup;
