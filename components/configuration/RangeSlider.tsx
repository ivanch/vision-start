import React from 'react';

type RangeStyle = React.CSSProperties & { '--range-progress': string };

export const getRangeStyle = (value: number, min: number, max: number): RangeStyle => {
  const progress = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return { '--range-progress': `${progress}%` };
};

interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  valueSuffix?: string;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  valueSuffix,
  formatValue,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <label className="text-slate-300 text-sm font-semibold">{label}</label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="liquid-range"
          style={getRangeStyle(value, min, max)}
        />
        <span className="min-w-20 text-right text-sm text-slate-200">
          {formatValue ? formatValue(value) : `${value}${valueSuffix ?? ''}`}
        </span>
      </div>
    </div>
  );
};

export default RangeSlider;