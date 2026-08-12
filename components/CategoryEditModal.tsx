import { useState } from 'react';
import { Category } from '../types';
import ModalShell from './ModalShell';

interface CategoryEditModalProps {
  category?: Category;
  edit: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onDelete: () => void;
}

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({ category, edit, onClose, onSave, onDelete }) => {
  const [name, setName] = useState(category ? category.name : '');

  return (
    <ModalShell
      title={edit ? 'Edit Category' : 'Add Category'}
      edit={edit}
      onClose={onClose}
      onSave={() => onSave(name)}
      onDelete={edit ? onDelete : undefined}
    >
      <input
        type="text"
        placeholder="Category Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="liquid-input p-3"
      />
    </ModalShell>
  );
};

export default CategoryEditModal;