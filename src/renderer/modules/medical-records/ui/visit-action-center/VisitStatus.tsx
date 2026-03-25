/**
 * ============================================================================
 * VISIT STATUS COMPONENT - ENTERPRISE EDITION
 * Fully responsive with adaptive layouts and no text truncation
 * ============================================================================
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  PlayCircle,
  ShieldAlert,
  Trash2,
  UserRound,
  UserX,
  X,
  XCircle,
} from 'lucide-react';

import { cn } from '../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
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

import type {
  ApiErrorResponse,
  VisitResponse,
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
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
  visitUuid?: string;
}

interface StatusOption {
  value: VisitStatusEnum;
  label: string;
  description: string;
  icon: React.ReactNode;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  isTerminal?: boolean;
}

interface ActionReasonOption {
  value: string;
  label: string;
  description: string;
  requiresDetails?: boolean;
}

type Mode = 'idle' | 'cancel' | 'delete';
type ActionInProgress = 'status' | 'cancel' | 'delete' | null;

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const queueRedirectPath = MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE;

const isTerminalStatus = (status: VisitStatusEnum): boolean =>
  status === VisitStatusEnum.CANCELLED ||
  status === VisitStatusEnum.COMPLETED ||
  status === VisitStatusEnum.NO_SHOW;

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: VisitStatusEnum.ACTIVE,
    label: 'Active',
    description: 'Visit is open and awaiting next steps',
    icon: <PlayCircle className="h-5 w-5" />,
    tone: 'info',
  },
  {
    value: VisitStatusEnum.IN_PROGRESS,
    label: 'In Progress',
    description: 'Care is currently being provided',
    icon: <Activity className="h-5 w-5" />,
    tone: 'neutral',
  },
  {
    value: VisitStatusEnum.COMPLETED,
    label: 'Completed',
    description: 'Visit is finished and closed',
    icon: <CheckCircle2 className="h-5 w-5" />,
    tone: 'success',
    isTerminal: true,
  },
  {
    value: VisitStatusEnum.NO_SHOW,
    label: 'No Show',
    description: 'Patient did not arrive',
    icon: <UserX className="h-5 w-5" />,
    tone: 'warning',
    isTerminal: true,
  },
  {
    value: VisitStatusEnum.CANCELLED,
    label: 'Cancelled',
    description: 'Visit is cancelled (audit-safe)',
    icon: <XCircle className="h-5 w-5" />,
    tone: 'danger',
    isTerminal: true,
  },
];

/* -------------------------------------------------------------------------- */
/*                              DESIGN UTILITIES                              */
/* -------------------------------------------------------------------------- */

const getToneClasses = (tone: StatusOption['tone'], isDark: boolean) => {
  const tones = {
    success: {
      light: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        ring: 'ring-emerald-300',
        hover: 'hover:border-emerald-300 hover:shadow-md',
      },
      dark: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-300',
        icon: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
        ring: 'ring-emerald-400/40',
        hover: 'hover:border-emerald-500/30',
      },
    },
    warning: {
      light: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: 'bg-amber-100 text-amber-700 border-amber-200',
        ring: 'ring-amber-300',
        hover: 'hover:border-amber-300',
      },
      dark: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        text: 'text-amber-300',
        icon: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
        ring: 'ring-amber-400/40',
        hover: 'hover:border-amber-500/30',
      },
    },
    danger: {
      light: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'bg-red-100 text-red-700 border-red-200',
        ring: 'ring-red-300',
        hover: 'hover:border-red-300',
      },
      dark: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-300',
        icon: 'bg-red-500/15 text-red-300 border-red-500/20',
        ring: 'ring-red-400/40',
        hover: 'hover:border-red-500/30',
      },
    },
    info: {
      light: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: 'bg-blue-100 text-blue-700 border-blue-200',
        ring: 'ring-blue-300',
        hover: 'hover:border-blue-300',
      },
      dark: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-300',
        icon: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
        ring: 'ring-blue-400/40',
        hover: 'hover:border-blue-500/30',
      },
    },
    neutral: {
      light: {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        icon: 'bg-slate-100 text-slate-700 border-slate-200',
        ring: 'ring-slate-300',
        hover: 'hover:border-slate-300',
      },
      dark: {
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/20',
        text: 'text-slate-300',
        icon: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
        ring: 'ring-slate-400/30',
        hover: 'hover:border-slate-500/30',
      },
    },
  };

  return isDark ? tones[tone].dark : tones[tone].light;
};

/* -------------------------------------------------------------------------- */
/*                             SUBCOMPONENTS                                  */
/* -------------------------------------------------------------------------- */

interface StatusCardProps {
  theme: 'light' | 'dark';
  option: StatusOption;
  currentStatus: VisitStatusEnum;
  onSelect: (status: VisitStatusEnum) => void;
  disabled?: boolean;
  loading?: boolean;
}

const StatusCard: React.FC<StatusCardProps> = React.memo(
  ({ theme, option, currentStatus, onSelect, disabled = false, loading = false }) => {
    const isDark = theme === 'dark';
    const selected = currentStatus === option.value;
    const tone = getToneClasses(option.tone, isDark);
    const isDisabled = disabled || loading;

    return (
      <motion.button
        type="button"
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        onClick={() => {
          if (isDisabled || selected) return;
          onSelect(option.value);
        }}
        disabled={isDisabled}
        className={cn(
          'w-full rounded-xl border p-4 text-left transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          isDark ? 'focus:ring-offset-gray-950' : 'focus:ring-offset-white',
          selected
            ? cn(tone.bg, tone.border, 'ring-2', tone.ring)
            : cn(
                isDark
                  ? 'border-gray-800 bg-gray-950/90 hover:border-gray-700'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
                tone.hover
              ),
          isDisabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <div className="flex gap-4">
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border', tone.icon)}>
            {option.icon}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className={cn('text-base font-semibold', tone.text)}>{option.label}</div>
                <div className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-slate-600')}>
                  {option.description}
                </div>
              </div>

              {option.isTerminal && (
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-medium',
                    isDark ? 'bg-red-500/10 text-red-300' : 'bg-red-100 text-red-700'
                  )}
                >
                  Terminal
                </span>
              )}
            </div>

            {selected && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" />
                <span>Current Status</span>
              </div>
            )}
          </div>
        </div>
      </motion.button>
    );
  }
);

StatusCard.displayName = 'StatusCard';

interface ActionCardProps {
  theme: 'light' | 'dark';
  title: string;
  description: string;
  buttonLabel: string;
  icon: React.ReactNode;
  tone: 'warning' | 'danger';
  disabled?: boolean;
  onClick: () => void;
}

const ActionCard: React.FC<ActionCardProps> = React.memo(
  ({ theme, title, description, buttonLabel, icon, tone, disabled = false, onClick }) => {
    const isDark = theme === 'dark';
    const toneClasses = getToneClasses(tone === 'warning' ? 'warning' : 'danger', isDark);

    return (
      <div className={cn('rounded-xl border p-5', toneClasses.bg, toneClasses.border)}>
        <div className="flex flex-col gap-5">
          {/* Content Section */}
          <div className="flex gap-4">
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border', toneClasses.icon)}>
              {icon}
            </div>

            <div className="flex-1">
              <h4 className={cn('text-base font-semibold', toneClasses.text)}>{title}</h4>
              <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-slate-600')}>
                {description}
              </p>
            </div>
          </div>

          {/* Button Section - Full width column */}
          <motion.button
            type="button"
            whileHover={!disabled ? { scale: 1.02 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-lg border px-5 py-3 text-sm font-semibold transition-all',
              'sm:px-6 sm:py-3.5',
              toneClasses.bg,
              toneClasses.border,
              toneClasses.text,
              !disabled && 'cursor-pointer hover:shadow-md',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <span className="flex-1 text-left break-words">{buttonLabel}</span>
            <AlertTriangle className="h-5 w-5 shrink-0" />
          </motion.button>
        </div>
      </div>
    );
  }
);

ActionCard.displayName = 'ActionCard';

interface ActionReasonFormProps {
  theme: 'light' | 'dark';
  actionType: 'cancel' | 'delete';
  onSubmit: (reasonText: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}



const ActionReasonForm: React.FC<ActionReasonFormProps> = React.memo(
  ({ theme, actionType, onSubmit, onBack, isLoading = false }) => {
    const isDark = theme === 'dark';
    const isCancel = actionType === 'cancel';

    const [selectedReason, setSelectedReason] = useState('');
    const [details, setDetails] = useState('');
    const [customReason, setCustomReason] = useState('');

    const reasonOptions = useMemo<ActionReasonOption[]>(
      () => [
        {
          value: 'patient_requested',
          label: 'Patient Requested',
          description: `Patient requested to ${isCancel ? 'cancel' : 'delete'} the visit.`,
        },
        {
          value: 'duplicate_visit',
          label: 'Duplicate Visit',
          description: 'Visit was created more than once and should not remain active.',
        },
        {
          value: 'no_show',
          label: 'No Show',
          description: 'Patient did not attend the visit.',
        },
        {
          value: 'wrong_information',
          label: 'Wrong Information',
          description: 'Visit contains incorrect patient, scheduling, or facility information.',
        },
        {
          value: 'system_error',
          label: 'System Error',
          description: 'A technical issue requires manual intervention.',
          requiresDetails: true,
        },
        {
          value: 'other',
          label: 'Other',
          description: 'Provide a custom reason.',
          requiresDetails: true,
        },
      ],
      [isCancel]
    );

    const selectedOption = useMemo(
      () => reasonOptions.find((reason) => reason.value === selectedReason),
      [reasonOptions, selectedReason]
    );

    const finalReasonText = useMemo(() => {
      if (!selectedReason) return '';

      // Handle "other" reason
      if (selectedReason === 'other') {
        const custom = customReason.trim();
        if (!custom) return '';
        // If details are provided for "other" (though "other" already has requiresDetails)
        const extra = details.trim();
        return extra ? `${custom}: ${extra}` : custom;
      }

      // Handle other reasons with requiresDetails
      const base = selectedOption?.label ?? selectedReason;
      if (selectedOption?.requiresDetails) {
        const extra = details.trim();
        return extra ? `${base}: ${extra}` : base;
      }

      return base;
    }, [customReason, details, selectedOption, selectedReason]);

    // FIXED: Simplified validation logic
    const isValid = useMemo(() => {
      if (!selectedReason) return false;
      
      // For "other" reason, require custom reason text
      if (selectedReason === 'other') {
        return customReason.trim().length > 0;
      }
      
      // For reasons that require additional details
      if (selectedOption?.requiresDetails) {
        return details.trim().length > 0;
      }
      
      // For all other reasons, just having the reason selected is enough
      return true;
    }, [selectedReason, selectedOption, customReason, details]);

    const tone = getToneClasses(isCancel ? 'warning' : 'danger', isDark);

    return (
      <form onSubmit={(e) => { e.preventDefault(); if (isValid) onSubmit(finalReasonText); }} className="space-y-6">
        <div className={cn('rounded-xl border p-5', tone.bg, tone.border)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tone.icon)}>
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className={cn('text-lg font-semibold', tone.text)}>
                  {isCancel ? 'Cancel Visit' : 'Delete Visit'}
                </h3>
                <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-slate-600')}>
                  Reason required. You will be returned to the queue after success.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={cn('mb-3 block text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
            Reason *
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {reasonOptions.map((option) => {
              const selected = option.value === selectedReason;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSelectedReason(option.value);
                    // Reset dependent fields when changing reason
                    if (option.value !== 'other') {
                      setCustomReason('');
                    }
                    if (!option.requiresDetails) {
                      setDetails('');
                    }
                  }}
                  className={cn(
                    'rounded-lg border p-4 text-left transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    isDark ? 'focus:ring-offset-gray-950' : 'focus:ring-offset-white',
                    selected
                      ? isDark
                        ? 'border-blue-500/40 bg-blue-500/10'
                        : 'border-blue-300 bg-blue-50'
                      : isDark
                        ? 'border-gray-800 bg-gray-950 hover:border-gray-700'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    'cursor-pointer'
                  )}
                >
                  <div className={cn('font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                    {option.label}
                  </div>
                  <div className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-slate-600')}>
                    {option.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Reason Input for "Other" */}
        {selectedReason === 'other' && (
          <div>
            <label className={cn('mb-2 block text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
              Specify Reason *
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-blue-500',
                isDark
                  ? 'border-gray-800 bg-gray-950 text-white focus:border-blue-500'
                  : 'border-slate-200 bg-white text-slate-900 focus:border-blue-500',
                'cursor-text'
              )}
              placeholder={`Enter the reason to ${isCancel ? 'cancel' : 'delete'} this visit`}
              autoFocus
            />
          </div>
        )}

        {/* Additional Details for reasons that require them (excluding "other" since it's handled separately) */}
        {selectedOption?.requiresDetails && selectedReason !== 'other' && (
          <div>
            <label className={cn('mb-2 block text-sm font-medium', isDark ? 'text-white' : 'text-slate-900')}>
              Additional Details *
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 outline-none transition focus:ring-2 focus:ring-blue-500',
                isDark
                  ? 'border-gray-800 bg-gray-950 text-white focus:border-blue-500'
                  : 'border-slate-200 bg-white text-slate-900 focus:border-blue-500',
                'cursor-text'
              )}
              placeholder="Provide additional details for audit purposes"
              autoFocus
            />
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className={cn(
              'rounded-lg border px-6 py-2.5 text-sm font-semibold transition-all',
              isDark
                ? 'border-gray-800 bg-gray-950 text-gray-200 hover:bg-gray-900'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              isLoading && 'cursor-not-allowed opacity-50',
              !isLoading && 'cursor-pointer'
            )}
          >
            Back
          </button>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={cn(
              'rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all',
              isCancel ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700',
              (!isValid || isLoading) && 'cursor-not-allowed opacity-50',
              isValid && !isLoading && 'cursor-pointer'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : isCancel ? (
              'Confirm Cancellation'
            ) : (
              'Confirm Deletion'
            )}
          </button>
        </div>
      </form>
    );
  }
);

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
  const { confirm } = useConfirm();

  const reduxVisitUuid = useSelector(selectActiveVisitUuid);
  const activePatient = useSelector(selectActivePatient);
  const visitInfo = useSelector(selectActiveVisitInfo);
  const currentStatus = useSelector(selectActiveVisitStatus);

  const visitUuid = propVisitUuid ?? reduxVisitUuid;

  const [mode, setMode] = useState<Mode>('idle');
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<ActionInProgress>(null);

  const { isLoading: isLoadingVisit } = useGetVisitByUUID(visitUuid ?? '', {
    enabled: !!visitUuid,
    staleTime: 10_000,
  });

  const updateStatusMutation = useUpdateVisitStatus({
    onSuccess: (response: VisitResponse) => {
      const nextStatus = response.data.status;
      dispatch(updateActiveVisitStatus(nextStatus));
      setError(null);
      setActionInProgress(null);

      if (isTerminalStatus(nextStatus)) {
        dispatch(emergencyClearVisit());
        navigate(queueRedirectPath);
      }

      onActionComplete?.();
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setActionInProgress(null);
      const message = err.response?.data?.message || err.message || 'Failed to update visit status';
      setError(message);
    },
  });

  const cancelMutation = useCancelVisit({
    onSuccess: () => {
      setError(null);
      setActionInProgress(null);
      setMode('idle');
      dispatch(emergencyClearVisit());
      navigate(queueRedirectPath);
      onActionComplete?.();
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setActionInProgress(null);
      const message = err.response?.data?.message || err.message || 'Failed to cancel visit';
      setError(message);
    },
  });

  const deleteMutation = useDeleteVisit({
    onSuccess: () => {
      setError(null);
      setActionInProgress(null);
      setMode('idle');
      dispatch(emergencyClearVisit());
      navigate(queueRedirectPath);
      onActionComplete?.();
    },
    onError: (err: AxiosError<ApiErrorResponse>) => {
      setActionInProgress(null);
      const message = err.response?.data?.message || err.message || 'Failed to delete visit';
      setError(message);
    },
  });

  const isBusy =
    isLoadingVisit ||
    updateStatusMutation.isPending ||
    cancelMutation.isPending ||
    deleteMutation.isPending;

  const handleBackToQueue = useCallback(() => {
    navigate(queueRedirectPath);
  }, [navigate]);

  const handleSelectStatus = useCallback(
    async (nextStatus: VisitStatusEnum) => {
      if (!visitUuid || readOnly || !currentStatus) return;
      if (nextStatus === currentStatus) return;

      const nextMeta = STATUS_OPTIONS.find((status) => status.value === nextStatus);
      const displayName = activePatient?.name || visitInfo?.patientName || 'Patient';
      const displayNumber = visitInfo?.patientNumber || 'N/A';

      const approved = await confirm({
        title: 'Confirm Status Change',
        message: [
          `Patient: ${displayName} (${displayNumber})`,
          `Current status: ${currentStatus}`,
          `New status: ${nextStatus}`,
          '',
          nextMeta?.isTerminal
            ? 'This is a terminal status. After success, the visit will be cleared and you will return to the queue.'
            : 'This update keeps the visit active in your current workspace.',
        ].join('\n'),
        confirmText: 'Update Status',
        cancelText: 'Cancel',
        variant: nextMeta?.isTerminal ? 'warning' : 'info',
        theme,
      });

      if (!approved) return;

      setActionInProgress('status');

      try {
        await updateStatusMutation.mutateAsync({
          uuid: visitUuid,
          data: { status: nextStatus },
        });
      } catch {
        // handled in onError
      }
    },
    [confirm, currentStatus, activePatient, visitInfo, readOnly, theme, updateStatusMutation, visitUuid]
  );

  const handleCancelSubmit = useCallback(
    async (reasonText: string) => {
      if (!visitUuid || readOnly) return;

      const approved = await confirm({
        title: 'Confirm Cancellation',
        message: `Cancel this visit?\n\nReason: ${reasonText}\n\nAfter success, you will return to the queue.`,
        confirmText: 'Yes, Cancel Visit',
        cancelText: 'Keep Visit',
        variant: 'warning',
        theme,
      });

      if (!approved) return;

      setActionInProgress('cancel');

      try {
        await cancelMutation.mutateAsync({
          uuid: visitUuid,
          data: { cancellation_reason: reasonText },
        });
      } catch {
        // handled in onError
      }
    },
    [cancelMutation, confirm, readOnly, theme, visitUuid]
  );

  const handleDeleteSubmit = useCallback(
    async (reasonText: string) => {
      if (!visitUuid || readOnly) return;

      const approved = await confirm({
        title: 'Confirm Deletion',
        message: `Delete this visit permanently?\n\nReason: ${reasonText}\n\nAfter success, you will return to the queue.`,
        confirmText: 'Yes, Delete Visit',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!approved) return;

      setActionInProgress('delete');

      try {
        await deleteMutation.mutateAsync({ uuid: visitUuid });
      } catch {
        // handled in onError
      }
    },
    [confirm, deleteMutation, readOnly, theme, visitUuid]
  );

  // No active visit state
  if (!visitUuid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl border p-8 text-center shadow-sm',
          isDark ? 'border-gray-800 bg-gray-950' : 'border-slate-200 bg-white',
          className
        )}
      >
        <div
          className={cn(
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
            isDark ? 'bg-gray-800' : 'bg-slate-100'
          )}
        >
          <ClipboardList className={cn('h-8 w-8', isDark ? 'text-gray-500' : 'text-slate-400')} />
        </div>

        <h3 className={cn('mb-2 text-xl font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
          No Active Visit Selected
        </h3>

        <p className={cn('mb-6 max-w-md', isDark ? 'text-gray-400' : 'text-slate-600')}>
          Select a patient visit from the queue to manage its status and track progress.
        </p>

        <button
          type="button"
          onClick={handleBackToQueue}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all',
            isDark
              ? 'border-gray-800 bg-gray-950 text-gray-200 hover:bg-gray-900'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            'cursor-pointer'
          )}
        >
          Go to Queue
          <ArrowRight className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }

  // Loading state
  if (isLoadingVisit) {
    return (
      <div className={className}>
        <LoadingSkeleton variant="detail" theme={theme} message="Loading visit details..." />
      </div>
    );
  }

  const currentStatusOption = STATUS_OPTIONS.find((s) => s.value === currentStatus);
  const displayName = activePatient?.name || visitInfo?.patientName || 'Patient';
  const displayNumber = visitInfo?.patientNumber || 'N/A';

  return (
    <div className={cn('space-y-6', className)}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'rounded-2xl border shadow-sm',
          isDark ? 'border-gray-800 bg-gray-950' : 'border-slate-200 bg-white'
        )}
      >
        {/* Header Section */}
        <div className={cn('border-b p-6', isDark ? 'border-gray-800' : 'border-slate-200')}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <div
                className={cn(
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl',
                  currentStatusOption
                    ? getToneClasses(currentStatusOption.tone, isDark).icon
                    : isDark
                    ? 'bg-gray-800 text-gray-500'
                    : 'bg-slate-100 text-slate-500'
                )}
              >
                {currentStatusOption?.icon || <Activity className="h-6 w-6" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className={cn('text-2xl font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                    Visit Status
                  </h2>

                  {currentStatus && (
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        getStatusColor(currentStatus)
                      )}
                    >
                      {currentStatusOption?.label || currentStatus}
                    </span>
                  )}

                  {readOnly && (
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium',
                        isDark ? 'bg-gray-800 text-gray-300' : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      Read Only
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <UserRound className={cn('h-4 w-4', isDark ? 'text-gray-500' : 'text-slate-400')} />
                    <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-slate-700')}>
                      {displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ClipboardList className={cn('h-4 w-4', isDark ? 'text-gray-500' : 'text-slate-400')} />
                    <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-slate-700')}>
                      Visit: {displayNumber}
                    </span>
                  </div>

                  {visitInfo?.arrivedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className={cn('h-4 w-4', isDark ? 'text-gray-500' : 'text-slate-400')} />
                      <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-slate-700')}>
                        Started: {new Date(visitInfo.arrivedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBackToQueue}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-all',
                isDark
                  ? 'border-gray-800 bg-gray-950 text-gray-200 hover:bg-gray-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                'cursor-pointer'
              )}
            >
              Back to Queue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={cn(
                    'rounded-xl border p-4',
                    isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className={cn('mt-0.5 h-5 w-5', isDark ? 'text-red-400' : 'text-red-600')} />
                    <div className="flex-1">
                      <div className={cn('font-semibold', isDark ? 'text-red-400' : 'text-red-800')}>
                        Something went wrong
                      </div>
                      <p className={cn('mt-1 text-sm', isDark ? 'text-red-300' : 'text-red-700')}>{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className={cn(
                        'rounded p-1 transition-colors',
                        isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-100',
                        'cursor-pointer'
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Processing Indicator */}
            <AnimatePresence>
              {isBusy && actionInProgress && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={cn(
                    'rounded-xl border p-4',
                    isDark ? 'border-blue-500/20 bg-blue-500/10' : 'border-blue-200 bg-blue-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Loader2 className={cn('h-5 w-5 animate-spin', isDark ? 'text-blue-400' : 'text-blue-600')} />
                    <div>
                      <div className={cn('font-semibold', isDark ? 'text-blue-400' : 'text-blue-800')}>
                        {actionInProgress === 'status' && 'Updating visit status...'}
                        {actionInProgress === 'cancel' && 'Cancelling visit...'}
                        {actionInProgress === 'delete' && 'Deleting visit...'}
                      </div>
                      <div className={cn('mt-1 text-sm', isDark ? 'text-blue-300' : 'text-blue-600')}>
                        Please wait while we synchronize with the server.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <AnimatePresence mode="wait">
              {mode === 'idle' && currentStatus && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Status Change Section */}
                  <div>
                    <div className="mb-4">
                      <h3 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        Change Status
                      </h3>
                      <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-slate-600')}>
                        Select a new status for this visit. You'll be prompted to confirm.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {STATUS_OPTIONS.map((option) => (
                        <StatusCard
                          key={option.value}
                          theme={theme}
                          option={option}
                          currentStatus={currentStatus}
                          onSelect={handleSelectStatus}
                          disabled={readOnly}
                          loading={updateStatusMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Administrative Actions */}
                  <div className={cn('pt-4', isDark ? 'border-t border-gray-800' : 'border-t border-slate-200')}>
                    <div className="mb-4">
                      <h3 className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        Administrative Actions
                      </h3>
                      <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-slate-600')}>
                        Restricted actions requiring a reason and confirmation.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <ActionCard
                        theme={theme}
                        tone="warning"
                        title="Cancel Visit"
                        description="Cancel the visit in an audit-safe way. Reason required."
                        buttonLabel="Cancel with Reason"
                        icon={<XCircle className="h-5 w-5" />}
                        disabled={readOnly || isBusy}
                        onClick={() => setMode('cancel')}
                      />

                      <ActionCard
                        theme={theme}
                        tone="danger"
                        title="Delete Visit"
                        description="Permanently remove the visit. Reason required."
                        buttonLabel="Delete with Reason"
                        icon={<Trash2 className="h-5 w-5" />}
                        disabled={readOnly || isBusy}
                        onClick={() => setMode('delete')}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {mode === 'cancel' && (
                <motion.div
                  key="cancel"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <ActionReasonForm
                    theme={theme}
                    actionType="cancel"
                    onSubmit={handleCancelSubmit}
                    onBack={() => setMode('idle')}
                    isLoading={cancelMutation.isPending}
                  />
                </motion.div>
              )}

              {mode === 'delete' && (
                <motion.div
                  key="delete"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <ActionReasonForm
                    theme={theme}
                    actionType="delete"
                    onSubmit={handleDeleteSubmit}
                    onBack={() => setMode('idle')}
                    isLoading={deleteMutation.isPending}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Help Section */}
      {!compact && mode === 'idle' && (
        <div
          className={cn(
            'rounded-xl border p-4',
            isDark ? 'border-gray-800 bg-gray-950' : 'border-slate-200 bg-white'
          )}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Clock className={cn('h-4 w-4', isDark ? 'text-gray-500' : 'text-slate-400')} />
              <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-slate-600')}>
                Terminal statuses (<span className="font-semibold">Completed</span>,{' '}
                <span className="font-semibold">No Show</span>, <span className="font-semibold">Cancelled</span>)
                will return you to the queue after success.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <AlertCircle className={cn('h-4 w-4', isDark ? 'text-gray-500' : 'text-slate-400')} />
              <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-slate-600')}>
                Cancellation and deletion require a reason for audit purposes.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

VisitStatus.displayName = 'VisitStatus';
export default VisitStatus;