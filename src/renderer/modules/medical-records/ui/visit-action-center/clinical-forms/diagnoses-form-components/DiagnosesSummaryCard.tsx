import React from 'react';
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FilePenLine,
  Info,
  Printer,
  AlertTriangle,
  UserRound,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  formatDiagnosisDate,
  getCertaintyBadgeColor,
//   getClinicalStatusBadgeColor,
  getDiagnosisMeta,
} from './diagnosesForm.utils';
import {
  DIAGNOSIS_TYPE_LABELS,
  DIAGNOSIS_CERTAINTY_LABELS,
  DIAGNOSIS_CLINICAL_STATUS_LABELS,
  DIAGNOSIS_VERIFICATION_STATUS_LABELS,
  getDiagnosisStatusColor,
  getDiagnosisClinicalStatusColor,
} from '../../../../api/diagnosis/diagnosisTypes';
import type {
  DiagnosisResponse,
  DiagnosesThemeTokens,
  DynamicCustomFields,
} from './diagnosesForm.types';

interface DiagnosesSummaryCardProps {
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  diagnosis: DiagnosisResponse;
  customFields: DynamicCustomFields;
  onEdit: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onVerify?: () => void;
  onDispute?: () => void;
  onResolve?: () => void;
  onReactivate?: () => void;
  onRestore?: () => void;
}

export const DiagnosesSummaryCard: React.FC<DiagnosesSummaryCardProps> = ({
  isDark,
  colors,
  diagnosis,
  customFields,
  onEdit,
  onPreview,
  onPrint,
  onDownload,
  onVerify,
  onDispute,
  onResolve,
  onReactivate,
  onRestore,
}) => {
  const meta = getDiagnosisMeta(diagnosis);
  const isVerified = diagnosis.verification_status === 'verified';
//   const isDraft = diagnosis.verification_status === 'draft';
  const isDisputed = diagnosis.verification_status === 'disputed';
  const isResolved = diagnosis.clinical_status === 'resolved';
//   const isActive = diagnosis.clinical_status === 'active';
  const isDeleted = !!diagnosis.deleted_at;

  const statusColors = getDiagnosisStatusColor(diagnosis.verification_status);
  const clinicalStatusColors = getDiagnosisClinicalStatusColor(diagnosis.clinical_status);

  return (
    <section
      className={cn(
        'rounded-2xl border mb-6',
        colors.border.primary,
        colors.bg.card
      )}
    >
      {/* Header */}
      <div className={cn('border-b p-5 sm:p-6', colors.border.primary)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className={cn('h-5 w-5', colors.text.brand)} />
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                {diagnosis.diagnosis_code} - {diagnosis.diagnosis_description.slice(0, 80)}
                {diagnosis.diagnosis_description.length > 80 && '...'}
              </h3>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {/* Verification Status Badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold',
                  statusColors.bg,
                  statusColors.text
                )}
              >
                {DIAGNOSIS_VERIFICATION_STATUS_LABELS[diagnosis.verification_status]}
              </span>

              {/* Clinical Status Badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium',
                  clinicalStatusColors.bg,
                  clinicalStatusColors.text
                )}
              >
                {DIAGNOSIS_CLINICAL_STATUS_LABELS[diagnosis.clinical_status]}
              </span>

              {/* Diagnosis Type */}
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 font-medium',
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                )}
              >
                {DIAGNOSIS_TYPE_LABELS[diagnosis.diagnosis_type]}
              </span>

              {/* Certainty */}
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 font-medium',
                  getCertaintyBadgeColor(diagnosis.certainty)
                )}
              >
                {DIAGNOSIS_CERTAINTY_LABELS[diagnosis.certainty]}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              {/* Onset Date */}
              {diagnosis.onset_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Onset: {formatDiagnosisDate(diagnosis.onset_date)}</span>
                </div>
              )}

              {/* Abatement Date */}
              {diagnosis.abatement_date && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Resolved: {formatDiagnosisDate(diagnosis.abatement_date)}</span>
                </div>
              )}

              {/* Verified Info */}
              {diagnosis.verified_at && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  <span>
                    Verified: {formatDiagnosisDate(diagnosis.verified_at)}
                    {meta.verifierName && ` by ${meta.verifierName}`}
                  </span>
                </div>
              )}

              {/* Dispute Reason */}
              {diagnosis.dispute_reason && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <span>Disputed: {diagnosis.dispute_reason.slice(0, 50)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Workflow Action Buttons */}
            {onVerify && !isVerified && !isDisputed && (
              <button
                type="button"
                onClick={onVerify}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  'bg-green-600 text-white hover:bg-green-700'
                )}
              >
                <CheckCircle className="h-4 w-4" />
                Verify
              </button>
            )}

            {onDispute && !isDisputed && (
              <button
                type="button"
                onClick={onDispute}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                  'border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
                  isDark && 'border-red-800/50 bg-red-950/30 text-red-300 hover:bg-red-950/50'
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                Dispute
              </button>
            )}

            {onResolve && !isResolved && isVerified && (
              <button
                type="button"
                onClick={onResolve}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  'bg-teal-600 text-white hover:bg-teal-700'
                )}
              >
                <CheckCircle className="h-4 w-4" />
                Resolve
              </button>
            )}

            {onReactivate && isResolved && (
              <button
                type="button"
                onClick={onReactivate}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  'bg-amber-600 text-white hover:bg-amber-700'
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Reactivate
              </button>
            )}

            {onRestore && isDeleted && (
              <button
                type="button"
                onClick={onRestore}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  'bg-gray-600 text-white hover:bg-gray-700'
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Restore
              </button>
            )}

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

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>

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

            <button
              type="button"
              onClick={onEdit}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                isDark
                  ? 'border-amber-800/50 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              )}
            >
              <FilePenLine className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="p-5 sm:p-6">
        {/* Clinical Notes Section */}
        {diagnosis.clinical_notes && (
          <div className={cn('mb-4 rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2 mb-2">
              <Info className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-sm font-medium', colors.text.primary)}>Clinical Notes</span>
            </div>
            <p className={cn('text-sm', colors.text.secondary)}>{diagnosis.clinical_notes}</p>
          </div>
        )}

        {/* Diagnostic Criteria Met Section */}
        {diagnosis.diagnostic_criteria_met && (
          <div className={cn('mb-4 rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-sm font-medium', colors.text.primary)}>Diagnostic Criteria Met</span>
            </div>
            <p className={cn('text-sm', colors.text.secondary)}>{diagnosis.diagnostic_criteria_met}</p>
          </div>
        )}

        {/* Supporting Evidence Section */}
        {(diagnosis.supporting_evidence?.labs?.length ||
          diagnosis.supporting_evidence?.imaging?.length ||
          diagnosis.supporting_evidence?.clinical_findings?.length) && (
          <div className={cn('mb-4 rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-sm font-medium', colors.text.primary)}>Supporting Evidence</span>
            </div>

            <div className="space-y-3">
              {diagnosis.supporting_evidence.labs && diagnosis.supporting_evidence.labs.length > 0 && (
                <div>
                  <span className={cn('text-xs font-medium', colors.text.tertiary)}>Labs:</span>
                  <p className={cn('text-sm', colors.text.secondary)}>
                    {diagnosis.supporting_evidence.labs.join(', ')}
                  </p>
                </div>
              )}

              {diagnosis.supporting_evidence.imaging && diagnosis.supporting_evidence.imaging.length > 0 && (
                <div>
                  <span className={cn('text-xs font-medium', colors.text.tertiary)}>Imaging:</span>
                  <p className={cn('text-sm', colors.text.secondary)}>
                    {diagnosis.supporting_evidence.imaging.join(', ')}
                  </p>
                </div>
              )}

              {diagnosis.supporting_evidence.clinical_findings && diagnosis.supporting_evidence.clinical_findings.length > 0 && (
                <div>
                  <span className={cn('text-xs font-medium', colors.text.tertiary)}>Clinical Findings:</span>
                  <p className={cn('text-sm', colors.text.secondary)}>
                    {diagnosis.supporting_evidence.clinical_findings.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Fields Section */}
        {customFields.length > 0 && (
          <div className="mt-4">
            <h4 className={cn('mb-3 text-sm font-semibold', colors.text.primary)}>
              Additional Information
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {customFields.map((field) => (
                <div
                  key={field.id}
                  className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}
                >
                  <span className={cn('text-xs font-medium', colors.text.secondary)}>
                    {field.label}
                  </span>
                  <p className={cn('mt-1 text-sm', colors.text.primary)}>
                    {field.value || '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinician Info */}
        {meta.staffName && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <UserRound className={cn('h-4 w-4', colors.text.tertiary)} />
            <span className={colors.text.secondary}>Recorded by:</span>
            <span className={cn('font-medium', colors.text.primary)}>Dr. {meta.staffName}</span>
          </div>
        )}

        {/* Verifier Info (if different from recorder) */}
        {meta.verifierName && meta.verifierName !== meta.staffName && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <CheckCircle className={cn('h-4 w-4', colors.text.tertiary)} />
            <span className={colors.text.secondary}>Verified by:</span>
            <span className={cn('font-medium', colors.text.primary)}>Dr. {meta.verifierName}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default DiagnosesSummaryCard;