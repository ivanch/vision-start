import React, { useState, useEffect } from 'react';
import { getClockSizeClass } from './utils/styleUtils';

interface ClockProps {
  config: {
    clock: {
      enabled: boolean;
      size: string;
      font: string;
      format: string;
    };
  };
}

const getMinuteKey = (date: Date): number => Math.floor(date.getTime() / 60_000);

const Clock: React.FC<ClockProps> = ({ config }) => {
  const [minuteKey, setMinuteKey] = useState(() => getMinuteKey(new Date()));

  useEffect(() => {
    if (!config.clock.enabled) return;

    let timeoutId = 0;
    const refresh = () => {
      window.clearTimeout(timeoutId);
      if (document.visibilityState !== 'visible') return;
      const now = new Date();
      setMinuteKey(getMinuteKey(now));
      const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      timeoutId = window.setTimeout(refresh, msToNextMinute);
    };
    refresh();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [config.clock.enabled]);

  if (!config.clock.enabled) {
    return null;
  }

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (config.clock.format === 'HH:mm') {
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = (hours % 12 || 12).toString();
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  return (
    <div
      className={`liquid-clock-text whitespace-nowrap text-white font-bold ${getClockSizeClass(config.clock.size)}`}
      style={{
        fontFamily: config.clock.font,
      }}
    >
      {formatTime(new Date(minuteKey * 60_000))}
    </div>
  );
};

export default Clock;
