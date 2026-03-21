import React from 'react';
import Dropdown from '../Dropdown';
import ToggleSwitch from '../ToggleSwitch';
import { Config } from '../../types';

interface ClockTabProps {
  config: Config;
  onChange: (updates: Partial<Config>) => void;
}

const ClockTab: React.FC<ClockTabProps> = ({ config, onChange }) => {
  const updateClock = (updates: Partial<Config['clock']>) => {
    onChange({ clock: { ...config.clock, ...updates } });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <label className="text-slate-300 text-sm font-semibold">Enable Clock</label>
        <ToggleSwitch
          checked={config.clock.enabled}
          onChange={(checked) => updateClock({ enabled: checked })}
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-slate-300 text-sm font-semibold">Clock Size</label>
        <Dropdown
          name="clock.size"
          value={config.clock.size}
          onChange={(e) => updateClock({ size: e.target.value as string })}
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
          onChange={(e) => updateClock({ font: e.target.value as string })}
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
          onChange={(e) => updateClock({ format: e.target.value as string })}
          options={[
            { value: 'h:mm A', label: 'AM/PM' },
            { value: 'HH:mm', label: '24:00' },
          ]}
        />
      </div>
    </div>
  );
};

export default ClockTab;
