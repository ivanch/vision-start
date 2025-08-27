import { useState } from 'react';
import { Category } from '../types';

interface CategoryEditModalProps {
  category?: Category;
  edit: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onDelete: () => void;
}

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ category, edit, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(category ? category.name : '');

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-black/25 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-full max-w-lg text-white">
        <h2 className="text-3xl font-bold mb-6">{edit ? 'Edit Category' : 'Add Category'}</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/10 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>
        <div className="flex justify-between items-center mt-8">
          <div>
            {edit && (
              <button onClick={onDelete} className="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-6 rounded-lg">
                Delete
              </button>
            )}
          </div>
          <div className="flex justify-end gap-4">
            <button onClick={() => onSave(name)} className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-6 rounded-lg">
              Save
            </button>
            <button onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryEditModal;
