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
      {/* Stack on mobile, row on desktop */}
      <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-start lg:justify-between">
        
        {/* Left Section - Title & Status - Full width on mobile */}
        <div className="flex-1 min-w-0">
          {/* Title Row - Responsive */}
          <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
            {/* Icon - Smaller on mobile */}
            <div className={cn(
              'rounded-2xl p-2 sm:p-2.5 md:p-3',
              'flex-shrink-0',
              isDark ? 'bg-blue-950/40' : 'bg-blue-50'
            )}>
              <ClipboardCheck className={cn(
                'h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6',
                isDark ? 'text-blue-300' : 'text-blue-600'
              )} />
            </div>

            {/* Title Text */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-xs sm:text-sm md:text-base',
                'break-words leading-relaxed',
                colors.text.primary
              )}>
                Manage and record laboratory test results
              </p>
            </div>
          </div>

          {/* Status Badges - Wrap on mobile */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className={cn(
              'rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold',
              getRequestStatusClasses(request.status, isDark)
            )}>
              {formatLabel(request.status)}
            </span>

            <span className={cn(
              'rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold',
              getPriorityClasses(request.priority, isDark)
            )}>
              {formatLabel(request.priority)}
            </span>

            {requestLocked && (
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold',
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
              )}>
                <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden xs:inline">Read-only</span>
                <span className="xs:hidden">Locked</span>
              </span>
            )}
          </div>

          {/* Locked Warning Banner - Full width on mobile */}
          {requestLocked && (
            <div className={cn(
              'mt-3 sm:mt-4 flex items-start sm:items-center gap-2 rounded-xl border px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-medium',
              isDark ? 'border-amber-800/50 bg-amber-950/30 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'
            )}>
              <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span className="break-words flex-1">
                This request has been {formatLabel(request.status)} and cannot be modified
              </span>
            </div>
          )}
        </div>

        {/* Right Section - Action Buttons - Responsive grid on mobile */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          {/* Button grid - 2 columns on mobile, auto on desktop */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:justify-end">
            {/* Back Button */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  'cursor-pointer inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-all',
                  colors.border.primary,
                  colors.bg.hover,
                  colors.text.secondary,
                  'hover:shadow-sm active:scale-95'
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Back</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-all',
                colors.border.primary,
                colors.bg.hover,
                colors.text.primary,
                isRefreshing && 'cursor-not-allowed opacity-60',
                'hover:shadow-sm active:scale-95'
              )}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', isRefreshing && 'animate-spin')} />
              <span>{isRefreshing ? '...' : 'Refresh'}</span>
            </button>

            {/* Preview Button */}
            <button
              type="button"
              onClick={onPreview}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-all',
                colors.border.primary,
                colors.bg.hover,
                colors.text.primary,
                'hover:shadow-sm active:scale-95'
              )}
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Preview</span>
            </button>

            {/* Print Button - Primary Action */}
            <button
              type="button"
              onClick={onPrint}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-all',
                'bg-blue-600 text-white',
                'hover:bg-blue-700 hover:shadow-md active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
            >
              <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Print</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={onDownload}
              className={cn(
                'cursor-pointer inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-all',
                isDark 
                  ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50' 
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                'border',
                'hover:shadow-sm active:scale-95'
              )}
            >
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Download</span>
            </button>
          </div>

          {/* Request Info Footer - Responsive */}
          <div className="mt-3 sm:mt-4 text-left sm:text-right">
            <p className={cn('text-[10px] sm:text-xs', colors.text.tertiary)}>
              <span className="inline sm:hidden">Req: </span>
              <span className="hidden sm:inline">Requested: </span>
              {formatDisplayDateTime(request.requested_at)}
            </p>
            {request.completed_at && (
              <p className={cn('text-[10px] sm:text-xs mt-0.5 sm:mt-1', colors.text.tertiary)}>
                <span className="inline sm:hidden">Comp: </span>
                <span className="hidden sm:inline">Completed: </span>
                {formatDisplayDateTime(request.completed_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LabResultHeader;