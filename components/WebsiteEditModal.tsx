import React, { useState, useEffect } from 'react';
import { Website } from '../types';
import IconPicker from './IconPicker';
import { getWebsiteIcon } from './utils/iconService';
import { icons } from 'lucide-react';

interface WebsiteEditModalProps {
  website?: Website;
  edit: boolean;
  onClose: () => void;
  onSave: (website: Partial<Website>) => void;
  onDelete: () => void;
}

const WebsiteEditModal: React.FC<WebsiteEditModalProps> = ({ website, edit, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(website ? website.name : '');
  const [url, setUrl] = useState(website ? website.url : '');
  const [icon, setIcon] = useState(website ? website.icon : '');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    const fetchIcon = async () => {
      if (url) {
        const fetchedIcon = await getWebsiteIcon(url);
        setIcon(fetchedIcon);
      }
    };
    fetchIcon();
  }, [url]);

  const handleSave = () => {
    onSave({ id: website?.id, name, url, icon });
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const LucideIcon = icons[icon as keyof typeof icons];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-lg text-white">
        <h2 className="text-3xl font-bold mb-6">{edit ? 'Edit Website' : 'Add Website'}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center mb-4">
            {LucideIcon ? (
              <LucideIcon className="h-24 w-24 text-white" />
            ) : (
              <img src={icon} alt="Website Icon" className="h-24 w-24 object-contain" />
            )}
          </div>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/10 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white/10 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Icon URL or name"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="bg-white/10 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
            />
            <button onClick={() => setShowIconPicker(!showIconPicker)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg">
              {showIconPicker ? 'Close' : 'Select Icon'}
            </button>
          </div>
          {showIconPicker && (
            <IconPicker
              onSelect={(iconName) => {
                setIcon(iconName);
                setShowIconPicker(false);
              }}
            />
          )}
        </div>
        <div className="flex justify-between items-center mt-8">
          <div>
            {edit && (
                <button onClick={onDelete} className="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-6 rounded-lg">
                    Delete
                </button>
            )}
          </div>
          <div className="flex justify-end gap-4">
            <button onClick={handleSave} className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-6 rounded-lg">
                Save
            </button>
            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">
                Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteEditModal;
