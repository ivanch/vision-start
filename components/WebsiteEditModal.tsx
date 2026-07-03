import { useState, useEffect, useRef } from 'react';
import { Website } from '../types';
import { getWebsiteIcon } from './utils/iconService';

interface WebsiteEditModalProps {
  website?: Website;
  edit: boolean;
  onClose: () => void;
  onSave: (website: Partial<Website>) => void;
  onDelete: () => void;
}

interface IconMetadata {
  name: string;
  base: string;
  aliases: string[];
  categories: string[];
  update: {
    timestamp: string;
    author: {
      id: number;
      name: string;
    };
  };
  colors: any;
}

let iconMetadataCache: IconMetadata[] | null = null;

const WebsiteEditModal: React.FC<WebsiteEditModalProps> = ({ website, edit, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(website ? website.name : '');
  const [url, setUrl] = useState(website ? website.url : '');
  const [icon, setIcon] = useState(website ? website.icon : '');
  const [iconQuery, setIconQuery] = useState('');
  const [filteredIcons, setFilteredIcons] = useState<IconMetadata[]>([]);
  const [iconMetadata, setIconMetadata] = useState<IconMetadata[]>([]);
  const [iconsFetched, setIconsFetched] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const ensureIconMetadata = () => {
    if (iconMetadataCache || iconsFetched) return;
    setIconsFetched(true);
    fetch('/icon-metadata.json', { cache: 'force-cache' })
      .then(response => response.json())
      .then(data => {
        const iconsArray: IconMetadata[] = Object.entries(data).map(([name, details]) => ({
          name,
          ...(details as object),
        })) as IconMetadata[];
        iconMetadataCache = iconsArray;
        setIconMetadata(iconsArray);
      })
      .catch(err => console.error('Failed to load icon metadata', err));
  };

  useEffect(() => {
    if (iconQuery && Array.isArray(iconMetadata) && iconMetadata.length > 0) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        const lowerCaseQuery = iconQuery.toLowerCase();
        const filtered: IconMetadata[] = [];
        for (const ic of iconMetadata) {
          if (ic.name.toLowerCase().includes(lowerCaseQuery)) {
            filtered.push(ic);
            if (filtered.length >= 50) break;
          }
          if (ic.colors) {
            const colors = Object.values(ic.colors).filter(key => key !== ic.name);
            for (const color of colors) {
              if (typeof color === 'string' && color.toLowerCase().includes(lowerCaseQuery)) {
                filtered.push({ ...ic, name: color });
                if (filtered.length >= 50) break;
              }
            }
            if (filtered.length >= 50) break;
          }
        }
        setFilteredIcons(filtered);
      }, 150);
      return () => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
      };
    } else {
      setFilteredIcons([]);
    }
  }, [iconQuery, iconMetadata]);

  const fetchIcon = async () => {
    if (url) {
      const fetchedIcon = await getWebsiteIcon(url);
      setIcon(fetchedIcon);
    }
  };

  const handleSave = () => {
    onSave({ id: website?.id, name, url, icon });
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-lg text-white">
        <h2 className="text-3xl font-bold mb-6">{edit ? 'Edit Website' : 'Add Website'}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center mb-4">
            {icon ? (
              <img src={icon} alt="Website Icon" className="h-24 w-24 object-contain" />
            ) : (
              <div className="h-24 w-24 bg-white/10 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 18 15.3 15.3 0 0 1-8 0 15.3 15.3 0 0 1 4-18z"></path>
                </svg>
              </div>
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
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Icon URL or name"
                value={icon}
                onChange={(e) => {
                  setIcon(e.target.value);
                  setIconQuery(e.target.value);
                }}
                onFocus={ensureIconMetadata}
                className="bg-white/10 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
              />
              {filteredIcons.length > 0 && (
                <div className="absolute z-10 w-full bg-gray-800 rounded-lg mt-1 max-h-60 overflow-y-auto">
                  {filteredIcons.map(iconData => (
                    <div
                      key={iconData.name}
                      onClick={() => {
                        const iconUrl = `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${iconData.base}/${iconData.name}.${iconData.base}`;
                        setIcon(iconUrl);
                        setFilteredIcons([]);
                      }}
                      className="cursor-pointer flex items-center p-2 hover:bg-gray-700"
                    >
                      <img
                        src={`https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${iconData.base}/${iconData.name}.${iconData.base}`}
                        alt={iconData.name}
                        className="h-6 w-6 mr-2"
                      />
                      <span>{iconData.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={fetchIcon} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg">
              Fetch
            </button>
          </div>
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