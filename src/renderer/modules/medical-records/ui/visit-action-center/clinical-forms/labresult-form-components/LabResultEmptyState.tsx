// lab-results/labresult-form-components/LabResultEmptyState.tsx
import React from 'react';
import { ClipboardX, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabResultEmptyStateProps } from './labResultForm.types';

export const LabResultEmptyState: React.FC<LabResultEmptyStateProps> = ({
  title = 'Nothing to display',
  description = 'There is no lab result content available yet.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
      <ClipboardX className="mx-auto mb-4 h-12 w-12 text-gray-400" />

      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-600">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700'
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
