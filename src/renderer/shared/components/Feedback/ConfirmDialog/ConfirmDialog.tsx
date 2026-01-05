// shared/components/Feedback/ConfirmDialog/ConfirmDialog.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, Trash, X } from 'lucide-react';

import type { ConfirmOptions, ConfirmVariant } from './ConfirmContext';

interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
  theme?: string;
}

const variantConfig: Record<ConfirmVariant, {
  icon: React.ElementType;
  iconColor: (isDark: boolean) => string;
  confirmColor: (isDark: boolean) => string;
  confirmHover: (isDark: boolean) => string;
  iconBgColor: (isDark: boolean) => string;
  accentColor: string;
  borderColor: string;
}> = {
  danger: {
    icon: Trash,
    iconColor: (isDark) => isDark ? 'text-red-400' : 'text-red-500',
    confirmColor: (isDark) => isDark ? 'bg-red-500' : 'bg-red-600',
    confirmHover: (isDark) => isDark ? 'hover:bg-red-600' : 'hover:bg-red-700',
    iconBgColor: (isDark) => isDark ? 'bg-red-900/30' : 'bg-red-50',
    accentColor: 'bg-red-500',
    borderColor: 'border-red-200 dark:border-red-800/50'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: (isDark) => isDark ? 'text-amber-400' : 'text-amber-500',
    confirmColor: (isDark) => isDark ? 'bg-amber-500' : 'bg-amber-600',
    confirmHover: (isDark) => isDark ? 'hover:bg-amber-600' : 'hover:bg-amber-700',
    iconBgColor: (isDark) => isDark ? 'bg-amber-900/30' : 'bg-amber-50',
    accentColor: 'bg-amber-500',
    borderColor: 'border-amber-200 dark:border-amber-800/50'
  },
  info: {
    icon: Info,
    iconColor: (isDark) => isDark ? 'text-blue-400' : 'text-blue-500',
    confirmColor: (isDark) => isDark ? 'bg-blue-500' : 'bg-blue-600',
    confirmHover: (isDark) => isDark ? 'hover:bg-blue-600' : 'hover:bg-blue-700',
    iconBgColor: (isDark) => isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    accentColor: 'bg-blue-500',
    borderColor: 'border-blue-200 dark:border-blue-800/50'
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  options,
  onConfirm,
  onCancel,
  theme
}) => {
  if (!options) return null;

  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'info',
  } = options;

  const isDark = theme === 'dark';
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter') onConfirm();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Clean Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0" onClick={onCancel} />
            
            <motion.div
              className="relative w-full max-w-md z-50"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ 
                type: "spring", 
                damping: 30, 
                stiffness: 400,
                mass: 0.8
              }}
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              {/* Dialog Card */}
              <div className={`relative rounded-xl shadow-2xl overflow-hidden ${
                isDark 
                  ? 'bg-gray-900' 
                  : 'bg-white'
              } ${config.borderColor} border`}>
                {/* Elegant header with subtle gradient */}
                <div className={`px-6 pt-6 pb-4 ${isDark ? 'bg-gradient-to-b from-gray-900 to-gray-900/95' : 'bg-gradient-to-b from-white to-gray-50/80'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Icon with refined design */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        config.iconBgColor(isDark)
                      }`}>
                        <Icon className={`w-5 h-5 ${config.iconColor(isDark)}`} />
                      </div>
                      
                      <div>
                        <h3 className={`text-lg font-semibold leading-tight ${
                          isDark ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {title}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Close button - more subtle */}
                    <button
                      onClick={onCancel}
                      className={`ml-2 p-1.5 rounded-lg transition-all duration-150 ${
                        isDark 
                          ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                      } active:scale-95`}
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Message content */}
                <div className="px-6 py-5">
                  <div className={`text-sm leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {message}
                  </div>
                </div>
                
                {/* Actions - clean and professional */}
                <div className={`px-6 py-5 ${isDark ? 'bg-gray-900/50' : 'bg-gray-50/80'} border-t ${
                  isDark ? 'border-gray-800' : 'border-gray-100'
                }`}>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={onCancel}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isDark 
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                      } active:scale-[0.98]`}
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={onConfirm}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 ${
                        config.confirmColor(isDark)
                      } ${config.confirmHover(isDark)} active:scale-[0.98] shadow-sm hover:shadow`}
                      autoFocus
                    >
                      {confirmText}
                    </button>
                  </div>
                </div>
                
                {/* Subtle accent line */}
                <div className={`h-0.5 ${config.accentColor}`} />
              </div>
              
              {/* Subtle outer glow for focus */}
              <div className="absolute inset-0 -z-10">
                <div className={`absolute inset-0 rounded-xl ${
                  variant === 'danger' ? 'bg-red-500/5' : 
                  variant === 'warning' ? 'bg-amber-500/5' : 
                  'bg-blue-500/5'
                } blur-xl`} />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};