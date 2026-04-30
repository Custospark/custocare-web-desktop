// lab-results/labresult-form-components/LabResultLoadingState.tsx
import React from 'react';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import type { LabResultLoadingStateProps } from './labResultForm.types';

export const LabResultLoadingState: React.FC<LabResultLoadingStateProps> = ({
  message = 'Loading laboratory results...',
  theme = 'light',
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <LoadingSkeleton
        variant="detail"
        theme={theme}
        message={message}
      />
    </div>
  );
};

export default LabResultLoadingState;
