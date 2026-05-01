import React from 'react';
import { useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabResultLoadingStateProps } from './labResultForm.types';
import { selectTheme } from '../../../../../../app/store/slices/uiSlice';

export const LabResultLoadingState: React.FC<LabResultLoadingStateProps> = ({
  message = 'Loading lab results...',
}) => {
  const globalTheme = useSelector(selectTheme);
  const isDark = globalTheme === 'dark';

  return (
    <div
      className={cn(
        'rounded-2xl border p-12 text-center shadow-sm transition-colors',
        isDark
          ? 'border-gray-700 bg-gray-900'
          : 'border-gray-200 bg-white'
      )}
    >
      <Loader2
        className={cn(
          'mx-auto mb-4 h-12 w-12 animate-spin',
          isDark ? 'text-blue-400' : 'text-blue-600'
        )}
      />

      <p
        className={cn(
          'text-sm',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        {message}
      </p>
    </div>
  );
};

export default LabResultLoadingState;