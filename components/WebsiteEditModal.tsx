import { useState, useEffect, useRef } from 'react';
import { Website } from '../types';
import { getWebsiteIcon } from './utils/iconService';
import ModalShell from './ModalShell';

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

const getIconPickUrl = (iconData: IconMetadata): string =>
  `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${iconData.base}/${iconData.name}.${iconData.base}`;

const WebsiteEditModal: React.FC<WebsiteEditModalProps> = ({ website, edit, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(website ? website.name : '');
  const [url, setUrl] = useState(website ? website.url : '');
  const [icon, setIcon] = useState(website ? website.icon : '');
  const [iconQuery, setIconQuery] = useState('');
  const [filteredIcons, setFilteredIcons] = useState<IconMetadata[]>([]);
  const [iconMetadata, setIconMetadata] = useState<IconMetadata[]>(() => iconMetadataCache ?? []);
  const [iconsFetched, setIconsFetched] = useState(() => iconMetadataCache !== null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      iconMetadataCache = null;
    };
  }, []);

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
          if (ic.colors && typeof ic.colors === 'object') {
            const colors = Object.values(ic.colors).filter(key => typeof key === 'string' && key !== ic.name);
            for (const color of colors as string[]) {
              if (color.toLowerCase().includes(lowerCaseQuery)) {
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

  return (
    <ModalShell
      title={edit ? 'Edit Website' : 'Add Website'}
      edit={edit}
      onClose={onClose}
      onSave={() => onSave({ id: website?.id, name, url, icon })}
      onDelete={edit ? onDelete : undefined}
    >
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
              {filteredIcons.map((iconData, index) => (
                <div
                  key={`${iconData.name}-${index}`}
                  onClick={() => {
                    setIcon(getIconPickUrl(iconData));
                    setFilteredIcons([]);
                  }}
                  className="cursor-pointer flex items-center p-2 transition-colors duration-150 ease-ios hover:bg-white/20"
                >
                  <img
                    src={getIconPickUrl(iconData)}
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
    </ModalShell>
  );
};

export default WebsiteEditModal;