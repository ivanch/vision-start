import React, { useEffect, useId, useRef } from 'react';

interface ModalShellProps {
  title: string;
  edit: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  canSave?: boolean;
  children: React.ReactNode;
}

const ModalShell: React.FC<ModalShellProps> = ({ title, edit, onClose, onSave, onDelete, canSave = true, children }) => {
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="liquid-modal-backdrop fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleOverlayClick}>
      <div className="liquid-panel liquid-modal-card rounded-3xl p-6 sm:p-8 w-full max-w-lg text-white" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="liquid-title-text text-3xl font-extrabold mb-6">{title}</h2>
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
            <button
              onClick={onSave}
              disabled={!canSave}
              className="liquid-button liquid-button-success liquid-focus py-2.5 px-5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
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
