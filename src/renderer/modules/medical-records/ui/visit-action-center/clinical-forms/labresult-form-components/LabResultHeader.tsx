// lab-results/labresult-form-components/LabResultHeader.tsx
import React from 'react';
import {
  ArrowLeft,
  ClipboardCheck,
  Download,
  Eye,
  Lock,
  RefreshCw,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import {
  formatDisplayDateTime,
  formatLabel,
  getPriorityClasses,
  getRequestStatusClasses,
} from './labResultForm.utils';
import type { ColorTokens } from './labResultForm.types';

interface LabResultHeaderProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest;
  requestLocked: boolean;
  isRefreshing?: boolean;
  onPreview: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onRefresh: () => void;
  onCancel?: () => void;
}

export const LabResultHeader: React.FC<LabResultHeaderProps> = ({
  isDark,
  colors,
  request,
  requestLocked,
  isRefreshing = false,
  onPreview,
  onPrint,
  onDownload,
  onRefresh,
  onCancel,
}) => {
  return (
    <section className={cn(
      'w-full',
      'rounded-2xl border',
      'p-4 sm:p-5 md:p-6',
      colors.border.primary,
      colors.bg.card
    )}>
      {/* Main Content Container */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        
        {/* Left Section - Title & Status */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div className={cn(
              'rounded-2xl p-2.5 sm:p-3',
              'flex-shrink-0',
              isDark ? 'bg-blue-950/40' : 'bg-blue-50'
            )}>
              <ClipboardCheck className={cn(
                'h-5 w-5 sm:h-6 sm:w-6',
                isDark ? 'text-blue-300' : 'text-blue-600'
              )} />
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-xs sm:text-sm mt-1',
                'break-words',
                colors.text.primary
              )}>
                Manage and record laboratory test results
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              getRequestStatusClasses(request.status, isDark)
            )}>
              {formatLabel(request.status)}
            </span>

            <span className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              getPriorityClasses(request.priority, isDark)
            )}>
              {formatLabel(request.priority)}
            </span>

            {requestLocked && (
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
              )}>
                <Lock className="h-3 w-3" />
                Read-only
              </span>
            )}
          </div>

          {/* Locked Warning Banner */}
          {requestLocked && (
            <div className={cn(
              'mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium',
              isDark ? 'border-amber-800/50 bg-amber-950/30 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'
            )}>
              <ShieldCheck className="h-4 w-4 flex-shrink-0" />
              <span className="break-words">
                This request has been {formatLabel(request.status)} and cannot be modified
              </span>
            </div>
          )}
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* Back Button */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                  'sm:px-4',
                  colors.border.primary,
                  colors.bg.hover,
                  colors.text.secondary,
                  'hover:shadow-sm'
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                'sm:px-4',
                colors.border.primary,
                colors.bg.hover,
                colors.text.primary,
                isRefreshing && 'cursor-not-allowed opacity-60',
                'hover:shadow-sm'
              )}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>

            {/* Preview Button */}
            <button
              type="button"
              onClick={onPreview}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                'sm:px-4',
                colors.border.primary,
                colors.bg.hover,
                colors.text.primary,
                'hover:shadow-sm'
              )}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            {/* Print Button - Primary Action */}
            <button
              type="button"
              onClick={onPrint}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                'sm:px-4',
                'bg-blue-600 text-white',
                'hover:bg-blue-700 hover:shadow-md',
                'active:bg-blue-800',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={onDownload}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                'sm:px-4',
                isDark 
                  ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50' 
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                'border',
                'hover:shadow-sm'
              )}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>

          {/* Request Info Footer */}
          <div className="mt-4 text-right">
            <p className={cn('text-xs', colors.text.tertiary)}>
              Requested: {formatDisplayDateTime(request.requested_at)}
            </p>
            {request.completed_at && (
              <p className={cn('text-xs mt-0.5', colors.text.tertiary)}>
                Completed: {formatDisplayDateTime(request.completed_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LabResultHeader;