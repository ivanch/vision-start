import React, { memo } from 'react';
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
  horizontalAlignment: string;
  tileSize?: string;
}

const getAddTileSizeClass = (size: string | undefined) => {
  switch (size) {
    case 'small':
      return 'w-28 h-28';
    case 'medium':
      return 'w-32 h-32';
    case 'large':
      return 'w-36 h-36';
    default:
      return 'w-32 h-32';
  }
};

const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  isEditing,
  setEditingCategory,
  setIsCategoryModalOpen,
  setAddingWebsite,
  setEditingWebsite,
  handleMoveWebsite,
  getHorizontalAlignmentClass,
  horizontalAlignment,
  tileSize,
}) => {
  return (
    <div key={category.id} className="w-full">
      <div className={`flex ${getHorizontalAlignmentClass(horizontalAlignment)} items-center mb-3 w-full ${horizontalAlignment !== 'middle' ? 'px-3 sm:px-8' : ''}`}>
        <h2 className={`liquid-category-title text-2xl font-extrabold text-white ${horizontalAlignment === 'left' ? 'text-left' : horizontalAlignment === 'right' ? 'text-right' : 'text-center'} ${horizontalAlignment !== 'middle' ? 'w-full' : ''}`}>{category.name}</h2>
        {isEditing && (
          <button
            onClick={() => {
              setEditingCategory(category);
              setIsCategoryModalOpen(true);
            }}
            className={`liquid-surface liquid-edit-action liquid-focus ml-2 shrink-0 transition-all duration-300 ease-spring transform ${isEditing ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
            aria-label={`Edit ${category.name} category`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
            </svg>
          </button>
        )}
      </div>
      <div className={`flex flex-wrap ${getHorizontalAlignmentClass(horizontalAlignment)} gap-5 sm:gap-6 px-1 sm:px-0`}>
        {category.websites.map((website) => (
          <WebsiteTile
            key={website.id}
            website={website}
            isEditing={isEditing}
            onEdit={setEditingWebsite}
            onMove={handleMoveWebsite}
            tileSize={tileSize}
          />
        ))}
        {isEditing && (
          <button
            onClick={() => setAddingWebsite(category)}
            className={`liquid-surface liquid-control liquid-ghost-tile liquid-focus flex-col ${getAddTileSizeClass(tileSize)} transition-all duration-300 ease-spring transform ${isEditing ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
            aria-label={`Add website to ${category.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
            <span className="text-sm font-bold">Add</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(CategoryGroup);
