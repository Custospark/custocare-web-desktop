// BaseFormWrapper.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../../../../shared/utils/classNameUtils';

interface BaseFormWrapperProps {
  theme: 'light' | 'dark';
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const BaseFormWrapper: React.FC<BaseFormWrapperProps> = ({
  theme,
  title,
  description,
  icon,
  children,
  actions,
  className,
}) => {
  const isDark = theme === 'dark';

  const colors = {
    bg: {
      input: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(className)}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`rounded-lg p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {icon}
          </div>
          <div>
            <h2 className={`text-lg font-semibold ${colors.text.primary}`}>
              {title}
            </h2>
            <p className={`text-sm ${colors.text.secondary}`}>
              {description}
            </p>
          </div>
        </div>

        {/* Form Content */}
        {children}

        {/* Actions Footer */}
        {actions && (
          <div className={`flex items-center justify-end gap-3 pt-4 ${isDark ? 'border-t border-gray-800' : 'border-t border-gray-200'}`}>
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
};