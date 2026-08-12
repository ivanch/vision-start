import Clock from '../Clock';
import { Config } from '../../types';
import { getTitleSizeClass } from '../utils/styleUtils';

interface HeaderProps {
  config: Config;
}

const Header: React.FC<HeaderProps> = ({ config }) => {
  return (
    <>
      {config.clock.enabled && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex justify-center w-auto px-3 py-2">
          <Clock config={config} />
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