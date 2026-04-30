// lab-results/labresult-form-components/LabResultErrorState.tsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { LabResultErrorStateProps } from './labResultForm.types';

export const LabResultErrorState: React.FC<LabResultErrorStateProps> = ({
  title = 'Something went wrong',
  description = 'The lab result experience could not be loaded right now.',
  onRetry,
}) => {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center shadow-sm">
      <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />

      <h3 className="text-lg font-semibold text-red-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-red-700">
        {description}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  );
};

export default LabResultErrorState;
