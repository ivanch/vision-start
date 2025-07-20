import React, { useState } from 'react';
import { Website } from '../types';
import { icons, ArrowLeft, ArrowRight, Pencil } from 'lucide-react';

interface WebsiteTileProps {
  website: Website;
  isEditing: boolean;
  onEdit: (website: Website) => void;
  onMove: (website: Website, direction: 'left' | 'right') => void;
  tileSize?: string;
}

const getTileSizeClass = (size: string | undefined) => {
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

const getIconSize = (size: string | undefined) => {
  switch (size) {
    case 'small':
      return 8;
    case 'medium':
      return 10;
    case 'large':
      return 12;
    default:
      return 10;
  }
}

const WebsiteTile: React.FC<WebsiteTileProps> = ({ website, isEditing, onEdit, onMove, tileSize }) => {
  const LucideIcon = icons[website.icon as keyof typeof icons];
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
    
    // Simulate loading time (dev purpose)
    // e.preventDefault();
    // setTimeout(() => {
    //   setIsLoading(false);
    // }, 3500); // Small delay to show spinner before navigation
  };

  const iconSizeClass = `w-${getIconSize(tileSize)} h-${getIconSize(tileSize)}`;
  const iconSizeLoadingClass = `w-${getIconSize(tileSize) - 4} h-${getIconSize(tileSize) - 4}`;

  return (
    <div className={`relative ${getTileSizeClass(tileSize)} transition-all duration-300 ease-in-out`}>
      <a
        href={isEditing ? undefined : website.url}
        target="_self"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group flex flex-col items-center justify-center p-4 bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl w-full h-full transform transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white/25 shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center mb-6">
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        <div className={`flex items-center transition-all duration-300 ease-in ${isLoading ? 'mt-18' : 'flex-col'} ${isLoading ? 'gap-2' : ''}`}>
          <div className={`transition-all duration-300 ease-in ${isLoading ? iconSizeLoadingClass : iconSizeClass}`}>
            {LucideIcon ? (
              <LucideIcon className={`text-white ${isLoading ? iconSizeLoadingClass : iconSizeClass}`} />
            ) : (
              <img src={website.icon} alt={`${website.name} icon`} className="object-contain" />
            )}
          </div>
          <span className={`text-slate-100 font-medium text-base tracking-wide text-center transition-all duration-300 ease-in ${isLoading ? 'text-sm' : ''}`}>
            {website.name}
          </span>
        </div>
      </a>
      {isEditing && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
          <button onClick={() => onMove(website, 'left')} className="text-white/50 hover:text-white transition-colors"><ArrowLeft size={16} /></button>
          <button onClick={() => onEdit(website)} className="text-white/50 hover:text-white transition-colors"><Pencil size={16} /></button>
          <button onClick={() => onMove(website, 'right')} className="text-white/50 hover:text-white transition-colors"><ArrowRight size={16} /></button>
        </div>
      )}
    </div>
  );
};

export default WebsiteTile;
