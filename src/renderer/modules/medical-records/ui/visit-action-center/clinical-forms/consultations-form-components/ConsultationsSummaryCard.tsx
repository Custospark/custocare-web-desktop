import React from 'react';
import {
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FilePenLine,
  Printer,
  AlertTriangle,
  UserRound,
  RefreshCw,
  MapPin,
  CalendarDays,
  FileText,
  Send,
  Ban,
  CalendarCheck,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  formatConsultationDate,
  formatConsultationDateTime,
  getConsultationMeta,
  getResponseTime,
} from './consultationsForm.utils';
import {
  CONSULTATION_TYPE_LABELS,
  CONSULTATION_PRIORITY_LABELS,
  CONSULTATION_STATUS_LABELS,
  getConsultationPriorityColor,
  getConsultationStatusColor,
  ConsultationStatus,
} from '../../../../api/consultations/consultationTypes';
import type {
  ConsultationResponse,
  ConsultationsThemeTokens,
  DynamicCustomFields,
} from './consultationsForm.types';

interface ConsultationsSummaryCardProps {
  isDark: boolean;
  colors: ConsultationsThemeTokens;
  consultation: ConsultationResponse;
  customFields: DynamicCustomFields;
  onEdit: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onComplete?: () => void;
  onCancelRequest?: () => void;
  onSchedule?: () => void;
  onRestore?: () => void;
}

export const ConsultationsSummaryCard: React.FC<ConsultationsSummaryCardProps> = ({
  isDark,
  colors,
  consultation,
  customFields,
  onEdit,
  onPreview,
  onPrint,
  onDownload,
  onAccept,
  onDecline,
  onComplete,
  onCancelRequest,
  onSchedule,
  onRestore,
}) => {
  const meta = getConsultationMeta(consultation);
  const isPending = consultation.request_status === ConsultationStatus.PENDING;
  const isAccepted = consultation.request_status === ConsultationStatus.ACCEPTED;
  const isCompleted = consultation.request_status === ConsultationStatus.COMPLETED;
  const isDeclined = consultation.request_status === ConsultationStatus.DECLINED;
  const isCancelled = consultation.request_status === ConsultationStatus.CANCELLED;
  const isDeleted = !!consultation.deleted_at;

  const priorityColors = getConsultationPriorityColor(consultation.priority);
  const statusColors = getConsultationStatusColor(consultation.request_status);
  const responseTime = getResponseTime(consultation);

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
            {/* Status Badges Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Priority Badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold',
                  priorityColors.bg,
                  priorityColors.text
                )}
              >
                {CONSULTATION_PRIORITY_LABELS[consultation.priority]}
              </span>

              {/* Status Badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium',
                  statusColors.bg,
                  statusColors.text
                )}
              >
                {CONSULTATION_STATUS_LABELS[consultation.request_status]}
              </span>

              {/* Consultation Type */}
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 font-medium',
                  isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-700'
                )}
              >
                {CONSULTATION_TYPE_LABELS[consultation.consultation_type]}
              </span>

              {/* Specialty Required */}
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 font-medium',
                  isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-700'
                )}
              >
                {consultation.specialty_required}
              </span>
            </div>

            {/* Dates Row */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              {/* Requested At */}
              <div className={cn('flex items-center gap-1', colors.text.secondary)}>
                <Calendar className="h-3.5 w-3.5" />
                <span>Requested: {formatConsultationDate(consultation.requested_at)}</span>
              </div>

              {/* Scheduled For */}
              {consultation.scheduled_for && (
                <div className={cn('flex items-center gap-1', colors.text.secondary)}>
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Scheduled: {formatConsultationDateTime(consultation.scheduled_for)}</span>
                </div>
              )}

              {/* Response Time */}
              {responseTime !== null && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span className={colors.text.secondary}>
                    Response time: {responseTime} hours
                  </span>
                </div>
              )}

              {/* Completed At */}
              {consultation.completed_at && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className={colors.text.secondary}>
                    Completed: {formatConsultationDate(consultation.completed_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Decline/Cancellation Reason */}
            {consultation.decline_reason && (
              <div className="mt-3 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                <span className={colors.text.secondary}>
                  Declined: {consultation.decline_reason}
                </span>
              </div>
            )}

            {consultation.cancellation_reason && (
              <div className="mt-3 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-gray-500" />
                <span className={colors.text.secondary}>
                  Cancelled: {consultation.cancellation_reason}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Workflow Action Buttons */}
            {onAccept && isPending && (
              <button
                type="button"
                onClick={onAccept}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all bg-green-600 text-white hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Accept
              </button>
            )}

            {onDecline && isPending && (
              <button
                type="button"
                onClick={onDecline}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                  'border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
                  isDark && 'border-red-800/50 bg-red-950/30 text-red-300 hover:bg-red-950/50'
                )}
              >
                <Ban className="h-4 w-4" />
                Decline
              </button>
            )}

            {onComplete && !isCompleted && (isAccepted || isPending) && (
              <button
                type="button"
                onClick={onComplete}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all bg-teal-600 text-white hover:bg-teal-700"
              >
                <CalendarCheck className="h-4 w-4" />
                Complete
              </button>
            )}

            {onSchedule && (isAccepted || isPending) && (
              <button
                type="button"
                onClick={onSchedule}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all bg-amber-600 text-white hover:bg-amber-700"
              >
                <Calendar className="h-4 w-4" />
                Schedule
              </button>
            )}

            {onCancelRequest && !isCompleted && !isDeclined && !isCancelled && (
              <button
                type="button"
                onClick={onCancelRequest}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  'border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100',
                  isDark && 'border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800'
                )}
              >
                <Trash2 className="h-4 w-4" />
                Cancel
              </button>
            )}

            {onRestore && isDeleted && (
              <button
                type="button"
                onClick={onRestore}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all bg-gray-600 text-white hover:bg-gray-700"
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
        {/* Clinical Question */}
        <div className={cn('mb-4 rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
          <div className="flex items-center gap-2 mb-2">
            <FileText className={cn('h-4 w-4', colors.text.tertiary)} />
            <span className={cn('text-sm font-medium', colors.text.primary)}>Clinical Question</span>
          </div>
          <p className={cn('text-sm', colors.text.secondary)}>{consultation.clinical_question}</p>
        </div>

        {/* Background Information */}
        {consultation.background_information && (
          <div className={cn('mb-4 rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-sm font-medium', colors.text.primary)}>Background Information</span>
            </div>
            <p className={cn('text-sm whitespace-pre-wrap', colors.text.secondary)}>
              {consultation.background_information}
            </p>
          </div>
        )}

        {/* Consultation Details Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
          {/* Location */}
          {consultation.location && (
            <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
              <div className="flex items-center gap-2">
                <MapPin className={cn('h-4 w-4', colors.text.tertiary)} />
                <span className={cn('text-xs font-medium', colors.text.secondary)}>Location</span>
              </div>
              <p className={cn('mt-1 text-sm', colors.text.primary)}>{consultation.location}</p>
            </div>
          )}

          {/* Duration */}
          <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
            <div className="flex items-center gap-2">
              <Clock className={cn('h-4 w-4', colors.text.tertiary)} />
              <span className={cn('text-xs font-medium', colors.text.secondary)}>Duration</span>
            </div>
            <p className={cn('mt-1 text-sm', colors.text.primary)}>
              {consultation.duration_minutes} minutes
            </p>
          </div>
        </div>

        {/* Consultant Response Section */}
        {(consultation.findings || consultation.recommendations || consultation.consultant_notes) && (
          <div className="mt-4">
            <h4 className={cn('mb-3 text-sm font-semibold', colors.text.primary)}>
              Consultant Response
            </h4>
            <div className="space-y-3">
              {consultation.findings && (
                <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
                  <span className={cn('text-xs font-medium', colors.text.secondary)}>Findings</span>
                  <p className={cn('mt-1 text-sm', colors.text.primary)}>{consultation.findings}</p>
                </div>
              )}
              {consultation.recommendations && (
                <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
                  <span className={cn('text-xs font-medium', colors.text.secondary)}>Recommendations</span>
                  <p className={cn('mt-1 text-sm', colors.text.primary)}>{consultation.recommendations}</p>
                </div>
              )}
              {consultation.consultant_notes && (
                <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
                  <span className={cn('text-xs font-medium', colors.text.secondary)}>Consultant Notes</span>
                  <p className={cn('mt-1 text-sm', colors.text.primary)}>{consultation.consultant_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Follow-up Section */}
        {consultation.requires_followup && (
          <div className="mt-4">
            <h4 className={cn('mb-3 text-sm font-semibold', colors.text.primary)}>
              Follow-up
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
                <span className={cn('text-xs font-medium', colors.text.secondary)}>Follow-up By</span>
                <p className={cn('mt-1 text-sm', colors.text.primary)}>
                  {consultation.followup_by ? formatConsultationDate(consultation.followup_by) : 'Not set'}
                </p>
              </div>
              {consultation.followup_instructions && (
                <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
                  <span className={cn('text-xs font-medium', colors.text.secondary)}>Instructions</span>
                  <p className={cn('mt-1 text-sm', colors.text.primary)}>{consultation.followup_instructions}</p>
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

        {/* Requesting Staff Info */}
        {meta.requestingStaffName && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Send className={cn('h-4 w-4', colors.text.tertiary)} />
            <span className={colors.text.secondary}>Requested by:</span>
            <span className={cn('font-medium', colors.text.primary)}>Dr. {meta.requestingStaffName}</span>
          </div>
        )}

        {/* Consultant Staff Info */}
        {meta.consultantStaffName && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <UserRound className={cn('h-4 w-4', colors.text.tertiary)} />
            <span className={colors.text.secondary}>Assigned to:</span>
            <span className={cn('font-medium', colors.text.primary)}>Dr. {meta.consultantStaffName}</span>
          </div>
        )}
      </div>
    </section>
  );
};

export default ConsultationsSummaryCard;