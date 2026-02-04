import React from 'react';
import { cn } from '../../../utils/classNameUtils';
type PresenceStatusProps = {
  label?: string;
  isDark?: boolean;
  className?: string;
};

export const PresenceStatus: React.FC<PresenceStatusProps> = ({
  label = 'At Work',
  isDark = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border',
        isDark ? 'border-gray-800' : 'border-gray-200',
        className
      )}
    >
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </div>

      <span
        className={cn(
          'text-xs font-medium',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        {label}
      </span>
    </div>
  );
};
