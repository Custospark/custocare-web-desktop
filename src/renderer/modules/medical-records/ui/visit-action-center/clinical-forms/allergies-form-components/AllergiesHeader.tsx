import React from 'react';
import { AlertTriangle, Activity, FileText, RefreshCw, Eye, Printer, Download } from 'lucide-react';
import type { AllergiesThemeTokens } from './allergiesForm.types';
import { cn } from '../../../overview/medical-records-dashboard/dashboard.utils';
interface AllergiesHeaderProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  hasActiveVisit: boolean;
  hasExistingAllergies: boolean;
  allergiesCount: number;
  activeCount: number;
  severeCount: number;
  isFetching: boolean;
  onRefresh?: () => void;
  onPreview?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export const AllergiesHeader: React.FC<AllergiesHeaderProps> = ({
  isDark,
  colors,
  hasActiveVisit,
  hasExistingAllergies,
  allergiesCount,
  activeCount,
  severeCount,
  isFetching,
  onRefresh,
  onPreview,
  onPrint,
  onDownload,
}) => {
  return (
    <section
      className={cn(
        'mb-6 rounded-2xl border p-5 sm:p-6',
        colors.border.primary,
        colors.bg.card
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'rounded-2xl p-3',
              isDark ? 'bg-red-900/20' : 'bg-red-50'
            )}
          >
            <AlertTriangle
              className={cn('h-6 w-6', isDark ? 'text-red-300' : 'text-red-600')}
            />
          </div>

          <div>
            <h2 className={cn('text-xl font-semibold', colors.text.primary)}>
              Allergies & Intolerances
            </h2>
            <p className={cn('mt-1 text-sm', colors.text.secondary)}>
              Record, review, edit, print, and download patient allergy information.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Active Visit Status */}
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                  hasActiveVisit
                    ? `${colors.state.successSoft} ${colors.state.success}`
                    : `${colors.state.warningSoft} ${colors.state.warning}`
                )}
              >
                <Activity className="h-3.5 w-3.5" />
                {hasActiveVisit ? 'Active visit found' : 'Waiting for active visit'}
              </span>

              {/* Allergies Existence Status */}
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                  hasExistingAllergies
                    ? `${colors.state.infoSoft} ${colors.state.info}`
                    : `${colors.state.warningSoft} ${colors.state.warning}`
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                {hasExistingAllergies ? 'Allergies recorded' : 'No allergies recorded'}
              </span>

              {/* Statistics Badges */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                  isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                )}
              >
                Total: {allergiesCount}
              </span>

              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                  colors.state.successSoft,
                  colors.state.success
                )}
              >
                Active: {activeCount}
              </span>

              {severeCount > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                    colors.state.dangerSoft,
                    colors.state.danger
                  )}
                >
                  Severe: {severeCount}
                </span>
              )}

              {/* Fetching Indicator */}
              {isFetching && (
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                    isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Refreshing...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isFetching}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                colors.border.primary,
                colors.text.primary,
                colors.bg.hover,
                isFetching && 'cursor-not-allowed opacity-50'
              )}
              title="Refresh allergies"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              Refresh
            </button>
          )}

          {/* Preview Button */}
          {onPreview && hasExistingAllergies && (
            <button
              type="button"
              onClick={onPreview}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                colors.border.primary,
                colors.text.primary,
                colors.bg.hover
              )}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          )}

          {/* Print Button */}
          {onPrint && hasExistingAllergies && (
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </button>
          )}

          {/* Download PDF Button */}
          {onDownload && hasExistingAllergies && (
            <button
              type="button"
              onClick={onDownload}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                isDark
                  ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              )}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default AllergiesHeader;