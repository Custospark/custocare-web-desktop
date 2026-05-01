import React from 'react';
import { X, Calendar, User, FileText, AlertCircle } from 'lucide-react';
import { cn } from '../../../../../../../../shared/utils/classNameUtils';
import type { LabRequestItem, LabResult } from '../../../../../../api/lab/LabTypes';
import type { ColorTokens } from '../../labResultForm.types';
import {
  formatDisplayDateTime,
  formatLabel,
  getResultFlagClasses,
  formatReferenceRange,
} from '../../labResultForm.utils';

interface LabResultViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: LabRequestItem | null;
  results: LabResult[];
  isDark: boolean;
  colors: ColorTokens;
}

interface ResultDetailCardProps {
  result: LabResult;
  index: number;
  isDark: boolean;
  colors: ColorTokens;
}

const ResultDetailCard: React.FC<ResultDetailCardProps> = ({
  result,
  index,
  isDark,
  colors,
}) => {
  const badgeBase = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';
  const flagClasses = getResultFlagClasses(result.flag, isDark);

  return (
    <div
      className={cn(
        'rounded-xl border p-5 transition-all',
        colors.border.primary,
        colors.bg.subtle,
        'hover:shadow-md'
      )}
    >
      {/* Header with Index and Flag */}
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
              isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
            )}
          >
            {index + 1}
          </span>
          <div>
            <h4 className={cn('font-semibold', colors.text.primary)}>
              {result.template_field?.name || 'Result Parameter'}
            </h4>
            {result.template_field?.code && (
              <p className={cn('text-xs', colors.text.secondary)}>
                Code: {result.template_field.code}
              </p>
            )}
          </div>
        </div>
        <span className={cn(badgeBase, flagClasses)}>
          {formatLabel(result.flag)}
        </span>
      </div>

      {/* Main Result Value */}
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className={cn('mb-1 text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
            Result Value
          </p>
          <p className={cn('text-lg font-bold', colors.text.primary)}>
            {result.formatted_value || result.value || (result.numeric_value !== null ? result.numeric_value : '—')}
          </p>
        </div>

        <div>
          <p className={cn('mb-1 text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
            Unit
          </p>
          <p className={cn('text-sm', colors.text.primary)}>
            {result.unit || result.template_field?.unit || '—'}
          </p>
        </div>

        <div>
          <p className={cn('mb-1 text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
            Reference Range
          </p>
          <p className={cn('text-sm', colors.text.primary)}>
            {result.reference_range ||
              formatReferenceRange(
                result.reference_min,
                result.reference_max,
                result.unit || result.template_field?.unit
              )}
          </p>
        </div>
      </div>

      {/* Interpretation */}
      {result.interpretation && (
        <div className="mb-4">
          <p className={cn('mb-1 text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
            Interpretation
          </p>
          <div
            className={cn(
              'rounded-lg border p-3 text-sm',
              colors.border.primary,
              colors.bg.card
            )}
          >
            <p className={cn('leading-relaxed', colors.text.primary)}>
              {result.interpretation}
            </p>
          </div>
        </div>
      )}

      {/* Comments */}
      {result.comments && (
        <div className="mb-4">
          <p className={cn('mb-1 text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
            Comments
          </p>
          <div
            className={cn(
              'rounded-lg border p-3 text-sm',
              colors.border.primary,
              colors.bg.card
            )}
          >
            <p className={cn('leading-relaxed', colors.text.primary)}>
              {result.comments}
            </p>
          </div>
        </div>
      )}

      {/* Metadata Footer */}
      <div className="mt-4 flex flex-wrap gap-4 pt-3 border-t" style={{ borderColor: colors.border.primary }}>
        <div className="flex items-center gap-1.5">
          <Calendar className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
          <span className={cn('text-xs', colors.text.secondary)}>
            Recorded: {formatDisplayDateTime(result.recorded_at)}
          </span>
        </div>

        {result.recorded_by?.name && (
          <div className="flex items-center gap-1.5">
            <User className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
            <span className={cn('text-xs', colors.text.secondary)}>
              By: {result.recorded_by.name}
            </span>
          </div>
        )}

        {result.verified_at && (
          <>
            <div className="flex items-center gap-1.5">
              <Calendar className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
              <span className={cn('text-xs', colors.text.secondary)}>
                Verified: {formatDisplayDateTime(result.verified_at)}
              </span>
            </div>

            {result.verified_by?.name && (
              <div className="flex items-center gap-1.5">
                <User className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
                <span className={cn('text-xs', colors.text.secondary)}>
                  By: {result.verified_by.name}
                </span>
              </div>
            )}
          </>
        )}

        {result.is_critical_alert_sent && (
          <div className="flex items-center gap-1.5">
            <AlertCircle className={cn('h-3.5 w-3.5', 'text-red-500')} />
            <span className={cn('text-xs', 'text-red-600 dark:text-red-400')}>
              Critical Alert Sent
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const LabResultViewModal: React.FC<LabResultViewModalProps> = ({
  isOpen,
  onClose,
  item,
  results,
  isDark,
  colors,
}) => {
  if (!isOpen || !item) return null;

  const hasResults = results.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl',
          colors.border.primary,
          colors.bg.card
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center justify-between border-b p-5',
            colors.border.primary
          )}
        >
          <div>
            <h2 className={cn('text-xl font-semibold', colors.text.primary)}>
              Lab Results Details
            </h2>
            <p className={cn('mt-1 text-sm', colors.text.secondary)}>
              {item.lab_test?.name || 'Lab Test'} • {item.lab_test?.code || 'No code'}
            </p>
            {item.sample_type && (
              <p className={cn('mt-0.5 text-xs', colors.text.tertiary)}>
                Sample: {item.sample_type}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg p-2 transition-all',
              colors.bg.hover,
              colors.text.primary
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {!hasResults ? (
            <div
              className={cn(
                'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center',
                colors.border.primary,
                colors.bg.subtle
              )}
            >
              <FileText className={cn('mb-3 h-12 w-12', colors.text.tertiary)} />
              <h3 className={cn('mb-1 text-lg font-semibold', colors.text.primary)}>
                No Results Available
              </h3>
              <p className={cn('text-sm', colors.text.secondary)}>
                This test doesn't have any recorded results yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div
                  className={cn(
                    'rounded-xl border p-3',
                    colors.border.primary,
                    colors.bg.subtle
                  )}
                >
                  <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                    Total Results
                  </p>
                  <p className={cn('mt-1 text-2xl font-bold', colors.text.primary)}>
                    {results.length}
                  </p>
                </div>

                <div
                  className={cn(
                    'rounded-xl border p-3',
                    colors.border.primary,
                    colors.bg.subtle
                  )}
                >
                  <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                    Item Status
                  </p>
                  <p className={cn('mt-1 text-sm font-semibold', colors.text.primary)}>
                    {formatLabel(item.status)}
                  </p>
                </div>

                <div
                  className={cn(
                    'rounded-xl border p-3',
                    colors.border.primary,
                    colors.bg.subtle
                  )}
                >
                  <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                    Completed At
                  </p>
                  <p className={cn('mt-1 text-sm', colors.text.primary)}>
                    {formatDisplayDateTime(item.completed_at) || 'Not completed'}
                  </p>
                </div>

                <div
                  className={cn(
                    'rounded-xl border p-3',
                    colors.border.primary,
                    colors.bg.subtle
                  )}
                >
                  <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                    Verified At
                  </p>
                  <p className={cn('mt-1 text-sm', colors.text.primary)}>
                    {formatDisplayDateTime(item.verified_at) || 'Not verified'}
                  </p>
                </div>
              </div>

              {/* Results Cards */}
              <div className="space-y-4">
                {results.map((result, index) => (
                  <ResultDetailCard
                    key={result.result_uuid || index}
                    result={result}
                    index={index}
                    isDark={isDark}
                    colors={colors}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={cn(
            'flex justify-end border-t p-4',
            colors.border.primary,
            colors.bg.subtle
          )}
        >
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-all',
              colors.bg.hover,
              colors.text.primary
            )}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabResultViewModal;