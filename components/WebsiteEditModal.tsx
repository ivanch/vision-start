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
  const [iconMetadata, setIconMetadata] = useState<IconMetadata[]>(() => iconMetadataCache ?? []);
  const [iconsFetched, setIconsFetched] = useState(() => iconMetadataCache !== null);
  const debounceRef = useRef<number | null>(null);

  const ensureIconMetadata = () => {
    if (iconMetadataCache) {
      setIconMetadata(iconMetadataCache);
      return;
    }
    if (iconsFetched) return;
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
    <div className="liquid-modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
      <div className="liquid-panel liquid-modal-card rounded-3xl p-6 sm:p-8 w-full max-w-lg text-white">
        <h2 className="liquid-title-text text-3xl font-extrabold mb-6">{edit ? 'Edit Website' : 'Add Website'}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex justify-center mb-4">
            {icon ? (
              <img src={icon} alt="Website Icon" className="h-24 w-24 object-contain" />
            ) : (
              <div className="liquid-surface h-24 w-24 rounded-2xl flex items-center justify-center">
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
            className="liquid-input p-3"
          />
          <input
            type="text"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="liquid-input p-3"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                className="liquid-input p-3"
              />
              {filteredIcons.length > 0 && (
                <div className="liquid-panel liquid-dropdown-list absolute z-20 w-full rounded-xl mt-2 max-h-60 overflow-y-auto">
                  {filteredIcons.map(iconData => (
                    <div
                      key={iconData.name}
                      onClick={() => {
                        const iconUrl = `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${iconData.base}/${iconData.name}.${iconData.base}`;
                        setIcon(iconUrl);
                        setFilteredIcons([]);
                      }}
                      className="cursor-pointer flex items-center p-2 transition-colors duration-150 ease-ios hover:bg-white/20"
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
            <button onClick={fetchIcon} className="liquid-button liquid-button-secondary liquid-focus py-3 px-4">
              Fetch
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-8">
          <div>
            {edit && (
                <button onClick={onDelete} className="liquid-button liquid-button-danger liquid-focus py-2.5 px-5">
                    Delete
                </button>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={handleSave} className="liquid-button liquid-button-success liquid-focus py-2.5 px-5">
                Save
            </button>
            <button onClick={onClose} className="liquid-button liquid-button-secondary liquid-focus py-2.5 px-5">
                Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteEditModal;
