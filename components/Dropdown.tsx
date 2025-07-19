import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (e: { target: { name: string; value: string } }) => void;
  name?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange, name, ...rest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOptionLabel = options.find(option => option.value === value)?.label || '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue: string) => {
    const syntheticEvent = {
      target: {
        name: name || '',
        value: optionValue,
      },
    };
    onChange(syntheticEvent);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="bg-black/5 backdrop-blur-md border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 w-40 h-10 flex justify-between items-center transition-all duration-200 hover:bg-white/5"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        {...rest}
      >
        <span className="truncate">{selectedOptionLabel}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          className="absolute z-10 mt-1 w-full bg-black/70 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200"
          role="listbox"
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`h-10 px-3 text-white cursor-pointer transition-all duration-150 ease-in-out flex items-center
                ${option.value === value 
                  ? 'bg-cyan-500/20 text-cyan-300' 
                  : 'hover:bg-white/20 hover:text-white hover:shadow-lg'
                }`}
              role="option"
              aria-selected={option.value === value}
            >
              <span className="truncate">{option.label}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Hidden input to mimic native select behavior for forms */}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
};

export default Dropdown;
