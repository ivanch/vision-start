import React from 'react';

interface ModalShellProps {
  title: string;
  edit: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ title, edit, onClose, onSave, onDelete, children }) => {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="liquid-modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
      <div className="liquid-panel liquid-modal-card rounded-3xl p-6 sm:p-8 w-full max-w-lg text-white">
        <h2 className="liquid-title-text text-3xl font-extrabold mb-6">{title}</h2>
        <div className="flex flex-col gap-4">{children}</div>
        <div className="flex justify-between items-center mt-8">
          <div>
            {edit && onDelete && (
              <button onClick={onDelete} className="liquid-button liquid-button-danger liquid-focus py-2.5 px-5">
                Delete
              </button>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onSave} className="liquid-button liquid-button-success liquid-focus py-2.5 px-5">
              Save
            </button>
            <button onClick={onClose} className="liquid-button liquid-button-secondary liquid-focus py-2.5 px-5">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalShell;