

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => {
  const handleToggle = () => {
    onChange(!checked);
  };

  return (
    <button
      type="button"
      className={`liquid-focus relative w-14 h-8 flex items-center rounded-full p-1 cursor-pointer border transition-all duration-200 ease-ios ${
        checked
          ? 'bg-cyan-400/70 border-cyan-200/60 shadow-[0_0_24px_rgba(34,211,238,0.22)]'
          : 'bg-white/10 border-white/20'
      }`}
      onClick={handleToggle}
      aria-pressed={checked}
    >
      <div
        className={`bg-white w-6 h-6 rounded-full shadow-lg transform transition-transform duration-200 ease-spring ${checked ? 'translate-x-6' : 'translate-x-0'}`}
      />
    </button>
  );
};

export default ToggleSwitch;
