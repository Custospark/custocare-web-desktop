// lab-results/labresult-form-components/LabResultRequestSummary.tsx
import React from 'react';
import {
  Calendar,
  Clock3,
  FileText,
  FlaskConical,
  Hash,
  ShieldCheck,
  User,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import type { ColorTokens } from './labResultForm.types';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayTime,
  formatLabel,
} from './labResultForm.utils';

interface LabResultRequestSummaryProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest;
}

const SummaryRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  colors: ColorTokens;
}> = ({ icon, label, value, colors }) => (
  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
    <div className={cn('flex items-center gap-2 text-sm font-medium', colors.text.secondary)}>
      {icon}
      <span>{label}</span>
    </div>
    <div className={cn(
      'text-sm font-semibold break-all',
      'sm:text-right',
      colors.text.primary
    )}>
      {value}
    </div>
  </div>
);

export const LabResultRequestSummary: React.FC<LabResultRequestSummaryProps> = ({
  isDark,
  colors,
  request,
}) => {
  const diagnosisNotes = request.diagnosis_context?.notes;
  const suspectedConditions = request.diagnosis_context?.suspected_conditions || [];
  const icdCodes = request.diagnosis_context?.icd_codes || [];

  return (
    <section className={cn(
      'w-full',
      'rounded-2xl border',
      'p-4 sm:p-5 md:p-6',
      colors.border.primary,
      colors.bg.card
    )}>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between md:mb-8">
        <div className="flex items-center gap-3">
          <div className={cn(
            'rounded-xl p-2.5',
            isDark ? 'bg-violet-950/40' : 'bg-violet-50'
          )}>
            <FileText className={cn('h-5 w-5', isDark ? 'text-violet-300' : 'text-violet-600')} />
          </div>
          <div>
            <h2 className={cn('text-base font-semibold sm:text-lg', colors.text.primary)}>
              Lab Request Summary
            </h2>
            <p className={cn('text-xs sm:text-sm', colors.text.secondary)}>
              Request, patient, visit, and clinical context details
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Layout - Responsive */}
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-6">
        {/* Left Column - Basic Info */}
        <div className={cn(
          'flex-1',
          'rounded-2xl border',
          'p-4 sm:p-5',
          colors.border.primary,
          colors.bg.subtle
        )}>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <SummaryRow
              icon={<User className="h-4 w-4 flex-shrink-0" />}
              label="Patient Name"
              value={request.patient?.full_name || 'Unknown patient'}
              colors={colors}
            />
            <SummaryRow
              icon={<Hash className="h-4 w-4 flex-shrink-0" />}
              label="Patient Number"
              value={request.patient?.patient_uuid || 'N/A'}
              colors={colors}
            />
            <SummaryRow
              icon={<Calendar className="h-4 w-4 flex-shrink-0" />}
              label="Requested Date"
              value={formatDisplayDate(request.requested_at)}
              colors={colors}
            />
            <SummaryRow
              icon={<Clock3 className="h-4 w-4 flex-shrink-0" />}
              label="Requested Time"
              value={formatDisplayTime(request.requested_at)}
              colors={colors}
            />
            <SummaryRow
              icon={<FlaskConical className="h-4 w-4 flex-shrink-0" />}
              label="Number of Tests"
              value={request.items_count || request.items?.length || 0}
              colors={colors}
            />
            <SummaryRow
              icon={<ShieldCheck className="h-4 w-4 flex-shrink-0" />}
              label="Progress"
              value={`${request.progress_percentage || 0}%`}
              colors={colors}
            />
          </div>
        </div>

        {/* Right Column - Timeline & Clinical Context */}
        <div className="flex-1 space-y-5">
          {/* Operational Timeline */}
          <div className={cn(
            'rounded-2xl border',
            'p-4 sm:p-5',
            colors.border.primary,
            colors.bg.subtle
          )}>
            <h3 className={cn('mb-4 text-sm font-semibold', colors.text.primary)}>
              Operational Timeline
            </h3>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className={cn(
                'rounded-xl border',
                'px-3 py-2.5',
                colors.border.primary,
                colors.bg.card
              )}>
                <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Requested By
                </p>
                <p className={cn('mt-1 text-sm font-semibold break-words', colors.text.primary)}>
                  {request.requested_by?.name || 'N/A'}
                </p>
                <p className={cn('text-xs break-words', colors.text.secondary)}>
                  {request.requested_by?.professional_title || 'Ordering clinician'}
                </p>
              </div>

              <div className={cn(
                'rounded-xl border',
                'px-3 py-2.5',
                colors.border.primary,
                colors.bg.card
              )}>
                <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Collected At
                </p>
                <p className={cn('mt-1 text-sm font-semibold break-words', colors.text.primary)}>
                  {formatDisplayDateTime(request.collected_at)}
                </p>
              </div>

              <div className={cn(
                'rounded-xl border',
                'px-3 py-2.5',
                colors.border.primary,
                colors.bg.card
              )}>
                <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Completed At
                </p>
                <p className={cn('mt-1 text-sm font-semibold break-words', colors.text.primary)}>
                  {formatDisplayDateTime(request.completed_at)}
                </p>
              </div>

              <div className={cn(
                'rounded-xl border',
                'px-3 py-2.5',
                colors.border.primary,
                colors.bg.card
              )}>
                <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Reviewed By
                </p>
                <p className={cn('mt-1 text-sm font-semibold break-words', colors.text.primary)}>
                  {request.reviewed_by?.name || 'N/A'}
                </p>
                <p className={cn('text-xs break-words', colors.text.secondary)}>
                  Reviewed At: {formatDisplayDateTime(request.reviewed_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Clinical Context */}
          {(request.clinical_notes || diagnosisNotes || suspectedConditions.length > 0 || icdCodes.length > 0) && (
            <div className={cn(
              'rounded-2xl border',
              'p-4 sm:p-5',
              colors.border.primary,
              colors.bg.subtle
            )}>
              <h3 className={cn('mb-4 text-sm font-semibold', colors.text.primary)}>
                Clinical Context
              </h3>

              <div className="space-y-4">
                {request.clinical_notes && (
                  <div>
                    <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                      Clinical Notes
                    </p>
                    <p className={cn('mt-1 text-sm leading-6 break-words', colors.text.primary)}>
                      {request.clinical_notes}
                    </p>
                  </div>
                )}

                {diagnosisNotes && (
                  <div>
                    <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                      Diagnosis Notes
                    </p>
                    <p className={cn('mt-1 text-sm leading-6 break-words', colors.text.primary)}>
                      {diagnosisNotes}
                    </p>
                  </div>
                )}

                {suspectedConditions.length > 0 && (
                  <div>
                    <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                      Suspected Conditions
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suspectedConditions.map((condition) => (
                        <span
                          key={condition}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium break-words',
                            isDark ? 'bg-blue-950/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                          )}
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {icdCodes.length > 0 && (
                  <div>
                    <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                      ICD Codes
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {icdCodes.map((code) => (
                        <span
                          key={code}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium break-words',
                            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {formatLabel(code)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Notice */}
      {request.cancellation_reason && (
        <div
          className={cn(
            'mt-5 rounded-xl border',
            'px-4 py-3 text-sm',
            isDark ? 'border-red-900/40 bg-red-950/20 text-red-300' : 'border-red-200 bg-red-50 text-red-700'
          )}
        >
          <strong>Cancellation Reason:</strong>{' '}
          <span className="break-words">{request.cancellation_reason}</span>
        </div>
      )}
    </section>
  );
};

export default LabResultRequestSummary;