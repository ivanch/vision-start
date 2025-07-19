import React from 'react';
import { Website } from '../types';
import { icons, ArrowLeft, ArrowRight, Pencil } from 'lucide-react';

interface WebsiteTileProps {
  website: Website;
  isEditing: boolean;
  onEdit: (website: Website) => void;
  onMove: (website: Website, direction: 'left' | 'right') => void;
  className?: string;
}

const WebsiteTile: React.FC<WebsiteTileProps> = ({ website, isEditing, onEdit, onMove, className }) => {
  const LucideIcon = icons[website.icon as keyof typeof icons];

  return (
    <div className={`relative ${className} transition-all duration-300 ease-in-out`}>
      <a
        href={isEditing ? undefined : website.url}
        target="_self"
        rel="noopener noreferrer"
        className="group flex flex-col items-center justify-center p-4 bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl w-full h-full transform transition-all duration-300 ease-in-out hover:scale-105 hover:bg-white/25 shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
      >
        <div className="mb-2 transition-transform duration-300 group-hover:-translate-y-1">
          {LucideIcon ? (
            <LucideIcon className="h-10 w-10 text-white" />
          ) : (
            <img src={website.icon} alt={`${website.name} icon`} className="h-10 w-10 object-contain" />
          )}
        </div>
        <span className="text-slate-100 font-medium text-base tracking-wide text-center">
          {website.name}
        </span>
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
