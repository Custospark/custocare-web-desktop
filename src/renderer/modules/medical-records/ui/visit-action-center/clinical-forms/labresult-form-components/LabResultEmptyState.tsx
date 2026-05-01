import React from 'react';
import { useSelector } from 'react-redux';
import { ClipboardX, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabResultEmptyStateProps } from './labResultForm.types';
import { selectTheme } from '../../../../../../app/store/slices/uiSlice';

export const LabResultEmptyState: React.FC<LabResultEmptyStateProps> = ({
  title = 'Nothing to display',
  description = 'There is no lab result content available yet.',
  actionLabel,
  onAction,
}) => {
  const globalTheme = useSelector(selectTheme);
  const isDark = globalTheme === 'dark';

  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed p-12 text-center shadow-sm transition-colors',
        isDark
          ? 'border-gray-700 bg-gray-900'
          : 'border-gray-300 bg-white'
      )}
    >
      <ClipboardX
        className={cn(
          'mx-auto mb-4 h-12 w-12',
          isDark ? 'text-gray-600' : 'text-gray-400'
        )}
      />

      <h3
        className={cn(
          'text-lg font-semibold',
          isDark ? 'text-gray-100' : 'text-gray-900'
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          'mx-auto mt-2 max-w-2xl text-sm leading-6',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all',
            'bg-blue-600 hover:bg-blue-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            isDark && 'focus:ring-offset-gray-900'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default LabResultEmptyState;