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
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

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
