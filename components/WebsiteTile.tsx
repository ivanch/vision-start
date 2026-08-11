import React, { memo, useEffect, useState } from 'react';
import { Website } from '../types';
import { cacheWebsiteIcon, getCachedWebsiteIcon, removeCachedWebsiteIcon } from './utils/iconService';
import { getTileSizeClass, getIconPixelSize, getIconLoadingPixelSize } from './utils/styleUtils';
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from './icons';

interface WebsiteTileProps {
  website: Website;
  isEditing: boolean;
  onEdit: (website: Website) => void;
  onMove: (website: Website, direction: 'left' | 'right') => void;
  tileSize?: string;
}

const WebsiteTile: React.FC<WebsiteTileProps> = ({ website, isEditing, onEdit, onMove, tileSize }) => {

  const [isLoading, setIsLoading] = useState(false);
  const [iconSource, setIconSource] = useState<string | null>(null);
  const [usingCachedIcon, setUsingCachedIcon] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setIconSource(null);
    setUsingCachedIcon(false);

    const loadIcon = async () => {
      const cachedIcon = await getCachedWebsiteIcon(website.icon);
      if (cancelled) return;

      if (cachedIcon) {
        setIconSource(cachedIcon);
        setUsingCachedIcon(cachedIcon !== website.icon);
        return;
      }

      setIconSource(website.icon);
      const newlyCachedIcon = await cacheWebsiteIcon(website.icon);
      if (!cancelled && newlyCachedIcon) {
        setIconSource(newlyCachedIcon);
        setUsingCachedIcon(newlyCachedIcon !== website.icon);
      }
    };

    void loadIcon();

    return () => {
      cancelled = true;
    };
  }, [website.icon]);

  const handleIconError = () => {
    if (!usingCachedIcon) return;
    setIconSource(website.icon);
    setUsingCachedIcon(false);
    void removeCachedWebsiteIcon(website.icon);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
  };

  const iconSizeClass = `w-[${getIconPixelSize(tileSize)}px] h-[${getIconPixelSize(tileSize)}px]`;
  const iconSizeLoadingClass = `w-[${getIconLoadingPixelSize(tileSize)}px] h-[${getIconLoadingPixelSize(tileSize)}px]`;

  return (
    <div className={`relative ${getTileSizeClass(tileSize)} transition-all duration-200 ease-ios ${isEditing ? 'mb-4' : ''}`}>
      <a
        href={isEditing ? undefined : website.url}
        target="_self"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`liquid-surface liquid-tile liquid-focus group flex flex-col items-center justify-center w-full h-full p-4 ${isEditing ? 'pb-6' : ''}`}
        aria-label={isEditing ? `${website.name} edit controls` : `Open ${website.name}`}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center mb-6">
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        <div className={`relative z-10 flex items-center transition-all duration-200 ease-ios ${isLoading ? 'translate-y-5 gap-2' : 'flex-col gap-3'}`}>
          <div className={`transition-all duration-200 ease-ios drop-shadow-[0_10px_20px_rgba(0,0,0,0.28)] ${isLoading ? iconSizeLoadingClass : iconSizeClass}`}>
            {iconSource && (
              <img
                src={iconSource}
                alt={`${website.name} icon`}
                className="object-contain w-full h-full"
                onError={handleIconError}
              />
            )}
          </div>
          <span className={`max-w-full px-1 text-slate-50 font-semibold text-base text-center leading-tight transition-all duration-200 ease-ios [text-shadow:0_2px_12px_rgba(2,6,23,0.44)] ${isLoading ? 'text-sm' : ''}`}>
            {website.name}
          </span>
        </div>
      </a>
      {isEditing && (
        <div className="liquid-surface liquid-edit-toolbar">
          <button onClick={() => onMove(website, 'left')} className="liquid-edit-action liquid-focus" aria-label={`Move ${website.name} left`}><ChevronLeftIcon size={14} /></button>
          <button onClick={() => onEdit(website)} className="liquid-edit-action liquid-focus" aria-label={`Edit ${website.name}`}><PencilIcon size={14} /></button>
          <button onClick={() => onMove(website, 'right')} className="liquid-edit-action liquid-focus" aria-label={`Move ${website.name} right`}><ChevronRightIcon size={14} /></button>
        </div>
      )}
    </div>
  );
};

export default memo(WebsiteTile);
