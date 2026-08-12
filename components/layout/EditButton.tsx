import { PencilIcon } from '../icons';

interface EditButtonProps {
  isEditing: boolean;
  onClick: () => void;
}

const EditButton: React.FC<EditButtonProps> = ({ isEditing, onClick }) => {
  return (
    <div className="absolute top-4 left-4 z-20">
      <button
        onClick={onClick}
        className={`liquid-surface liquid-control liquid-focus rounded-2xl px-3.5 py-3 text-xs font-bold ${isEditing ? 'pr-4' : ''}`}
        aria-label={isEditing ? 'Finish editing' : 'Edit page'}
      >
        <PencilIcon size={16} />
        {isEditing ? 'Done' : ''}
      </button>
    </div>
  );
};

export default EditButton;