import React, { memo } from 'react';
import WebsiteTile from '../WebsiteTile';
import { Category, Website } from '../../types';
import { getTileSizeClass, getAlignmentClass } from '../utils/styleUtils';
import { PencilIcon, PlusIcon } from '../icons';

interface CategoryGroupProps {
  category: Category;
  isEditing: boolean;
  setEditingCategory: (category: Category) => void;
  setIsCategoryModalOpen: (isOpen: boolean) => void;
  setAddingWebsite: (category: Category) => void;
  setEditingWebsite: (website: Website) => void;
  handleMoveWebsite: (website: Website, direction: 'left' | 'right') => void;
  horizontalAlignment: string;
  tileSize?: string;
}

const CategoryGroup: React.FC<CategoryGroupProps> = ({
  category,
  isEditing,
  setEditingCategory,
  setIsCategoryModalOpen,
  setAddingWebsite,
  setEditingWebsite,
  handleMoveWebsite,
  horizontalAlignment,
  tileSize,
}) => {
  return (
    <div key={category.id} className="w-full">
      <div className={`flex ${getAlignmentClass(horizontalAlignment)} items-center mb-3 w-full ${horizontalAlignment !== 'middle' ? 'px-3 sm:px-8' : ''}`}>
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
            <PencilIcon size={14} />
          </button>
        )}
      </div>
      <div className={`flex flex-wrap ${getAlignmentClass(horizontalAlignment)} gap-5 sm:gap-6 px-1 sm:px-0`}>
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
            className={`liquid-surface liquid-control liquid-ghost-tile liquid-focus flex-col ${getTileSizeClass(tileSize)} transition-all duration-300 ease-spring transform ${isEditing ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
            aria-label={`Add website to ${category.name}`}
          >
            <PlusIcon size={28} />
            <span className="text-sm font-bold">Add</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default memo(CategoryGroup);