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

export { getClockSizeClass, getTitleSizeClass, getSubtitleSizeClass };

const Header: React.FC<HeaderProps> = ({ config }) => {
  return (
    <>
      {config.clock.enabled && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex justify-center w-auto px-3 py-2">
          <Clock config={config} getClockSizeClass={getClockSizeClass} />
        </div>
      )}
      <div className={`relative z-10 flex flex-col ${config.alignment === 'bottom' ? 'mt-auto' : ''} items-center`}>
        {config.title && (
          <div className="text-center">
            <h1
              className={`liquid-title-text ${getTitleSizeClass(config.titleSize)} font-extrabold text-white mb-2 mt-3`}
            >
              {config.title}
            </h1>
          </div>
        )}
      </div>
    </>
  );
};

export default Header;
