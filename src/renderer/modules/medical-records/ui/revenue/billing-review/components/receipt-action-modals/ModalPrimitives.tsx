// ModalPrimitives.tsx
import React from 'react';

// Modal Backdrop Component
export const ModalBackdrop: React.FC<{ open: boolean; onClick: () => void }> = ({ open, onClick }) => {
  if (!open) return null;
  
  return (
    <div
      className="fixed inset-0 bg-black/25 z-40 animate-fadeIn cursor-pointer"
      onClick={onClick}
      aria-hidden="true"
    />
  );
};

// Modal Container Component
export const ModalContainer: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg animate-slideUp">
        {children}
      </div>
    </div>
  );
};
