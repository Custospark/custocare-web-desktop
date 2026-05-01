import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  FileText,
  Pencil,
  ShieldAlert,
  Trash2,
  XCircle,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import { LabRequestPriority, LabRequestStatus } from '../../../../api/lab/LabTypes';
import type { ColorTokens, LabRequestFormData } from './labRequestForm.types';

interface LabRequestDetailsCardProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest | null;
  formData: LabRequestFormData;
  isEditorOpen: boolean;
  onOpenEditor: () => void;
  onCloseEditor: () => void;
  onChange: (field: keyof LabRequestFormData, value: string | LabRequestPriority) => void;
  onCancelRequest?: () => void;
  isCancellingRequest?: boolean;
}

const SummaryRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  colors: ColorTokens;
}> = ({ icon, label, value, colors }) => (
  <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
          {label}
        </p>
        <p className={cn('mt-1 text-sm break-words', value ? colors.text.primary : colors.text.secondary)}>
          {value || 'Not provided yet'}
        </p>
      </div>
    </div>
  </div>
);

export const LabRequestDetailsCard: React.FC<LabRequestDetailsCardProps> = ({
  isDark,
  colors,
  request,
  formData,
  isEditorOpen,
  onOpenEditor,
  onCloseEditor,
  onChange,
  onCancelRequest,
  isCancellingRequest = false,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Permission rules based on request status
  const canEdit = !!request && !['cancelled', 'completed', 'reviewed'].includes(request.status);
  
  const canCancel = !!request && 
    request.status !== LabRequestStatus.CANCELLED &&
    request.status !== LabRequestStatus.COMPLETED &&
    request.status !== LabRequestStatus.IN_PROGRESS &&
    request.status !== LabRequestStatus.REVIEWED;
  
  const getCancelButtonTooltip = (): string => {
    if (!request) return '';
    switch (request.status) {
      case LabRequestStatus.COMPLETED:
        return 'Cannot cancel completed requests';
      case LabRequestStatus.REVIEWED:
        return 'Cannot cancel reviewed requests';
      case LabRequestStatus.CANCELLED:
        return 'Request is already cancelled';
      default:
        return 'Cancel this lab request';
    }
  };
  
  const getEditButtonTooltip = (): string => {
    if (!request) return '';
    switch (request.status) {
      case LabRequestStatus.COMPLETED:
        return 'Cannot edit completed requests';
      case LabRequestStatus.REVIEWED:
        return 'Cannot edit reviewed requests';
      case LabRequestStatus.CANCELLED:
        return 'Cannot edit cancelled requests';
      default:
        return 'Edit request details';
    }
  };

  return (
    <>
      <div className={cn('rounded-2xl border p-5', colors.border.primary, colors.bg.card)}>
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className={cn('text-base font-semibold', colors.text.primary)}>
              Lab Request Details
            </h3>
            {request?.requested_by && (
              <p className={cn('mt-1 text-xs font-bold', colors.text.secondary)}>
                Requested by: Dr. {request.requested_by.name || 'Unknown clinician'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isEditorOpen ? (
              <>
                {/* Edit button - only show if accessible */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={onOpenEditor}
                    title={getEditButtonTooltip()}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                      colors.bg.hover,
                      colors.text.brand
                    )}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Details
                  </button>
                )}

                {/* Cancel button - only show if accessible */}
                {canCancel && onCancelRequest && (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={isCancellingRequest}
                    title={getCancelButtonTooltip()}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                      'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40',
                      isCancellingRequest && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isCancellingRequest ? 'Cancelling...' : 'Cancel Request'}
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={onCloseEditor}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                Done
              </button>
            )}
          </div>
        </div>

        {!isEditorOpen ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryRow
                icon={<ShieldAlert className={cn('h-4 w-4', isDark ? 'text-orange-300' : 'text-orange-600')} />}
                label="Priority"
                value={formData.priority || request?.priority_label}
                colors={colors}
              />
              <SummaryRow
                icon={<Activity className={cn('h-4 w-4', isDark ? 'text-blue-300' : 'text-blue-600')} />}
                label="Status"
                value={request?.status_label || request?.status}
                colors={colors}
              />
              <SummaryRow
                icon={<ClipboardList className={cn('h-4 w-4', isDark ? 'text-violet-300' : 'text-violet-600')} />}
                label="ICD Codes"
                value={formData.icd_codes}
                colors={colors}
              />
              <SummaryRow
                icon={<ClipboardList className={cn('h-4 w-4', isDark ? 'text-green-300' : 'text-green-600')} />}
                label="Suspected Conditions"
                value={formData.suspected_conditions}
                colors={colors}
              />
            </div>

            <SummaryRow
              icon={<FileText className={cn('h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />}
              label="Clinical Notes"
              value={formData.clinical_notes}
              colors={colors}
            />

            <SummaryRow
              icon={<FileText className={cn('h-4 w-4', isDark ? 'text-pink-300' : 'text-pink-600')} />}
              label="Diagnosis Notes"
              value={formData.diagnosis_notes}
              colors={colors}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => onChange('priority', e.target.value as LabRequestPriority)}
                className={cn(
                  'w-full rounded-lg border p-2.5 text-sm',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              >
                {Object.values(LabRequestPriority).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                ICD Codes
              </label>
              <input
                type="text"
                value={formData.icd_codes}
                onChange={(e) => onChange('icd_codes', e.target.value)}
                placeholder="Comma-separated ICD codes"
                className={cn(
                  'w-full rounded-lg border p-2.5 text-sm',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>

            <div>
              <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                Suspected Conditions
              </label>
              <input
                type="text"
                value={formData.suspected_conditions}
                onChange={(e) => onChange('suspected_conditions', e.target.value)}
                placeholder="Comma-separated conditions"
                className={cn(
                  'w-full rounded-lg border p-2.5 text-sm',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>

            <div>
              <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                Diagnosis Notes
              </label>
              <textarea
                rows={3}
                value={formData.diagnosis_notes}
                onChange={(e) => onChange('diagnosis_notes', e.target.value)}
                placeholder="Clinical context, suspected diagnosis, rationale..."
                className={cn(
                  'w-full rounded-lg border p-2.5 text-sm resize-y',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>

            <div>
              <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                Clinical Notes
              </label>
              <textarea
                rows={4}
                value={formData.clinical_notes}
                onChange={(e) => onChange('clinical_notes', e.target.value)}
                placeholder="Reason for request, specimen handling guidance, clinical instructions..."
                className={cn(
                  'w-full rounded-lg border p-2.5 text-sm resize-y',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>
          </div>
        )}
      </div>

      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowCancelConfirm(false)}
        >
          <div className={cn('w-full max-w-md rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}>
            <div className={cn('flex items-center gap-3 border-b p-5', colors.border.primary)}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>Cancel Lab Request</h3>
            </div>

            <div className="p-5">
              <p className={cn('text-sm', colors.text.primary)}>
                Are you sure you want to cancel this lab request?
              </p>
              <p className={cn('mt-2 text-sm', colors.text.secondary)}>
                {request?.status === LabRequestStatus.IN_PROGRESS 
                  ? 'This request is already in progress. Cancelling it will stop any ongoing work, and some tests may have been partially completed.'
                  : 'This will mark the request as cancelled and it will no longer proceed through the workflow.'
                }
              </p>
            </div>

            <div className={cn('flex justify-end gap-3 border-t p-5', colors.border.primary)}>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}
              >
                Keep Request
              </button>

              <button
                type="button"
                onClick={() => {
                  onCancelRequest?.();
                  setShowCancelConfirm(false);
                }}
                disabled={isCancellingRequest}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                  isCancellingRequest ? 'cursor-not-allowed bg-gray-400' : 'cursor-pointer bg-red-600 hover:bg-red-700'
                )}
              >
                {isCancellingRequest ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LabRequestDetailsCard;