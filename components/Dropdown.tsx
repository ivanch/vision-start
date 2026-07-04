import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  options: { value: string; label: string }[];
  value: string | string[];
  onChange: (e: { target: { name: string; value: string | string[] } }) => void;
  name?: string;
  multiple?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ options, value, onChange, name, multiple = false, ...rest }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    let newValue: string | string[];
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        newValue = currentValues.filter((v) => v !== optionValue);
      } else {
        newValue = [...currentValues, optionValue];
      }
    } else {
      newValue = optionValue;
      setIsOpen(false);
    }

    const syntheticEvent = {
      target: {
        name: name || '',
        value: newValue,
      },
    };
    onChange(syntheticEvent as any);
  };

  const selectedOptionLabel = (() => {
    if (multiple) {
      if (Array.isArray(value) && value.length > 0) {
        if (value.length === 1) {
          return options.find((o) => o.value === value[0])?.label || '';
        }
        return `${value.length} selected`;
      }
      return 'Select...';
    }
    return options.find((option) => option.value === value)?.label || 'Select...';
  })();

  const isSelected = (optionValue: string) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return optionValue === value;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="liquid-surface liquid-focus rounded-xl px-3 text-white text-sm w-44 h-11 flex justify-between items-center transition-all duration-200 ease-ios hover:border-white/30"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        {...rest}
      >
        <span className="truncate">{selectedOptionLabel}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ease-ios ${isOpen ? 'rotate-180' : 'rotate-0'}`}
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
          className="liquid-panel liquid-dropdown-list absolute z-10 mt-2 w-full rounded-xl overflow-hidden"
          role="listbox"
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={`h-10 px-3 text-white cursor-pointer transition-all duration-150 ease-ios flex items-center
                ${
                  isSelected(option.value)
                    ? 'bg-cyan-400/20 text-cyan-200'
                    : 'hover:bg-white/20 hover:text-white'
                }`}
              role="option"
              aria-selected={isSelected(option.value)}
            >
              <span className="truncate">{option.label}</span>
            </li>
          ))}
        </ul>
      )}

      {name && !multiple && <input type="hidden" name={name} value={value as string} />}
    </div>
  );
};

export default Dropdown;
