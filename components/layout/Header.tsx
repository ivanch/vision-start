import Clock from '../Clock';
import { Config } from '../../types';

interface HeaderProps {
  config: Config;
}

const getClockSizeClass = (size: string) => {
  switch (size) {
    case 'tiny':
      return 'text-3xl';
    case 'small':
      return 'text-4xl';
    case 'medium':
      return 'text-5xl';
    case 'large':
      return 'text-6xl';
    default:
      return 'text-5xl';
  }
};

const getTitleSizeClass = (size: string) => {
  switch (size) {
    case 'tiny':
      return 'text-4xl';
    case 'small':
      return 'text-5xl';
    case 'medium':
      return 'text-6xl';
    case 'large':
      return 'text-7xl';
    default:
      return 'text-6xl';
  }
};

const getSubtitleSizeClass = (size: string) => {
  switch (size) {
    case 'tiny':
      return 'text-lg';
    case 'small':
      return 'text-xl';
    case 'medium':
      return 'text-2xl';
    case 'large':
      return 'text-3xl';
    default:
      return 'text-2xl';
  }
};

const Header: React.FC<HeaderProps> = ({ config }) => {
  return (
    <>
      {config.clock.enabled && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex justify-center w-auto p-2">
          <Clock config={config} getClockSizeClass={getClockSizeClass} />
        </div>
      )}
      <div className={`flex flex-col ${config.alignment === 'bottom' ? 'mt-auto' : ''} items-center`}>
        {(config.title || config.subtitle) && (
          <div className="text-center">
            <h1
              className={`${getTitleSizeClass(config.titleSize)} font-extrabold text-white tracking-tighter mb-3 mt-4`}
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            >
              {config.title}
            </h1>
            <p
              className={`${getSubtitleSizeClass(config.subtitleSize)} text-slate-300`}
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
              {config.subtitle}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
