
import React, { useState, useRef, useEffect } from 'react';
import ToggleSwitch from './ToggleSwitch';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Server, Wallpaper } from '../types';
import { Trash } from 'lucide-react';
import Dropdown from './Dropdown';
import { baseWallpapers } from './utils/baseWallpapers';

interface ConfigurationModalProps {
  onClose: () => void;
  onSave: (config: any) => void;
  currentConfig: any;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ onClose, onSave, currentConfig }) => {
  const [config, setConfig] = useState({
    ...currentConfig,
    titleSize: currentConfig.titleSize || 'medium',
    subtitleSize: currentConfig.subtitleSize || 'medium',
    alignment: currentConfig.alignment || 'middle',
    tileSize: currentConfig.tileSize || 'medium',
    horizontalAlignment: currentConfig.horizontalAlignment || 'middle',
    wallpaperBlur: currentConfig.wallpaperBlur || 0,
    wallpaperBrightness: currentConfig.wallpaperBrightness || 100,
    wallpaperOpacity: currentConfig.wallpaperOpacity || 100,
    serverWidget: {
      enabled: false,
      pingFrequency: 15,
      servers: [],
      ...currentConfig.serverWidget,
    },
    clock: {
      enabled: true,
      size: 'medium',
      font: 'Helvetica',
      format: 'h:mm A',
      ...currentConfig.clock,
    },
  });
  const [activeTab, setActiveTab] = useState('general');
  const [newServerName, setNewServerName] = useState('');
  const [newServerAddress, setNewServerAddress] = useState('');
  const [newWallpaperName, setNewWallpaperName] = useState('');
  const [newWallpaperUrl, setNewWallpaperUrl] = useState('');
  const [userWallpapers, setUserWallpapers] = useState<Wallpaper[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedUserWallpapers = localStorage.getItem('userWallpapers');
    if (storedUserWallpapers) {
      setUserWallpapers(JSON.parse(storedUserWallpapers));
    }
  }, []);

  useEffect(() => {
    // A small timeout to allow the component to mount before starting the transition
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // This duration should match the transition duration
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('serverWidget.')) {
      const field = name.split('.')[1];
      setConfig({
        ...config,
        serverWidget: { ...config.serverWidget, [field]: value },
      });
    } else if (name.startsWith('clock.')) {
      const field = name.split('.')[1];
      setConfig({
        ...config,
        clock: { ...config.clock, [field]: value },
      });
    } else {
      setConfig({ ...config, [name]: value });
    }
  };

  const handleClockToggleChange = (checked: boolean) => {
    setConfig({ ...config, clock: { ...config.clock, enabled: checked } });
  };

  const handleServerWidgetToggleChange = (checked: boolean) => {
    setConfig({
      ...config,
      serverWidget: { ...config.serverWidget, enabled: checked },
    });
  };

  const handleAddServer = () => {
    if (newServerName.trim() === '' || newServerAddress.trim() === '') return;

    const newServer: Server = {
      id: Date.now().toString(),
      name: newServerName,
      address: newServerAddress,
    };

    setConfig({
      ...config,
      serverWidget: {
        ...config.serverWidget,
        servers: [...config.serverWidget.servers, newServer],
      },
    });

    setNewServerName('');
    setNewServerAddress('');
  };

  const handleRemoveServer = (id: string) => {
    setConfig({
      ...config,
      serverWidget: {
        ...config.serverWidget,
        servers: config.serverWidget.servers.filter((server: Server) => server.id !== id),
      },
    });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(config.serverWidget.servers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setConfig({
      ...config,
      serverWidget: {
        ...config.serverWidget,
        servers: items,
      },
    });
  };

  const handleAddWallpaper = () => {
    if (newWallpaperName.trim() === '' || newWallpaperUrl.trim() === '') return;

    const newWallpaper: Wallpaper = {
      name: newWallpaperName,
      url: newWallpaperUrl,
    };

    const updatedUserWallpapers = [...userWallpapers, newWallpaper];
    setUserWallpapers(updatedUserWallpapers);
    localStorage.setItem('userWallpapers', JSON.stringify(updatedUserWallpapers));
    setConfig({ ...config, backgroundUrl: newWallpaperUrl });

    setNewWallpaperName('');
    setNewWallpaperUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('File size exceeds 4MB. Please choose a smaller file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (base64.length > 4.5 * 1024 * 1024) {
          alert('The uploaded image is too large. Please choose a smaller file.');
          return;
        }

        const updatedUserWallpapers = userWallpapers.filter(w => !w.base64);
        const newWallpaper: Wallpaper = {
          name: file.name,
          base64,
        };
        setUserWallpapers([...updatedUserWallpapers, newWallpaper]);
        localStorage.setItem('userWallpapers', JSON.stringify([...updatedUserWallpapers, newWallpaper]));
        setConfig({ ...config, backgroundUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteWallpaper = (wallpaper: Wallpaper) => {
    const updatedUserWallpapers = userWallpapers.filter(w => w.name !== wallpaper.name);
    setUserWallpapers(updatedUserWallpapers);
    localStorage.setItem('userWallpapers', JSON.stringify(updatedUserWallpapers));

    if (config.backgroundUrl === (wallpaper.url || wallpaper.base64)) {
      const nextWallpaper = baseWallpapers[0] || updatedUserWallpapers[0];
      if (nextWallpaper) {
        setConfig({ ...config, backgroundUrl: nextWallpaper.url || nextWallpaper.base64 });
      }
    }
  };

  const allWallpapers = [...baseWallpapers, ...userWallpapers];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      ></div>

      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-black/50 backdrop-blur-xl border-l border-white/10 text-white flex flex-col transition-transform duration-300 ease-in-out transform ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-8 flex-grow overflow-y-auto">
          <h2 className="text-3xl font-bold mb-6">Configuration</h2>

          <div className="flex border-b border-white/10 mb-6">
            <button
              className={`px-4 py-2 text-lg font-semibold ${activeTab === 'general' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={`px-4 py-2 text-lg font-semibold ${activeTab === 'theme' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
              onClick={() => setActiveTab('theme')}
            >
              Theme
            </button>
            <button
              className={`px-4 py-2 text-lg font-semibold ${activeTab === 'clock' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
              onClick={() => setActiveTab('clock')}
            >
              Clock
            </button>
            <button
              className={`px-4 py-2 text-lg font-semibold ${activeTab === 'serverWidget' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}
              onClick={() => setActiveTab('serverWidget')}
            >
              Server Widget
            </button>
          </div>

          {activeTab === 'general' && (
            <div className="flex flex-col gap-6">
              <div>
                <label className="text-slate-300 text-sm font-semibold mb-2 block">Title</label>
                <input
                  type="text"
                  name="title"
                  value={config.title}
                  onChange={handleChange}
                  className="bg-white/10 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Title Size</label>
                <Dropdown
                  name="titleSize"
                  value={config.titleSize}
                  onChange={handleChange}
                  options={[
                    { value: 'tiny', label: 'Tiny' },
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-semibold mb-2 block">Subtitle</label>
                <input
                  type="text"
                  name="subtitle"
                  value={config.subtitle}
                  onChange={handleChange}
                  className="bg-white/10 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Subtitle Size</label>
                <Dropdown
                  name="subtitleSize"
                  value={config.subtitleSize}
                  onChange={handleChange}
                  options={[
                    { value: 'tiny', label: 'Tiny' },
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Vertical Alignment</label>
                <Dropdown
                  name="alignment"
                  value={config.alignment}
                  onChange={handleChange}
                  options={[
                    { value: 'top', label: 'Top' },
                    { value: 'middle', label: 'Middle' },
                    { value: 'bottom', label: 'Bottom' },
                  ]}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Tile Size</label>
                <Dropdown
                  name="tileSize"
                  value={config.tileSize}
                  onChange={handleChange}
                  options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Horizontal Alignment</label>
                <Dropdown
                  name="horizontalAlignment"
                  value={config.horizontalAlignment}
                  onChange={handleChange}
                  options={[
                    { value: 'left', label: 'Left' },
                    { value: 'middle', label: 'Middle' },
                    { value: 'right', label: 'Right' },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Background</label>
                <Dropdown
                  name="backgroundUrl"
                  value={config.backgroundUrl}
                  onChange={handleChange}
                  options={allWallpapers.map(w => ({ 
                    value: w.url || w.base64 || '', 
                    label: (
                      <div className="flex items-center justify-between">
                        {w.name}
                        {!baseWallpapers.includes(w) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWallpaper(w);
                            }}
                            className="text-red-500 hover:text-red-400 ml-4"
                          >
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    )
                  }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Wallpaper Blur</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    name="wallpaperBlur"
                    min="0"
                    max="50"
                    value={config.wallpaperBlur}
                    onChange={handleChange}
                    className="w-48"
                  />
                  <span>{config.wallpaperBlur}px</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Wallpaper Brightness</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    name="wallpaperBrightness"
                    min="0"
                    max="200"
                    value={config.wallpaperBrightness}
                    onChange={handleChange}
                    className="w-48"
                  />
                  <span>{config.wallpaperBrightness}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Wallpaper Opacity</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    name="wallpaperOpacity"
                    min="1"
                    max="100"
                    value={config.wallpaperOpacity}
                    onChange={handleChange}
                    className="w-48"
                  />
                  <span>{config.wallpaperOpacity}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-slate-300 text-sm font-semibold mb-2">Add New Wallpaper</h3>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="Wallpaper Name"
                    value={newWallpaperName}
                    onChange={(e) => setNewWallpaperName(e.target.value)}
                    className="bg-white/10 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={newWallpaperUrl}
                      onChange={(e) => setNewWallpaperUrl(e.target.value)}
                      className="bg-white/10 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                    <button
                      onClick={handleAddWallpaper}
                      className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-white/5 border-white/20 hover:bg-white/10"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-400">PNG, JPG, WEBP, etc.</p>
                      </div>
                      <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} ref={fileInputRef} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clock' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Enable Clock</label>
                <ToggleSwitch
                  checked={config.clock.enabled}
                  onChange={handleClockToggleChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Clock Size</label>
                <Dropdown
                  name="clock.size"
                  value={config.clock.size}
                  onChange={handleChange}
                  options={[
                    { value: 'tiny', label: 'Tiny' },
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Clock Font</label>
                <Dropdown
                  name="clock.font"
                  value={config.clock.font}
                  onChange={handleChange}
                  options={[
                    { value: 'Helvetica', label: 'Helvetica' },
                    { value: `'Orbitron', sans-serif`, label: 'Orbitron' },
                    { value: 'monospace', label: 'Monospace' },
                    { value: 'cursive', label: 'Cursive' },
                  ]}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Time Format</label>
                <Dropdown
                  name="clock.format"
                  value={config.clock.format}
                  onChange={handleChange}
                  options={[
                    { value: 'h:mm A', label: 'AM/PM' },
                    { value: 'HH:mm', label: '24:00' },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'serverWidget' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-sm font-semibold">Enable Server Widget</label>
                <ToggleSwitch
                  checked={config.serverWidget.enabled}
                  onChange={handleServerWidgetToggleChange}
                />
              </div>
              {config.serverWidget.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 text-sm font-semibold">Ping Frequency</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        name="serverWidget.pingFrequency"
                        min="5"
                        max="60"
                        value={config.serverWidget.pingFrequency}
                        onChange={handleChange}
                        className="w-48"
                      />
                      <span>{config.serverWidget.pingFrequency}s</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-slate-300 text-sm font-semibold mb-2">Servers</h3>
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="servers">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-2">
                            {config.serverWidget.servers.map((server: Server, index: number) => (
                              <Draggable key={server.id} draggableId={server.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="flex items-center justify-between bg-white/10 p-2 rounded-lg"
                                  >
                                    <div>
                                      <p className="font-semibold">{server.name}</p>
                                      <p className="text-sm text-slate-400">{server.address}</p>
                                    </div>
                                    <button
                                      onClick={() => handleRemoveServer(server.id)}
                                      className="text-red-500 hover:text-red-400"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Server Name"
                        value={newServerName}
                        onChange={(e) => setNewServerName(e.target.value)}
                        className="bg-white/10 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                      <input
                        type="text"
                        placeholder="HTTP Address"
                        value={newServerAddress}
                        onChange={(e) => setNewServerAddress(e.target.value)}
                        className="bg-white/10 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                      <button
                        onClick={handleAddServer}
                        className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 px-4 rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="p-8 border-t border-white/10">
            <div className="flex justify-end gap-4">
                <button onClick={() => onSave(config)} className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-6 rounded-lg">
                    Save & Close
                </button>
                <button onClick={handleClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">
                    Cancel
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationModal;
