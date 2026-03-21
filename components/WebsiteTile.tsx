import React, { useState } from 'react';
import { Website } from '../types';

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


// Returns normal icon size in px
const getIconPixelSize = (size: string | undefined): number => {
  switch (size) {
    case 'small':
      return 34;
    case 'medium':
      return 42;
    case 'large':
      return 48;
    default:
      return 40;
  }
};

// Returns loading icon size in px
const getIconLoadingPixelSize = (size: string | undefined): number => {
  switch (size) {
    case 'small':
      return 24;
    case 'medium':
      return 32;
    case 'large':
      return 40;
    default:
      return 32;
  }
};

const WebsiteTile: React.FC<WebsiteTileProps> = ({ website, isEditing, onEdit, onMove, tileSize }) => {

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

  const iconSizeClass = `w-[${getIconPixelSize(tileSize)}px] h-[${getIconPixelSize(tileSize)}px]`;
  const iconSizeLoadingClass = `w-[${getIconLoadingPixelSize(tileSize)}px] h-[${getIconLoadingPixelSize(tileSize)}px]`;

  return (
    <div className={`relative ${getTileSizeClass(tileSize)} transition-all duration-200 ease-ios`}>
      <a
        href={isEditing ? undefined : website.url}
        target="_self"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group flex flex-col items-center justify-center p-4 bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl w-full h-full transform transition-all duration-200 ease-ios hover:scale-[1.04] active:scale-[0.96] hover:bg-white/25 shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center mb-6">
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        <div className={`flex items-center transition-all duration-200 ease-ios ${isLoading ? 'mt-18' : 'flex-col'} ${isLoading ? 'gap-2' : ''}`}>
          <div className={`transition-all duration-200 ease-ios ${isLoading ? iconSizeLoadingClass : iconSizeClass}`}>
            <img src={website.icon} alt={`${website.name} icon`} className={`object-contain w-full h-full`} />
          </div>
          <span className={`text-slate-100 font-medium text-base tracking-wide text-center transition-all duration-200 ease-ios ${isLoading ? 'text-sm' : ''}`}>
            {website.name}
          </span>
        </div>
      </a>
      {isEditing && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
          <button onClick={() => onMove(website, 'left')} className="text-white/50 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
          </svg></button>
          <button onClick={() => onEdit(website)} className="text-white/50 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
          </svg></button>
          <button onClick={() => onMove(website, 'right')} className="text-white/50 hover:text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z" />
          </svg></button>
        </div>
      )}
    </div>
  );
};

export default WebsiteTile;
