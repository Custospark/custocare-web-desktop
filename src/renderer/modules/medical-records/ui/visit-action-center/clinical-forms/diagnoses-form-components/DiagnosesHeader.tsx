import React from 'react';
import { Activity, Clock, FileText, RefreshCw, Stethoscope, AlertCircle } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { DiagnosesThemeTokens } from './diagnosesForm.types';

interface DiagnosesHeaderProps {
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  hasActiveVisit: boolean;
  hasExistingDiagnoses: boolean;
  diagnosesCount: number;
  isFetching: boolean;
  onRefresh?: () => void;
}

export const DiagnosesHeader: React.FC<DiagnosesHeaderProps> = ({
  isDark,
  colors,
  hasActiveVisit,
  hasExistingDiagnoses,
  diagnosesCount,
  isFetching,
  onRefresh,
}) => {
  return (
    <section
      className={cn(
        'mt-6 rounded-2xl border p-5 sm:p-6',
        colors.border.primary,
        colors.bg.card
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'rounded-2xl p-3',
              isDark ? 'bg-blue-950/40' : 'bg-blue-50'
            )}
          >
            <Stethoscope
              className={cn('h-6 w-6', isDark ? 'text-blue-300' : 'text-blue-700')}
            />
          </div>

          <div>
            <h2 className={cn('text-xl font-semibold', colors.text.primary)}>
              Diagnoses
            </h2>
            <p className={cn('mt-1 text-sm', colors.text.secondary)}>
              Record, review, edit, verify, and manage patient diagnoses (ICD-10/11).
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

              {/* Diagnoses Existence Status */}
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                  hasExistingDiagnoses
                    ? `${colors.state.infoSoft} ${colors.state.info}`
                    : `${colors.state.warningSoft} ${colors.state.warning}`
                )}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {hasExistingDiagnoses ? 'Diagnoses recorded' : 'No diagnoses recorded yet'}
              </span>

              {/* Diagnoses Count */}
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                  isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Diagnoses: {diagnosesCount}
              </span>

              {/* Auto-sync Status */}
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                  isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                Auto-sync enabled
              </span>

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

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              'border',
              colors.border.primary,
              colors.text.primary,
              colors.bg.hover,
              isFetching && 'cursor-not-allowed opacity-50'
            )}
            title="Refresh diagnoses"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
        )}
      </div>
    </section>
  );
};

export default DiagnosesHeader;