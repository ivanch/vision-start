import React, { useState, useEffect } from 'react';

interface ClockProps {
  config: {
    clock: {
      enabled: boolean;
      size: string;
      font: string;
      format: string;
    };
  };
  getClockSizeClass: (size: string) => string;
}

const Clock: React.FC<ClockProps> = ({ config, getClockSizeClass }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!config.clock.enabled) return;

    const scheduleNext = () => {
      const now = new Date();
      const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      timeoutId = window.setTimeout(() => {
        setTime(new Date());
        intervalId = window.setInterval(() => setTime(new Date()), 60_000);
      }, msToNextMinute);
    };

    let timeoutId = 0;
    let intervalId = 0;
    scheduleNext();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
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
      className={`text-white font-bold ${getClockSizeClass(config.clock.size)}`}
      style={{
        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        fontFamily: config.clock.font,
      }}
    >
      {formatTime(time)}
    </div>
  );
};

export default Clock;
