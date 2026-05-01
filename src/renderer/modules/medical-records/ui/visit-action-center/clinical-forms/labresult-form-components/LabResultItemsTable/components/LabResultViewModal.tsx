import React from 'react';
import { X, Calendar, User, FileText, AlertCircle, CheckCircle2, Clock, FlaskConical, CheckCheck } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequestItem, LabResult } from '../../../../api/lab/LabTypes';
import { LabRequestItemStatus } from '../../../../api/lab/LabTypes';
import type { ColorTokens } from './labResultForm.types';
import {
  formatDisplayDateTime,
  formatLabel,
  getResultFlagClasses,
  formatReferenceRange,
} from './labResultForm.utils';

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
            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs text-red-600 dark:text-red-400">
              Critical Alert Sent
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Timeline Step Component
const TimelineStep: React.FC<{
  status: string;
  label: string;
  date: string | null;
  isActive: boolean;
  isCompleted: boolean;
  isLast: boolean;
  isDark: boolean;
  colors: ColorTokens;
}> = ({ status, label, date, isActive, isCompleted, isLast, isDark, colors }) => {
  const getStatusIcon = () => {
    if (status === 'verified') return <CheckCheck className="h-4 w-4" />;
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4" />;
    if (status === 'in_progress') return <FlaskConical className="h-4 w-4" />;
    if (status === 'sample_collected') return <Clock className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-500 text-white';
    if (isActive) return 'bg-blue-500 text-white animate-pulse';
    if (status === 'cancelled') return 'bg-red-500 text-white';
    return isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500';
  };

  return (
    <div className="flex-1 relative">
      {/* Connector line */}
      {!isLast && (
        <div 
          className={cn(
            'absolute top-4 left-1/2 w-full h-0.5',
            isCompleted ? 'bg-green-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'
          )}
          style={{ transform: 'translateX(0%)' }}
        />
      )}
      
      {/* Dot/Circle */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full transition-all',
            getStatusColor()
          )}
        >
          {getStatusIcon()}
        </div>
        <p className={cn('mt-2 text-xs font-semibold text-center', colors.text.primary)}>
          {label}
        </p>
        {date && (
          <p className={cn('text-[10px] text-center mt-0.5', colors.text.tertiary)}>
            {formatDisplayDateTime(date)}
          </p>
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

  // Determine timeline steps based on item status
  const getTimelineSteps = () => {
    const steps = [
      { status: 'pending', label: 'Pending', date: item.created_at, completed: item.created_at !== null },
      { status: 'sample_collected', label: 'Collected', date: item.collected_at, completed: item.collected_at !== null },
      { status: 'in_progress', label: 'Processing', date: item.started_at, completed: item.started_at !== null },
      { status: 'completed', label: 'Completed', date: item.completed_at, completed: item.completed_at !== null },
      { status: 'verified', label: 'Verified', date: item.verified_at, completed: item.verified_at !== null },
    ];

    const currentStatus = item.status;
    const activeIndex = steps.findIndex(s => s.status === currentStatus);
    
    return steps.map((step, idx) => ({
      ...step,
      isActive: idx === activeIndex,
      isCompleted: step.completed,
    }));
  };

  const timelineSteps = getTimelineSteps();
  const isCancelled = item.status === LabRequestItemStatus.CANCELLED;

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
          {/* Timeline Section */}
          <div className="mb-6">
            <h3 className={cn('mb-4 text-sm font-semibold', colors.text.primary)}>
              Test Workflow Timeline
            </h3>
            
            {isCancelled ? (
              <div
                className={cn(
                  'rounded-xl border p-4 text-center',
                  isDark ? 'border-red-800/50 bg-red-950/20' : 'border-red-200 bg-red-50'
                )}
              >
                <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
                <p className={cn('text-sm font-semibold', colors.text.primary)}>
                  Test Cancelled
                </p>
                {item.cancelled_at && (
                  <p className={cn('text-xs mt-1', colors.text.secondary)}>
                    Cancelled on: {formatDisplayDateTime(item.cancelled_at)}
                  </p>
                )}
                {item.cancellation_reason && (
                  <p className={cn('text-xs mt-1', colors.text.secondary)}>
                    Reason: {item.cancellation_reason}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-6">
                {timelineSteps.map((step, idx) => (
                  <TimelineStep
                    key={step.status}
                    status={step.status}
                    label={step.label}
                    date={step.date}
                    isActive={step.isActive}
                    isCompleted={step.isCompleted}
                    isLast={idx === timelineSteps.length - 1}
                    isDark={isDark}
                    colors={colors}
                  />
                ))}
              </div>
            )}
          </div>

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