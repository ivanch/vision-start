import React from 'react';

interface ConfigurationButtonProps {
  onClick: () => void;
}

const ConfigurationButton: React.FC<ConfigurationButtonProps> = ({ onClick }) => {
  return (
    <div className="absolute top-4 right-4">
      <button
        onClick={onClick}
        className="bg-black/25 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white flex items-center gap-2 hover:bg-white/25 transition-colors"
      >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.31-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.51.51 1.31.61 1.82.33.51-.28 1-.81 1-1.51V3a2 2 0 1 1 4 0v.09c0 .7.49 1.23 1 1.51.51.28 1.31.18 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82c.2.6.81 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.7 0-1.31.4-1.51 1z"/>
          </svg>
      </button>
    </div>
  );
};

export default ConfigurationButton;
