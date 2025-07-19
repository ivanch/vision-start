import React, { useState, useMemo } from 'react';
import { icons } from 'lucide-react';

interface IconPickerProps {
  onSelect: (iconName: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ onSelect }) => {
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    if (!search) {
      return Object.keys(icons).slice(0, 50);
    }
    return Object.keys(icons).filter(name =>
      name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <input
        type="text"
        placeholder="Search for an icon..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
      />
      <div className="grid grid-cols-6 gap-4 max-h-60 overflow-y-auto">
        {filteredIcons.map(iconName => {
          const LucideIcon = icons[iconName as keyof typeof icons];
          return (
            <div
              key={iconName}
              onClick={() => onSelect(iconName)}
              className="cursor-pointer flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-700"
            >
              <LucideIcon color="white" size={24} />
              <span className="text-xs text-white mt-1">{iconName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IconPicker;
