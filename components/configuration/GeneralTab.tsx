import React from 'react';
import Dropdown from '../Dropdown';
import { Config } from '../../types';

interface GeneralTabProps {
  config: Config;
  onChange: (updates: Partial<Config>) => void;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ config, onChange }) => {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-slate-300 text-sm font-semibold mb-2 block">Title</label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="bg-white/10 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-slate-300 text-sm font-semibold">Title Size</label>
        <Dropdown
          name="titleSize"
          value={config.titleSize}
          onChange={(e) => onChange({ titleSize: e.target.value as string })}
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
          onChange={(e) => onChange({ alignment: e.target.value as string })}
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
          value={config.tileSize || 'medium'}
          onChange={(e) => onChange({ tileSize: e.target.value as string })}
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
          onChange={(e) => onChange({ horizontalAlignment: e.target.value as string })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'middle', label: 'Middle' },
            { value: 'right', label: 'Right' },
          ]}
        />
      </div>
    </div>
  );
};

export default GeneralTab;
