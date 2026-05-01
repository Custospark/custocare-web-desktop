import React from 'react';
import { AlertCircle, FileSearch } from 'lucide-react';
import type { ColorTokens } from '../../labResultForm.types';
import { cn } from '../../../../../../../../shared/utils/classNameUtils';
interface LabResultTableHeaderProps {
  isDark: boolean;
  colors: ColorTokens;
  requestLocked: boolean;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
}

export const LabResultTableHeader: React.FC<LabResultTableHeaderProps> = ({
  isDark,
  colors,
  requestLocked,
  pendingCount,
  inProgressCount,
  completedCount,
}) => {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 border-b p-4 sm:p-5', colors.border.primary)}>
      <div className="space-y-2">
        <div>
          <h2 className={cn('text-base sm:text-lg font-semibold', colors.text.primary)}>
            Requested Lab Tests and Results
          </h2>
          <p className={cn('mt-1 text-xs sm:text-sm', colors.text.secondary)}>
            Enter, review, verify, and monitor status progression for each requested lab test.
          </p>
        </div>

        <div className={cn('flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm', colors.text.secondary)}>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
            <span>{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span>{inProgressCount} Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>{completedCount} Completed / Verified</span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium',
          requestLocked
            ? isDark
              ? 'border-amber-800/50 bg-amber-950/30 text-amber-300'
              : 'border-amber-200 bg-amber-50 text-amber-700'
            : isDark
            ? 'border-emerald-800/50 bg-emerald-950/20 text-emerald-300'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        )}
      >
        {requestLocked ? <AlertCircle className="h-4 w-4 flex-shrink-0" /> : <FileSearch className="h-4 w-4 flex-shrink-0" />}
        <span className="break-words">
          {requestLocked
            ? 'Request-level editing restrictions are active'
            : 'Result entry and status actions are available'}
        </span>
      </div>
    </div>
  );
};