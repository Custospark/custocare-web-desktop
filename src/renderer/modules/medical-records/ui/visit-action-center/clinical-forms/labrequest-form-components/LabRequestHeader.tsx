import React from 'react';
import { ClipboardPlus, Plus, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import type { ColorTokens } from './labRequestForm.types';

interface LabRequestHeaderProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest | null;
  selectedTestsCount: number;
  onAddTest: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const LabRequestHeader: React.FC<LabRequestHeaderProps> = ({
  isDark,
  colors,
  request,
  selectedTestsCount,
  onAddTest,
  onRefresh,
  isRefreshing = false,
}) => {
  const hasExistingRequest = !!request;

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', isDark ? 'bg-cyan-900/20' : 'bg-cyan-50')}>
          <ClipboardPlus className={cn('h-5 w-5', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn('text-lg font-semibold', colors.text.primary)}>
              {hasExistingRequest ? 'Existing Lab Request' : 'Create Lab Request'}
            </h2>

            {request?.request_uuid && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700',
                )}
              >
                {request.request_uuid}
              </span>
            )}

            {request?.status_label && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
                )}
              >
                {request.status_label}
              </span>
            )}
          </div>

          <p className={cn('mt-1 text-sm', colors.text.secondary)}>
            {hasExistingRequest
              ? 'Review the request summary, then open edit actions only when you need to change something.'
              : 'Start with request details or add tests when needed. Nothing opens automatically until you click add or edit.'}
          </p>

          <p className={cn('mt-1 text-xs', colors.text.tertiary)}>
            {selectedTestsCount} selected test{selectedTestsCount === 1 ? '' : 's'} • lab results handled separately later
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
              colors.border.primary,
              colors.bg.hover,
              colors.text.secondary,
              isRefreshing && 'cursor-not-allowed opacity-50',
            )}
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}

        <button
          type="button"
          onClick={onAddTest}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Test
        </button>
      </div>
    </div>
  );
};

export default LabRequestHeader;