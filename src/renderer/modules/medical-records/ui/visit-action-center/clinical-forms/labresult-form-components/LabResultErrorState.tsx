import React from 'react';
import { useSelector } from 'react-redux';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabResultErrorStateProps } from './labResultForm.types';
import { selectTheme } from '../../../../../../app/store/slices/uiSlice';

export const LabResultErrorState: React.FC<LabResultErrorStateProps> = ({
  title = 'Unable to load data',
  description = 'There was a problem loading the lab results.',
  onRetry,
}) => {
  const globalTheme = useSelector(selectTheme);
  const isDark = globalTheme === 'dark';

  return (
    <div
      className={cn(
        'rounded-2xl border p-12 text-center shadow-sm transition-colors',
        isDark
          ? 'border-red-800/50 bg-red-950/20'
          : 'border-red-200 bg-red-50'
      )}
    >
      <AlertCircle
        className={cn(
          'mx-auto mb-4 h-12 w-12',
          isDark ? 'text-red-400' : 'text-red-500'
        )}
      />

      <h3
        className={cn(
          'text-lg font-semibold',
          isDark ? 'text-red-300' : 'text-red-800'
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          'mx-auto mt-2 max-w-2xl text-sm leading-6',
          isDark ? 'text-red-300/80' : 'text-red-600'
        )}
      >
        {description}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            'mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all',
            'bg-red-600 hover:bg-red-700',
            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
            isDark && 'focus:ring-offset-gray-900'
          )}
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default LabResultErrorState;