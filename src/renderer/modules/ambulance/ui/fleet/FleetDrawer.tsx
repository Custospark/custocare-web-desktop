import React from 'react';
import { X } from 'lucide-react';

interface FleetDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  theme: 'light' | 'dark';
  children: React.ReactNode;
  widthClass?: string;
}

const FleetDrawer: React.FC<FleetDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  theme,
  children,
  widthClass = 'sm:w-160',
}) => {
  if (!open) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 cursor-pointer"
      />

      <div
        className={`absolute right-0 top-0 flex h-full w-full flex-col overflow-hidden border-l ${widthClass} ${
          isDark ? 'border-gray-800 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-900'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className={`flex shrink-0 items-start justify-between gap-4 border-b p-5 ${
            isDark ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-6">{title}</h3>
            {subtitle && (
              <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`cursor-pointer rounded-lg border p-2 transition ${
              isDark ? 'border-gray-800 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-100'
            }`}
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default FleetDrawer;
