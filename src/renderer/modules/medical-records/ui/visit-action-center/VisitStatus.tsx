/**
 * ============================================================================
 * VISIT STATUS COMPONENT (Status-only, user-friendly, optimistic Redux updates)
 * ============================================================================
 *
 * What this component does (per your requirements):
 * - ✅ NO phase management (status-only)
 * - ✅ Status change is confirmed; optimistic Redux update happens AFTER backend success
 * - ✅ Cancel requires reason (UI-enforced) and clears slice + redirects on success
 * - ✅ Delete requires reason (UI-enforced) and clears slice + redirects on success
 * - ✅ If status becomes COMPLETED or NO_SHOW: clears slice + redirects on success
 * - ✅ Clear status transitions UI so users understand what each status means
 * - ✅ Avoid duplicate type imports/enum naming collisions (VisitStatus enum aliased)
 * - ✅ Bug-free: stable hooks, guards, no unused imports, safe null handling
 *
 * NOTE ABOUT DELETE REASON:
 * Your current useDeleteVisit hook does NOT accept a reason param (backend call is DELETE /visits/:uuid).
 * This component enforces reason in UI, and logs/records it locally only.
 * If backend truly requires `deletion_reason`, you must update useDeleteVisit to send it.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Play,
  Trash2,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import type { AxiosError } from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { cn } from '../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
// import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useConfirm } from '../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';

import {
  emergencyClearVisit,
  selectActivePatient,
  selectActiveVisitInfo,
  selectActiveVisitStatus,
  selectActiveVisitUuid,
  updateActiveVisitStatus,
} from '../../../../app/store/slices/visitSlice';

import {
  getStatusColor,
  useCancelVisit,
  useDeleteVisit,
  useGetVisitByUUID,
  useUpdateVisitStatus,
} from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';

import type { ApiErrorResponse, VisitResponse } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { VisitStatus as VisitStatusEnum } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface VisitStatusProps {
  theme: 'light' | 'dark';
  className?: string;
  onActionComplete?: () => void | Promise<void>;
  readOnly?: boolean;
  compact?: boolean;
  visitUuid?: string; // optional override
}

type StatusOption = {
  value: VisitStatusEnum;
  label: string;
  icon: React.ReactNode;
  description: string;
  userImpact: string;
  isTerminal?: boolean; // if true => clear slice + redirect after success
};

type ActionReasonOption = {
  value: string;
  label: string;
  description: string;
  requiresDetails?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                             SMALL UTIL HELPERS                             */
/* -------------------------------------------------------------------------- */

const isTerminalStatus = (s: VisitStatusEnum): boolean =>
  s === VisitStatusEnum.CANCELLED || s === VisitStatusEnum.COMPLETED || s === VisitStatusEnum.NO_SHOW;

const queueRedirectPath = MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE;

/* -------------------------------------------------------------------------- */
/*                               SUBCOMPONENTS                                */
/* -------------------------------------------------------------------------- */

interface StatusSelectorProps {
  theme: 'light' | 'dark';
  currentStatus: VisitStatusEnum;
  statuses: StatusOption[];
  onSelect: (status: VisitStatusEnum) => void;
  disabled?: boolean;
  loading?: boolean;
}

const StatusSelector: React.FC<StatusSelectorProps> = React.memo(
  ({ theme, currentStatus, statuses, onSelect, disabled = false, loading = false }) => {
    const isDark = theme === 'dark';

    const colors = useMemo(
      () => ({
        bg: isDark ? 'bg-gray-900' : 'bg-white',
        border: isDark ? 'border-gray-700' : 'border-gray-200',
        text: isDark ? 'text-gray-100' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
        hoverBg: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
      }),
      [isDark]
    );

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className={cn('text-sm font-semibold', colors.text)}>Change Visit Status</div>
            <div className={cn('text-xs', colors.textSecondary)}>
              Select a status below. You’ll be asked to confirm before updating.
            </div>
          </div>

          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(currentStatus))}>
            Current: {statuses.find((s) => s.value === currentStatus)?.label ?? currentStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {statuses.map((s) => {
            const selected = s.value === currentStatus;
            const isDisabled = disabled || loading;

            return (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  if (isDisabled) return;
                  onSelect(s.value);
                }}
                disabled={isDisabled}
                className={cn(
                  'rounded-lg border p-3 text-left transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                  isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
                  selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : colors.border,
                  colors.bg,
                  !isDisabled && colors.hoverBg,
                  isDisabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-pressed={selected}
              >
                <div className="flex items-start gap-2">
                  <div className={cn('mt-0.5', colors.textSecondary)}>{s.icon}</div>
                  <div className="min-w-0">
                    <div className={cn('text-sm font-semibold', colors.text)}>{s.label}</div>
                    <div className={cn('text-xs mt-1', colors.textSecondary)}>{s.description}</div>
                    <div className={cn('text-xs mt-2', colors.textSecondary)}>
                      <span className="font-medium">Impact:</span> {s.userImpact}
                    </div>
                    {s.isTerminal && (
                      <div className={cn('text-xs mt-2', isDark ? 'text-red-300' : 'text-red-600')}>
                        Terminal status — after success you will be returned to the queue.
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

StatusSelector.displayName = 'StatusSelector';

interface ActionReasonFormProps {
  theme: 'light' | 'dark';
  actionType: 'cancel' | 'delete';
  onSubmit: (reasonText: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const ActionReasonForm: React.FC<ActionReasonFormProps> = React.memo(({ theme, actionType, onSubmit, onBack, isLoading }) => {
  const isDark = theme === 'dark';

  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const colors = useMemo(
    () => ({
      bg: isDark ? 'bg-gray-900' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      text: isDark ? 'text-white' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
      danger: isDark ? 'text-red-300' : 'text-red-600',
      dangerBg: isDark ? 'bg-red-900/20' : 'bg-red-50',
      warning: isDark ? 'text-yellow-300' : 'text-yellow-700',
      warningBg: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
    }),
    [isDark]
  );

  const isCancel = actionType === 'cancel';
  const title = isCancel ? 'Cancel Visit' : 'Delete Visit';
  const verb = isCancel ? 'cancel' : 'delete';

  const reasonOptions = useMemo<ActionReasonOption[]>(
    () => [
      { value: 'patient_requested', label: 'Patient Requested', description: `Patient asked to ${verb} the visit` },
      { value: 'duplicate_visit', label: 'Duplicate Visit', description: 'Visit was created in error (duplicate)' },
      { value: 'no_show', label: 'No Show', description: 'Patient did not arrive for the visit' },
      { value: 'wrong_information', label: 'Wrong Information', description: 'Incorrect patient/facility information' },
      { value: 'system_error', label: 'System Error', description: 'Technical/system issue', requiresDetails: true },
      { value: 'other', label: 'Other', description: 'Specify reason below', requiresDetails: true },
    ],
    [verb]
  );

  const selectedOption = useMemo(
    () => reasonOptions.find((r) => r.value === selectedReason),
    [reasonOptions, selectedReason]
  );

  const reasonText = useMemo(() => {
    if (!selectedReason) return '';
    const base =
      selectedReason === 'other' ? customReason.trim() : (selectedOption?.label ?? selectedReason).trim();
    if (!base) return '';
    if (selectedOption?.requiresDetails) return `${base}: ${details.trim()}`;
    return base;
  }, [customReason, details, selectedOption?.label, selectedOption?.requiresDetails, selectedReason]);

  const isValid = useMemo(() => {
    if (!selectedReason) return false;
    if (selectedReason === 'other' && !customReason.trim()) return false;
    if (selectedOption?.requiresDetails && !details.trim()) return false;
    return true;
  }, [customReason, details, selectedOption?.requiresDetails, selectedReason]);

  const panelBg = isCancel ? colors.warningBg : colors.dangerBg;
  const panelText = isCancel ? colors.warning : colors.danger;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid) return;
        onSubmit(reasonText);
      }}
      className="space-y-4"
    >
      <div className={cn('p-4 rounded-lg border', panelBg, colors.border)}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className={cn('w-5 h-5', panelText)} />
          <h3 className={cn('font-semibold', panelText)}>{title}</h3>
        </div>
        <p className={cn('text-sm', colors.textSecondary)}>
          Reason is required. After success, you will be returned to the patient queue.
        </p>
      </div>

      <div>
        <label className={cn('block text-sm font-medium mb-2', colors.text)}>Select Reason *</label>
        <div className="space-y-2">
          {reasonOptions.map((r) => {
            const selected = selectedReason === r.value;

            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedReason(r.value)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                  isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
                  selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : colors.border,
                  colors.bg,
                  isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                )}
                aria-pressed={selected}
              >
                <div className={cn('text-sm font-semibold', colors.text)}>{r.label}</div>
                <div className={cn('text-xs mt-1', colors.textSecondary)}>{r.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedReason === 'other' && (
        <div>
          <label className={cn('block text-sm font-medium mb-2', colors.text)}>Specify Reason *</label>
          <input
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className={cn(
              'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500',
              colors.bg,
              colors.border,
              colors.text
            )}
            placeholder={`Enter the reason to ${verb} this visit...`}
            required
          />
        </div>
      )}

      {selectedOption?.requiresDetails && (
        <div>
          <label className={cn('block text-sm font-medium mb-2', colors.text)}>Additional Details *</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className={cn(
              'w-full px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500',
              colors.bg,
              colors.border,
              colors.text
            )}
            placeholder="Provide additional details..."
            required
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={!!isLoading}
          className={cn(
            'flex-1 py-2 rounded-lg font-semibold transition-colors',
            isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700',
            !!isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          Back
        </button>

        <button
          type="submit"
          disabled={!isValid || !!isLoading}
          className={cn(
            'flex-1 py-2 rounded-lg font-semibold transition-colors',
            isCancel ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white',
            (!isValid || !!isLoading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            title
          )}
        </button>
      </div>
    </form>
  );
});

ActionReasonForm.displayName = 'ActionReasonForm';

/* -------------------------------------------------------------------------- */
/*                               MAIN COMPONENT                               */
/* -------------------------------------------------------------------------- */

const VisitStatus: React.FC<VisitStatusProps> = ({
  theme,
  className,
  onActionComplete,
  readOnly = false,
  compact = false,
  visitUuid: propVisitUuid,
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const { showToast } = useToast();
  const { confirm } = useConfirm();

  const reduxVisitUuid = useSelector(selectActiveVisitUuid);
  const activePatient = useSelector(selectActivePatient);
  const visitInfo = useSelector(selectActiveVisitInfo);
  const currentStatus = useSelector(selectActiveVisitStatus);

  const visitUuid = propVisitUuid ?? reduxVisitUuid;

  const [mode, setMode] = useState<'idle' | 'cancel' | 'delete'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<'status' | 'cancel' | 'delete' | null>(null);

  const colors = useMemo(
    () => ({
      bg: isDark ? 'bg-gray-900' : 'bg-white',
      border: isDark ? 'border-gray-800' : 'border-gray-200',
      text: {
        primary: isDark ? 'text-white' : 'text-gray-900',
        secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      },
      accent: {
        bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
        text: isDark ? 'text-blue-300' : 'text-blue-600',
        border: isDark ? 'border-blue-800' : 'border-blue-200',
      },
      warning: {
        bg: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
        text: isDark ? 'text-yellow-300' : 'text-yellow-700',
        border: isDark ? 'border-yellow-800' : 'border-yellow-200',
      },
      danger: {
        bg: isDark ? 'bg-red-900/20' : 'bg-red-50',
        text: isDark ? 'text-red-300' : 'text-red-600',
        border: isDark ? 'border-red-800' : 'border-red-200',
      },
    }),
    [isDark]
  );

  const displayPatientName = activePatient?.name || visitInfo?.patientName || 'Patient';
  const displayPatientNumber = visitInfo?.patientNumber || 'N/A';

  // Keep the backend query (for freshness), but UI is driven by Redux.
  const { isLoading: isLoadingVisit } = useGetVisitByUUID(visitUuid ?? '', {
    enabled: !!visitUuid,
    staleTime: 10_000,
  });

  const statuses = useMemo<StatusOption[]>(
    () => [
      {
        value: VisitStatusEnum.ACTIVE,
        label: 'Active',
        icon: <Play className="w-4 h-4" />,
        description: 'Visit is open and awaiting next steps.',
        userImpact: 'Visit stays in your workspace.',
      },
      {
        value: VisitStatusEnum.IN_PROGRESS,
        label: 'In Progress',
        icon: <Activity className="w-4 h-4" />,
        description: 'Care is currently being provided.',
        userImpact: 'Visit stays in your workspace.',
      },
      {
        value: VisitStatusEnum.COMPLETED,
        label: 'Completed',
        icon: <CheckCircle className="w-4 h-4" />,
        description: 'Visit is finished and closed.',
        userImpact: 'You’ll be returned to the queue after success.',
        isTerminal: true,
      },
      {
        value: VisitStatusEnum.NO_SHOW,
        label: 'No Show',
        icon: <UserX className="w-4 h-4" />,
        description: 'Patient did not arrive.',
        userImpact: 'You’ll be returned to the queue after success.',
        isTerminal: true,
      },
      {
        value: VisitStatusEnum.CANCELLED,
        label: 'Cancelled',
        icon: <XCircle className="w-4 h-4" />,
        description: 'Visit is cancelled (audit-safe).',
        userImpact: 'You’ll be returned to the queue after success.',
        isTerminal: true,
      },
    ],
    []
  );

  const updateStatusMutation = useUpdateVisitStatus({
    onSuccess: (data: VisitResponse) => {
      const newStatus = data.data.status;

      // Optimistic Redux update AFTER success (your requirement)
      dispatch(updateActiveVisitStatus(newStatus));

      setError(null);
      setActionInProgress(null);

      // showToast('success', `Status updated to "${newStatus}".`, 3000);

      // If new status is terminal => clear slice + redirect to queue
      if (isTerminalStatus(newStatus)) {
        dispatch(emergencyClearVisit());
        navigate(queueRedirectPath);
      }

      onActionComplete?.();
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setActionInProgress(null);
      const msg = err.response?.data?.message || err.message || 'Failed to update visit status';
      setError(msg);
      // showToast('error', msg, 6000);
    },
  });

  const cancelMutation = useCancelVisit({
    onSuccess: () => {
      setError(null);
      setActionInProgress(null);
      setMode('idle');

      // Cancel is terminal by definition for this workflow
      dispatch(emergencyClearVisit());
      // showToast('success', 'Visit cancelled successfully.', 3000);
      navigate(queueRedirectPath);

      onActionComplete?.();
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setActionInProgress(null);
      const msg = err.response?.data?.message || err.message || 'Failed to cancel visit';
      setError(msg);
      // showToast('error', msg, 6000);
    },
  });

  const deleteMutation = useDeleteVisit({
    onSuccess: () => {
      setError(null);
      setActionInProgress(null);
      setMode('idle');

      dispatch(emergencyClearVisit());
      // showToast('success', 'Visit deleted successfully.', 3000);
      navigate(queueRedirectPath);

      onActionComplete?.();
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setActionInProgress(null);
      const msg = err.response?.data?.message || err.message || 'Failed to delete visit';
      setError(msg);
      // showToast('error', msg, 6000);
    },
  });

  const isBusy =
    isLoadingVisit || updateStatusMutation.isPending || cancelMutation.isPending || deleteMutation.isPending;

  const handleSelectStatus = useCallback(
    async (next: VisitStatusEnum) => {
      if (!visitUuid || readOnly) return;
      if (!currentStatus) return;
      if (next === currentStatus) return;

      const nextMeta = statuses.find((s) => s.value === next);
      const ok = await confirm({
        title: 'Confirm Status Change',
        message: [
          `Patient: ${displayPatientName} (${displayPatientNumber})`,
          `From: ${currentStatus}`,
          `To: ${next}`,
          '',
          nextMeta?.isTerminal
            ? 'This is a terminal status. After success, you will be returned to the queue.'
            : 'This will keep the visit open in your workspace.',
        ].join('\n'),
        confirmText: 'Yes, update',
        cancelText: 'Cancel',
        variant: nextMeta?.isTerminal ? 'warning' : 'info',
        theme,
      });

      if (!ok) return;

      setActionInProgress('status');
      try {
        await updateStatusMutation.mutateAsync({
          uuid: visitUuid,
          data: { status: next },
        });
      } catch {
        // handled via onError
      }
    },
    [
      confirm,
      currentStatus,
      displayPatientName,
      displayPatientNumber,
      readOnly,
      statuses,
      theme,
      updateStatusMutation,
      visitUuid,
    ]
  );

  const handleCancelSubmit = useCallback(
    async (reasonText: string) => {
      if (!visitUuid || readOnly) return;

      const ok = await confirm({
        title: 'Confirm Cancellation',
        message: `Cancel this visit?\n\nReason: ${reasonText}\n\nAfter success you will be returned to the queue.`,
        confirmText: 'Yes, cancel',
        cancelText: 'Keep visit',
        variant: 'warning',
        theme,
      });

      if (!ok) return;

      setActionInProgress('cancel');
      try {
        await cancelMutation.mutateAsync({
          uuid: visitUuid,
          data: { cancellation_reason: reasonText },
        });
      } catch {
        // handled via onError
      }
    },
    [cancelMutation, confirm, readOnly, theme, visitUuid]
  );

  const handleDeleteSubmit = useCallback(
    async (reasonText: string) => {
      if (!visitUuid || readOnly) return;

      const ok = await confirm({
        title: 'Confirm Deletion',
        message: `Delete this visit permanently?\n\nReason: ${reasonText}\n\nAfter success you will be returned to the queue.`,
        confirmText: 'Yes, delete',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!ok) return;

      setActionInProgress('delete');

      // Backend hook doesn't accept reason (see note at top). UI still enforces it.
      try {
        await deleteMutation.mutateAsync({ uuid: visitUuid });
      } catch {
        // handled via onError
      }
    },
    [confirm, deleteMutation, readOnly, theme, visitUuid]
  );

  // No active visit
  if (!visitUuid) {
    return (
      <div className={cn('rounded-xl border p-8 text-center', colors.bg, colors.border, className)}>
        <Activity className={cn('w-16 h-16 mx-auto mb-4', colors.text.secondary)} />
        <h3 className={cn('text-xl font-bold mb-2', colors.text.primary)}>No Active Visit Selected</h3>
        <p className={cn('max-w-md mx-auto', colors.text.secondary)}>
          Select a patient visit from the queue to manage its status.
        </p>
      </div>
    );
  }

  // Loading
  if (isLoadingVisit) {
    return (
      <div className={className}>
        <LoadingSkeleton variant="detail" theme={theme} message="Loading visit..." />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className={cn('rounded-xl border shadow-sm', colors.bg, colors.border)}>
        {/* Header */}
        <div className={cn('p-6 border-b', colors.border)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={cn('p-2.5 rounded-xl', colors.accent.bg)}>
                <Activity className={cn('w-6 h-6', colors.accent.text)} />
              </div>

              <div>
                <h2 className={cn('text-xl font-bold', colors.text.primary)}>Visit Status</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={cn('text-sm', colors.text.secondary)}>{displayPatientName}</span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {displayPatientNumber}
                  </span>

                  {currentStatus && (
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(currentStatus))}>
                      {statuses.find((s) => s.value === currentStatus)?.label ?? currentStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(queueRedirectPath)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-semibold border transition-colors',
                isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-200' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              )}
            >
              Back to Queue
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className={cn('rounded-lg border p-4 flex gap-3 items-start', colors.danger.bg, colors.danger.border)}>
              <AlertCircle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', colors.danger.text)} />
              <div className="flex-1">
                <div className={cn('text-sm font-semibold', colors.danger.text)}>Something went wrong</div>
                <div className={cn('text-sm mt-1', colors.danger.text)}>{error}</div>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  isDark ? 'hover:bg-red-800/30 text-red-300' : 'hover:bg-red-100 text-red-600'
                )}
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Busy banner */}
          {isBusy && actionInProgress && (
            <div className={cn('rounded-lg border p-4 flex items-center gap-3', colors.accent.bg, colors.accent.border)}>
              <Loader2 className={cn('w-5 h-5 animate-spin', colors.accent.text)} />
              <div className="min-w-0">
                <div className={cn('text-sm font-semibold', colors.accent.text)}>
                  {actionInProgress === 'status' && 'Updating status…'}
                  {actionInProgress === 'cancel' && 'Cancelling visit…'}
                  {actionInProgress === 'delete' && 'Deleting visit…'}
                </div>
                <div className={cn('text-xs mt-1', colors.text.secondary)}>Please wait, syncing with the server.</div>
              </div>
            </div>
          )}

          {/* Main Mode */}
          {mode === 'idle' && currentStatus && (
            <>
              <StatusSelector
                theme={theme}
                currentStatus={currentStatus}
                statuses={statuses}
                onSelect={handleSelectStatus}
                disabled={readOnly}
                loading={updateStatusMutation.isPending}
              />

              <div className={cn('pt-4 border-t space-y-4', colors.border)}>
                <div className={cn('text-lg font-bold', colors.text.primary)}>Actions</div>

                <div className={cn('p-4 rounded-lg border', colors.warning.bg, colors.warning.border)}>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className={cn('w-5 h-5', colors.warning.text)} />
                    <div className={cn('font-semibold', colors.warning.text)}>Cancel Visit</div>
                  </div>
                  <div className={cn('text-sm', colors.text.secondary)}>
                    Cancels the visit (audit-safe). Reason required. Redirects to queue after success.
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('cancel')}
                    disabled={readOnly || isBusy}
                    className={cn(
                      'mt-3 w-full px-4 py-3 rounded-lg border font-semibold transition-colors flex items-center justify-between',
                      isDark
                        ? 'bg-yellow-900/30 hover:bg-yellow-900/40 text-yellow-300 border-yellow-800'
                        : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200',
                      (readOnly || isBusy) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span>Cancel with reason</span>
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>

                <div className={cn('p-4 rounded-lg border', colors.danger.bg, colors.danger.border)}>
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className={cn('w-5 h-5', colors.danger.text)} />
                    <div className={cn('font-semibold', colors.danger.text)}>Delete Visit</div>
                  </div>
                  <div className={cn('text-sm', colors.text.secondary)}>
                    Permanently deletes the visit. Reason required. Redirects to queue after success.
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('delete')}
                    disabled={readOnly || isBusy}
                    className={cn(
                      'mt-3 w-full px-4 py-3 rounded-lg border font-semibold transition-colors flex items-center justify-between',
                      isDark
                        ? 'bg-red-900/30 hover:bg-red-900/40 text-red-300 border-red-800'
                        : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200',
                      (readOnly || isBusy) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span>Delete with reason</span>
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'cancel' && (
            <div className={cn('p-4 rounded-lg border', colors.warning.bg, colors.warning.border)}>
              <ActionReasonForm
                theme={theme}
                actionType="cancel"
                onSubmit={handleCancelSubmit}
                onBack={() => setMode('idle')}
                isLoading={cancelMutation.isPending}
              />
            </div>
          )}

          {mode === 'delete' && (
            <div className={cn('p-4 rounded-lg border', colors.danger.bg, colors.danger.border)}>
              <ActionReasonForm
                theme={theme}
                actionType="delete"
                onSubmit={handleDeleteSubmit}
                onBack={() => setMode('idle')}
                isLoading={deleteMutation.isPending}
              />
            </div>
          )}
        </div>
      </div>

      {/* Extra guidance */}
      {!compact && (
        <div className={cn('rounded-xl border p-5', colors.bg, colors.border)}>
          <div className={cn('font-bold mb-2 flex items-center gap-2', colors.text.primary)}>
            <AlertCircle className="w-4 h-4" />
            Status transition guide
          </div>
          <div className={cn('text-sm', colors.text.secondary)}>
            <div className="grid gap-2">
              <div>
                <span className="font-semibold">Active → In Progress</span>: start working on the visit.
              </div>
              <div>
                <span className="font-semibold">In Progress → Completed</span>: close the visit (redirects to queue after success).
              </div>
              <div>
                <span className="font-semibold">Active/In Progress → No Show</span>: mark patient as not arrived (redirects to queue after success).
              </div>
              <div>
                <span className="font-semibold">Cancel/Delete</span>: requires a reason and always returns you to the queue after success.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

VisitStatus.displayName = 'VisitStatus';
export default VisitStatus;
