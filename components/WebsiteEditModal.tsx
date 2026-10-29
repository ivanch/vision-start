import { useState, useEffect, useRef } from 'react';
import { Website } from '../types';
import { getWebsiteIcon } from './utils/iconService';
import { normalizeWebsiteUrl } from './utils/urlUtils';
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
  colors: string[];
}

const getIconPickUrl = (iconData: IconMetadata): string =>
  `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/${iconData.base}/${iconData.name}.${iconData.base}`;

const isIconUrl = (value: string): boolean => /^(https?:|data:image\/)/i.test(value.trim());

const WebsiteEditModal: React.FC<WebsiteEditModalProps> = ({ website, edit, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(website ? website.name : '');
  const [url, setUrl] = useState(website ? website.url : '');
  const [icon, setIcon] = useState(website ? website.icon : '');
  const [iconQuery, setIconQuery] = useState('');
  const [filteredIcons, setFilteredIcons] = useState<IconMetadata[]>([]);
  const [iconMetadata, setIconMetadata] = useState<IconMetadata[]>([]);
  const [previewFailed, setPreviewFailed] = useState(false);
  const metadataRequest = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      metadataRequest.current?.abort();
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const ensureIconMetadata = () => {
    if (iconMetadata.length > 0 || metadataRequest.current) return;
    const controller = new AbortController();
    metadataRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    fetch(new URL('icon-metadata.json', document.baseURI).href, { cache: 'force-cache', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Icon metadata is unavailable');
        return response.json();
      })
      .then(data => {
        if (controller.signal.aborted) return;
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid icon metadata');
        const iconsArray: IconMetadata[] = Object.entries(data).flatMap(([name, details]) => {
          if (!details || typeof details !== 'object' || !('base' in details) || typeof details.base !== 'string') return [];
          const colors = 'colors' in details && details.colors && typeof details.colors === 'object'
            ? Object.values(details.colors).filter((color): color is string => typeof color === 'string' && color !== name) : [];
          return [{ name, base: details.base, colors }];
        });
        setIconMetadata(iconsArray);
      })
      .catch(err => {
        if (!controller.signal.aborted) console.error('Failed to load icon metadata', err);
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (metadataRequest.current === controller) metadataRequest.current = null;
      });
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
          if (ic.colors.length > 0) {
            for (const color of ic.colors) {
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

  const handleSave = () => {
    const normalizedUrl = normalizeWebsiteUrl(url);
    if (!normalizedUrl) {
      alert('Please enter a valid website URL (http, https, ftp, or mailto).');
      return;
    }
    onSave({ id: website?.id, name: name.trim(), url: normalizedUrl, icon: resolveIcon(icon) });
  };

  const resolveIcon = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed || isIconUrl(trimmed)) return trimmed;
    const query = trimmed.toLowerCase();
    for (const ic of iconMetadata) {
      if (ic.name.toLowerCase() === query) return getIconPickUrl(ic);
      const color = ic.colors.find(c => c.toLowerCase() === query);
      if (color) return getIconPickUrl({ ...ic, name: color });
    }
    return trimmed;
  };

  const updateIcon = (value: string) => {
    setIcon(value);
    setPreviewFailed(false);
  };

  const fetchIcon = async () => {
    if (url) {
      const fetchedIcon = await getWebsiteIcon(url);
      if (fetchedIcon) updateIcon(fetchedIcon);
    }
  };

  return (
    <ModalShell
      title={edit ? 'Edit Website' : 'Add Website'}
      edit={edit}
      onClose={onClose}
      onSave={handleSave}
      canSave={name.trim() !== '' && url.trim() !== ''}
      onDelete={edit ? onDelete : undefined}
    >
      <div className="flex justify-center mb-4">
        {isIconUrl(icon) && !previewFailed ? (
          <img src={icon.trim()} alt="Website Icon" className="h-24 w-24 object-contain" onError={() => setPreviewFailed(true)} />
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
              updateIcon(e.target.value);
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
                    updateIcon(getIconPickUrl(iconData));
                    setIconQuery('');
                    setFilteredIcons([]);
                  }}
                  className="cursor-pointer flex items-center p-2 transition-colors duration-150 ease-ios hover:bg-white/20"
                >
                  <img
                    src={getIconPickUrl(iconData)}
                    alt={iconData.name}
                    loading="lazy"
                    decoding="async"
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
