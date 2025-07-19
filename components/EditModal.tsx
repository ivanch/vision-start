import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { getWebsiteIcon } from './utils/iconService';
import { Category, Website } from '../types';
import IconPicker from './IconPicker';
import { icons } from 'lucide-react';

interface EditModalProps {
  categories: Category[];
  onClose: () => void;
  onSave: (categories: Category[]) => void;
}

const EditModal: React.FC<EditModalProps> = ({ categories, onClose, onSave }) => {
  const [localCategories, setLocalCategories] = useState(categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newWebsite, setNewWebsite] = useState({ name: '', url: '', icon: '' });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      const category = localCategories.find(cat => cat.id === source.droppableId);
      if (category) {
        const items = Array.from(category.websites);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        const updatedCategories = localCategories.map(cat => 
          cat.id === category.id ? { ...cat, websites: items } : cat
        );
        setLocalCategories(updatedCategories);
      }
    } else {
      const sourceCategory = localCategories.find(cat => cat.id === source.droppableId);
      const destCategory = localCategories.find(cat => cat.id === destination.droppableId);
      if (sourceCategory && destCategory) {
        const sourceItems = Array.from(sourceCategory.websites);
        const [movedItem] = sourceItems.splice(source.index, 1);
        const destItems = Array.from(destCategory.websites);
        destItems.splice(destination.index, 0, { ...movedItem, categoryId: destCategory.id });

        const updatedCategories = localCategories.map(cat => {
          if (cat.id === sourceCategory.id) return { ...cat, websites: sourceItems };
          if (cat.id === destCategory.id) return { ...cat, websites: destItems };
          return cat;
        });
        setLocalCategories(updatedCategories);
      }
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') return;
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      websites: [],
    };
    setLocalCategories([...localCategories, newCategory]);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (id: string) => {
    const updatedCategories = localCategories.filter(cat => cat.id !== id);
    setLocalCategories(updatedCategories);
    if (selectedCategoryId === id) {
      setSelectedCategoryId(updatedCategories[0]?.id || null);
    }
  };

  const handleAddWebsite = async () => {
    if (!selectedCategoryId || !newWebsite.name || !newWebsite.url) return;

    let icon = newWebsite.icon;
    if (!icon || !Object.keys(icons).includes(icon)) {
        icon = await getWebsiteIcon(newWebsite.url);
    }

    const newWebsiteData: Website = {
      id: Date.now().toString(),
      name: newWebsite.name,
      url: newWebsite.url,
      icon,
      categoryId: selectedCategoryId,
    };

    const updatedCategories = localCategories.map(cat => {
      if (cat.id === selectedCategoryId) {
        return { ...cat, websites: [...cat.websites, newWebsiteData] };
      }
      return cat;
    });

    setLocalCategories(updatedCategories);
    setNewWebsite({ name: '', url: '', icon: '' });
  };

  const handleRemoveWebsite = (categoryId: string, websiteId: string) => {
    const updatedCategories = localCategories.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, websites: cat.websites.filter(web => web.id !== websiteId) };
      }
      return cat;
    });
    setLocalCategories(updatedCategories);
  };

  const selectedCategory = localCategories.find(cat => cat.id === selectedCategoryId);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-4xl text-white">
        <h2 className="text-3xl font-bold mb-6">Edit Bookmarks</h2>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-1">
            <h3 className="text-xl font-semibold mb-4">Categories</h3>
            <div className="flex flex-col gap-2 mb-4">
              {localCategories.map(category => (
                <div 
                  key={category.id} 
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer ${selectedCategoryId === category.id ? 'bg-cyan-500/50' : 'bg-white/10'}`}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <span>{category.name}</span>
                  <button onClick={() => handleRemoveCategory(category.id)} className="text-red-500 hover:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-white/10 p-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <button onClick={handleAddCategory} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-2 px-4 rounded-lg">
                Add
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <h3 className="text-xl font-semibold mb-4">Websites</h3>
            {selectedCategory && (
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId={selectedCategory.id}>
                  {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef} className="mb-8">
                      {selectedCategory.websites.map((website, index) => (
                        <Draggable key={website.id} draggableId={website.id} index={index}>
                          {(provided) => (
                            <li
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center justify-between bg-white/10 p-3 rounded-lg mb-3"
                            >
                              <div className="flex items-center">
                                {Object.keys(icons).includes(website.icon) ? (
                                  React.createElement(icons[website.icon as keyof typeof icons], { className: "h-8 w-8 mr-4" })
                                ) : (
                                  <img src={website.icon} alt={website.name} className="h-8 w-8 mr-4" />
                                )}
                                <span>{website.name}</span>
                              </div>
                              <button onClick={() => handleRemoveWebsite(selectedCategory.id, website.id)} className="text-red-500 hover:text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            <div>
              <h3 className="text-xl font-semibold mb-4">Add New Bookmark</h3>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newWebsite.name}
                  onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                  className="bg-white/10 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <input
                  type="text"
                  placeholder="URL"
                  value={newWebsite.url}
                  onChange={(e) => setNewWebsite({ ...newWebsite, url: e.target.value })}
                  className="bg-white/10 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Icon URL or name"
                    value={newWebsite.icon}
                    onChange={(e) => setNewWebsite({ ...newWebsite, icon: e.target.value })}
                    className="bg-white/10 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 w-full"
                  />
                  <button onClick={() => setShowIconPicker(!showIconPicker)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg">
                    {showIconPicker ? 'Close' : 'Select Icon'}
                  </button>
                </div>
                {showIconPicker && (
                  <IconPicker
                    onSelect={(iconName) => {
                      setNewWebsite({ ...newWebsite, icon: iconName });
                      setShowIconPicker(false);
                    }}
                  />
                )}
                <button onClick={handleAddWebsite} className="bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-3 px-4 rounded-lg">
                  Add Bookmark
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button onClick={() => onSave(localCategories)} className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-6 rounded-lg">
            Save
          </button>
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
