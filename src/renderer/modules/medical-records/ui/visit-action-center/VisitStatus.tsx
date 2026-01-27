/**
 * ============================================================================
 * VISIT STATUS COMPONENT
 * ============================================================================
 * 
 * A production-ready component for managing visit status and cancellations.
 * Features:
 * - Update visit status (no phase management)
 * - Cancel visit with required reason
 * - Delete visit with required reason
 * - Real-time backend integration
 * - Clears visit slice on cancellation/deletion
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  XCircle, 
  Trash2, 
  Play, 
  UserX, 
  Activity, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';

// Hooks and utilities
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { cn } from '../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

// Redux selectors and actions
import { 
  selectActiveVisitUuid,
  selectActivePatient,
  selectActiveVisitInfo,
  selectActiveVisitStatus,
  emergencyClearVisit 
} from '../../../../app/store/slices/visitSlice';

// API hooks
import { 
  useUpdateVisitStatus, 
  useCancelVisit, 
  useDeleteVisit, 
  useGetVisitByUUID,
  getStatusColor,
} from '../../../pharmacy/api/dispensing/visit-queue/useVisitQueries';

// Types - using the single source of truth
import { 
  VisitStatus,
  type VisitResponse, 
  type ApiErrorResponse,
} from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';

import type { AxiosError } from 'axios';

/* -------------------------------------------------------------------------- */
/* TYPE DEFINITIONS */
/* -------------------------------------------------------------------------- */

interface VisitStatusProps {
  theme: 'light' | 'dark';
  className?: string;
  onActionComplete?: () => void | Promise<void>;
  readOnly?: boolean;
  compact?: boolean;
  // Optional: if not using active visit from Redux
  visitUuid?: string;
}

interface StatusOption {
  value: VisitStatus;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface ActionReasonOption {
  value: string;
  label: string;
  description: string;
  requiresDetails?: boolean;
}

interface DeleteVisitParams {
  uuid: string;
  data: {
    deletion_reason: string;
  };
}

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS */
/* -------------------------------------------------------------------------- */

/**
 * Status selector component
 */
interface StatusSelectorProps {
  theme: 'light' | 'dark';
  currentStatus: VisitStatus;
  availableStatuses: StatusOption[];
  onStatusChange: (status: VisitStatus) => void;
  isLoading?: boolean;
  readOnly?: boolean;
}

const StatusSelector: React.FC<StatusSelectorProps> = React.memo(({
  theme,
  currentStatus,
  availableStatuses,
  onStatusChange,
  isLoading = false,
  readOnly = false
}) => {
  const isDark = theme === 'dark';
  
  const colors = useMemo(() => ({
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    hoverBg: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
  }), [isDark]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={cn('text-sm font-medium', colors.text)}>
          Visit Status
        </label>
        {currentStatus && (
          <span className={cn(
            'text-xs px-2 py-1 rounded-full font-medium',
            getStatusColor(currentStatus)
          )}>
            {availableStatuses.find(s => s.value === currentStatus)?.label}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {availableStatuses.map((status) => (
          <button
            key={status.value}
            type="button"
            onClick={() => !readOnly && !isLoading && onStatusChange(status.value)}
            disabled={readOnly || isLoading}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
              currentStatus === status.value 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : colors.border,
              colors.bg,
              !readOnly && colors.hoverBg,
              (readOnly || isLoading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {status.icon}
            <div className="flex-1 text-left">
              <div className={cn('text-sm font-medium', colors.text)}>
                {status.label}
              </div>
              <div className={cn('text-xs', colors.textSecondary)}>
                {status.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

StatusSelector.displayName = 'StatusSelector';

/**
 * Action Reason Form - Used for both cancellation and deletion
 */
interface ActionReasonFormProps {
  theme: 'light' | 'dark';
  actionType: 'cancel' | 'delete';
  onSubmit: (reason: string, details?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ActionReasonForm: React.FC<ActionReasonFormProps> = React.memo(({
  theme,
  actionType,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const isDark = theme === 'dark';
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [customReason, setCustomReason] = useState('');

  const colors = useMemo(() => ({
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    danger: isDark ? 'text-red-400' : 'text-red-600',
    dangerBg: isDark ? 'bg-red-900/20' : 'bg-red-50',
    warning: isDark ? 'text-yellow-400' : 'text-yellow-600',
    warningBg: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
    hoverBg: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
  }), [isDark]);

  const isCancel = actionType === 'cancel';
  const actionTitle = isCancel ? 'Cancel Visit' : 'Delete Visit';
  const actionVerb = isCancel ? 'cancel' : 'delete';
  const actionColor = isCancel ? colors.warning : colors.danger;

  const reasonOptions: ActionReasonOption[] = useMemo(() => [
    {
      value: 'patient_requested',
      label: 'Patient Requested',
      description: `Patient asked to ${actionVerb} the visit`
    },
    {
      value: 'duplicate_visit',
      label: 'Duplicate Visit',
      description: `Visit was created in error (duplicate)`
    },
    {
      value: 'no_show',
      label: 'No Show',
      description: `Patient did not arrive for scheduled visit`
    },
    {
      value: 'wrong_information',
      label: 'Wrong Information',
      description: `Visit created with incorrect patient/facility info`
    },
    {
      value: 'system_error',
      label: 'System Error',
      description: `Visit created due to technical error`,
      requiresDetails: true
    },
    {
      value: 'other',
      label: 'Other Reason',
      description: `Specify reason below`,
      requiresDetails: true
    }
  ], [actionVerb]);

  const selectedReasonOption = useMemo(() => 
    reasonOptions.find(reason => reason.value === selectedReason),
    [selectedReason, reasonOptions]
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    let finalReason = selectedReason === 'other' 
      ? customReason 
      : selectedReasonOption?.label || '';

    if (selectedReasonOption?.requiresDetails && details) {
      finalReason += `: ${details}`;
    }

    if (finalReason.trim()) {
      onSubmit(finalReason, details);
    }
  }, [selectedReason, selectedReasonOption, customReason, details, onSubmit]);

  const isValid = useMemo(() => {
    if (!selectedReason) return false;
    if (selectedReason === 'other' && !customReason.trim()) return false;
    if (selectedReasonOption?.requiresDetails && !details.trim()) return false;
    return true;
  }, [selectedReason, customReason, details, selectedReasonOption]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', actionColor)} />
        <div>
          <h3 className={cn('font-semibold mb-1', colors.text)}>
            {actionTitle}
          </h3>
          <p className={cn('text-sm', colors.textSecondary)}>
            {isCancel 
              ? 'Cancelling a visit will mark it as cancelled but keep it in the system for audit purposes.'
              : 'This action cannot be undone. The visit will be permanently removed from the system.'}
          </p>
          <p className={cn('text-sm mt-2', colors.textSecondary)}>
            Please provide a reason for this action.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className={cn('text-sm font-medium block', colors.text)}>
          Select Reason *
        </label>
        
        {reasonOptions.map((reason) => (
          <button
            key={reason.value}
            type="button"
            onClick={() => setSelectedReason(reason.value)}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-colors cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
              selectedReason === reason.value 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : colors.border,
              colors.bg,
              colors.hoverBg
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {selectedReason === reason.value && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-medium', colors.text)}>
                  {reason.label}
                </div>
                <div className={cn('text-xs mt-0.5', colors.textSecondary)}>
                  {reason.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedReason === 'other' && (
        <div className="space-y-2">
          <label className={cn('text-sm font-medium block', colors.text)}>
            Specify Reason *
          </label>
          <input
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder={`Enter the reason to ${actionVerb} this visit...`}
            className={cn(
              'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text',
              colors.bg,
              colors.border,
              colors.text
            )}
            required
          />
        </div>
      )}

      {selectedReasonOption?.requiresDetails && (
        <div className="space-y-2">
          <label className={cn('text-sm font-medium block', colors.text)}>
            Additional Details *
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Provide additional details..."
            rows={3}
            className={cn(
              'w-full px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-text',
              colors.bg,
              colors.border,
              colors.text
            )}
            required
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={cn(
            'flex-1 py-2 rounded-lg font-medium transition-colors cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
            isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
            isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={cn(
            'flex-1 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
            isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
            isValid && !isLoading
              ? isCancel
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm hover:shadow'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
            isLoading && 'opacity-70 cursor-wait'
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {isCancel ? 'Cancelling...' : 'Deleting...'}
            </span>
          ) : (
            actionTitle
          )}
        </button>
      </div>
    </form>
  );
});

ActionReasonForm.displayName = 'ActionReasonForm';

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT IMPLEMENTATION */
/* -------------------------------------------------------------------------- */

const VisitStatusComponent: React.FC<VisitStatusProps> = ({
  theme,
  className,
  onActionComplete,
  readOnly = false,
  compact = false,
  visitUuid: propVisitUuid,
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const dispatch = useDispatch();

  // Redux selectors for visit data
  const reduxVisitUuid = useSelector(selectActiveVisitUuid);
  const activePatient = useSelector(selectActivePatient);
  const visitInfo = useSelector(selectActiveVisitInfo);
  const currentStatus = useSelector(selectActiveVisitStatus);

  // Use prop visitUuid if provided, otherwise use Redux
  const visitUuid = propVisitUuid || reduxVisitUuid;

  // Local state
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch visit data from backend
  const {
    data: visitData,
    isLoading: isLoadingVisit,
    error: visitError,
    refetch: refetchVisit
  } = useGetVisitByUUID(visitUuid || '', {
    enabled: !!visitUuid,
    staleTime: 10000,
  });
  console.log(visitData,visitError)

  // Available statuses using the imported VisitStatus enum
  const availableStatuses = useMemo<StatusOption[]>(() => [
    {
      value: VisitStatus.ACTIVE,
      label: 'Active',
      icon: <Play className="w-4 h-4" />,
      description: 'Visit is currently active',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      value: VisitStatus.IN_PROGRESS,
      label: 'In Progress',
      icon: <Activity className="w-4 h-4" />,
      description: 'Visit is in progress',
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      value: VisitStatus.COMPLETED,
      label: 'Completed',
      icon: <CheckCircle className="w-4 h-4" />,
      description: 'Visit has been completed',
      color: 'bg-green-100 text-green-800'
    },
    {
      value: VisitStatus.CANCELLED,
      label: 'Cancelled',
      icon: <XCircle className="w-4 h-4" />,
      description: 'Visit has been cancelled',
      color: 'bg-red-100 text-red-800'
    },
    {
      value: VisitStatus.NO_SHOW,
      label: 'No Show',
      icon: <UserX className="w-4 h-4" />,
      description: 'Patient did not show up',
      color: 'bg-gray-100 text-gray-800'
    }
  ], []);

  // API mutations
  const updateStatusMutation = useUpdateVisitStatus({
    onSuccess: (data: VisitResponse) => {
      const newStatus = data.data.status;
      setActionInProgress(null);
      setError(null);
      showToast('success', `Visit status updated to ${newStatus}`, 3000);
      refetchVisit();
      onActionComplete?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      setActionInProgress(null);
      let errorMessage = 'Failed to update visit status';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      showToast('error', errorMessage, 5000);
    }
  });

  const cancelVisitMutation = useCancelVisit({
    onSuccess: () => {
      setActionInProgress(null);
      setError(null);
      setShowCancelForm(false);
      
      // Clear the visit slice since visit is cancelled
      dispatch(emergencyClearVisit());
      
      showToast('success', 'Visit cancelled successfully', 3000);
      onActionComplete?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      setActionInProgress(null);
      let errorMessage = 'Failed to cancel visit';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      showToast('error', errorMessage, 5000);
    }
  });

  const deleteVisitMutation = useDeleteVisit({
    onSuccess: () => {
      setActionInProgress(null);
      setError(null);
      setShowDeleteForm(false);
      
      // Clear the visit slice since visit is deleted
      dispatch(emergencyClearVisit());
      
      showToast('success', 'Visit deleted successfully', 3000);
      onActionComplete?.();
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      setActionInProgress(null);
      let errorMessage = 'Failed to delete visit';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      showToast('error', errorMessage, 5000);
    }
  });

  // Event handlers
  const handleStatusChange = useCallback(async (newStatus: VisitStatus) => {
    if (!visitUuid || readOnly) return;

    const ok = await confirm({
      title: 'Change Visit Status',
      message: `Are you sure you want to change the visit status to ${newStatus}?`,
      confirmText: 'Yes, Change Status',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (!ok) return;

    setActionInProgress('status');
    try {
      await updateStatusMutation.mutateAsync({
        uuid: visitUuid,
        data: { status: newStatus }
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }, [visitUuid, readOnly, confirm, theme, updateStatusMutation]);

  const handleCancelSubmit = useCallback(async (reason: string, details?: string) => {
    if (!visitUuid) return;

    const fullReason = details ? `${reason} - ${details}` : reason;

    const ok = await confirm({
      title: 'Cancel Visit',
      message: `Are you sure you want to cancel this visit?\n\nReason: ${fullReason}`,
      confirmText: 'Yes, Cancel Visit',
      cancelText: 'No, Keep Visit',
      variant: 'warning',
      theme,
    });

    if (!ok) return;

    setActionInProgress('cancel');
    try {
      await cancelVisitMutation.mutateAsync({
        uuid: visitUuid,
        data: { cancellation_reason: fullReason }
      });
    } catch (error) {
      console.error('Failed to cancel visit:', error);
    }
  }, [visitUuid, confirm, theme, cancelVisitMutation]);

  const handleDeleteSubmit = useCallback(async (reason: string, details?: string) => {
    if (!visitUuid) return;

    const fullReason = details ? `${reason} - ${details}` : reason;

    const ok = await confirm({
      title: 'Delete Visit',
      message: `Are you sure you want to permanently delete this visit? This action cannot be undone.\n\nReason: ${fullReason}`,
      confirmText: 'Yes, Delete Visit',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });

    if (!ok) return;

    setActionInProgress('delete');
    try {
      // Cast to the expected params type with deletion_reason
      const params: DeleteVisitParams = {
        uuid: visitUuid,
        data: { deletion_reason: fullReason }
      };
      await deleteVisitMutation.mutateAsync(params);
    } catch (error) {
      console.error('Failed to delete visit:', error);
    }
  }, [visitUuid, confirm, theme, deleteVisitMutation]);

  const handleCancelAction = useCallback(() => {
    setShowCancelForm(false);
    setShowDeleteForm(false);
  }, []);

  const colors = useMemo(() => ({
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    border: isDark ? 'border-gray-800' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500'
    },
    accent: {
      bg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      text: isDark ? 'text-blue-300' : 'text-blue-600',
      border: isDark ? 'border-blue-800' : 'border-blue-200'
    },
    warning: {
      bg: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50',
      text: isDark ? 'text-yellow-300' : 'text-yellow-600',
      border: isDark ? 'border-yellow-800' : 'border-yellow-200'
    },
    danger: {
      bg: isDark ? 'bg-red-900/20' : 'bg-red-50',
      text: isDark ? 'text-red-300' : 'text-red-600',
      border: isDark ? 'border-red-800' : 'border-red-200'
    }
  }), [isDark]);

  const isLoading = isLoadingVisit || 
                    updateStatusMutation.isPending || 
                    cancelVisitMutation.isPending || 
                    deleteVisitMutation.isPending;

  // No active visit
  if (!visitUuid) {
    return (
      <div className={cn('rounded-xl border p-8 text-center', colors.bg, colors.border)}>
        <Activity className={cn('w-16 h-16 mx-auto mb-4', colors.text.secondary)} />
        <h3 className={cn('text-xl font-bold mb-2', colors.text.primary)}>
          No Active Visit Selected
        </h3>
        <p className={cn('max-w-md mx-auto mb-6', colors.text.secondary)}>
          Please select a patient visit from the queue to manage visit status.
        </p>
        <div className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-default',
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        )}>
          <Activity className={cn('w-4 h-4', colors.text.secondary)} />
          <span className={colors.text.secondary}>Select a visit to begin</span>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingVisit) {
    return (
      <div className={className}>
        <LoadingSkeleton 
          variant="detail" 
          theme={theme} 
          message="Loading visit status..." 
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Card */}
      <div className={cn('rounded-xl border', colors.bg, colors.border, 'shadow-sm')}>
        <div className="p-6 border-b" style={{ borderColor: colors.border.replace('border-', '') }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2.5 rounded-xl', colors.accent.bg)}>
                <Activity className={cn('w-6 h-6', colors.accent.text)} />
              </div>
              <div>
                <h2 className={cn('text-xl font-bold', colors.text.primary)}>
                  Visit Status Management
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className={cn('text-sm', colors.text.secondary)}>
                    {activePatient?.name || visitInfo?.patientName || 'Patient Name Not Available'}
                  </p>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded cursor-default',
                    isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                  )}>
                    {visitInfo?.patientNumber || 'N/A'}
                  </span>
                  {currentStatus && (
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      getStatusColor(currentStatus)
                    )}>
                      {availableStatuses.find(s => s.value === currentStatus)?.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className={cn(
              'rounded-lg border p-4 flex gap-3 items-start animate-in fade-in',
              colors.danger.bg,
              colors.danger.border
            )}>
              <AlertCircle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', colors.danger.text)} />
              <div className="flex-1">
                <p className={cn('text-sm font-medium mb-1', colors.danger.text)}>
                  Action Failed
                </p>
                <p className={cn('text-sm', colors.danger.text)}>
                  {error}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className={cn(
                  'p-1 rounded-lg transition-colors cursor-pointer',
                  isDark ? 'hover:bg-red-800/30 text-red-400' : 'hover:bg-red-100 text-red-600'
                )}
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Global Loading State */}
          {isLoading && actionInProgress && (
            <div className={cn(
              'rounded-lg border p-4 flex items-center gap-3',
              colors.accent.bg,
              colors.accent.border
            )}>
              <Loader2 className={cn('w-5 h-5 animate-spin', colors.accent.text)} />
              <div>
                <p className={cn('text-sm font-medium', colors.accent.text)}>
                  {actionInProgress === 'status' && 'Updating visit status...'}
                  {actionInProgress === 'cancel' && 'Cancelling visit...'}
                  {actionInProgress === 'delete' && 'Deleting visit...'}
                </p>
                <p className={cn('text-xs mt-1', colors.accent.text)}>
                  Please wait while we process your request
                </p>
              </div>
            </div>
          )}

          {/* Status Management */}
          {currentStatus && (
            <div className="space-y-4">
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                Update Status
              </h3>
              <StatusSelector
                theme={theme}
                currentStatus={currentStatus}
                availableStatuses={availableStatuses}
                onStatusChange={handleStatusChange}
                isLoading={updateStatusMutation.isPending}
                readOnly={readOnly}
              />
              <p className={cn('text-sm', colors.text.secondary)}>
                Update the overall status of the visit.
              </p>
            </div>
          )}

          {/* Cancel Visit Section */}
          {!showCancelForm && !showDeleteForm && (
            <div className="space-y-4 pt-4 border-t" style={{ borderColor: colors.border.replace('border-', '') }}>
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                Visit Actions
              </h3>

              {/* Cancel Visit Button */}
              <div className={cn(
                'p-4 rounded-lg border',
                colors.warning.bg,
                colors.warning.border
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <XCircle className={cn('w-5 h-5', colors.warning.text)} />
                  <h3 className={cn('font-semibold', colors.warning.text)}>
                    Cancel Visit
                  </h3>
                </div>
                <p className={cn('text-sm mb-4', colors.text.secondary)}>
                  Mark this visit as cancelled. The visit will remain in the system for audit purposes.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCancelForm(true)}
                  disabled={readOnly || isLoading}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1',
                    isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
                    isDark 
                      ? 'bg-yellow-900/30 hover:bg-yellow-900/40 text-yellow-300 border-yellow-800'
                      : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border-yellow-200',
                    (readOnly || isLoading) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="font-medium">Cancel Visit</span>
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>

              {/* Delete Visit Section */}
              <div className={cn(
                'p-4 rounded-lg border',
                colors.danger.bg,
                colors.danger.border
              )}>
                <div className="flex items-center gap-3 mb-3">
                  <Trash2 className={cn('w-5 h-5', colors.danger.text)} />
                  <h3 className={cn('font-semibold', colors.danger.text)}>
                    Delete Visit
                  </h3>
                </div>
                <p className={cn('text-sm mb-4', colors.text.secondary)}>
                  Permanently delete this visit from the system. This action cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteForm(true)}
                  disabled={readOnly || isLoading}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1',
                    isDark ? 'focus:ring-offset-gray-900' : 'focus:ring-offset-white',
                    isDark 
                      ? 'bg-red-900/30 hover:bg-red-900/40 text-red-300 border-red-800'
                      : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200',
                    (readOnly || isLoading) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="font-medium">Delete Visit</span>
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Cancel Visit Form */}
          {showCancelForm && (
            <div className={cn(
              'p-4 rounded-lg border animate-in slide-in-from-bottom-4',
              colors.warning.bg,
              colors.warning.border
            )}>
              <ActionReasonForm
                theme={theme}
                actionType="cancel"
                onSubmit={handleCancelSubmit}
                onCancel={handleCancelAction}
                isLoading={cancelVisitMutation.isPending}
              />
            </div>
          )}

          {/* Delete Visit Form */}
          {showDeleteForm && (
            <div className={cn(
              'p-4 rounded-lg border animate-in slide-in-from-bottom-4',
              colors.danger.bg,
              colors.danger.border
            )}>
              <ActionReasonForm
                theme={theme}
                actionType="delete"
                onSubmit={handleDeleteSubmit}
                onCancel={handleCancelAction}
                isLoading={deleteVisitMutation.isPending}
              />
            </div>
          )}
        </div>
      </div>

      {/* Success State Indicators */}
      {updateStatusMutation.isSuccess && !updateStatusMutation.isPending && (
        <div className={cn(
          'rounded-lg border p-4 flex items-center gap-3 animate-in fade-in',
          colors.accent.bg,
          colors.accent.border
        )}>
          <CheckCircle className={cn('w-5 h-5', colors.accent.text)} />
          <div className="flex-1">
            <p className={cn('text-sm font-medium', colors.accent.text)}>
              Status updated successfully
            </p>
            <p className={cn('text-xs mt-1', colors.accent.text)}>
              Visit status has been updated in the system.
            </p>
          </div>
        </div>
      )}

      {/* Additional Information (Optional) */}
      {!compact && !readOnly && (
        <div className={cn('rounded-xl border p-5', colors.bg, colors.border)}>
          <h4 className={cn('font-semibold mb-3 flex items-center gap-2 cursor-default', colors.text.primary)}>
            <AlertCircle className="w-4 h-4" />
            Action Guidelines
          </h4>
          <ul className={cn('space-y-2 text-sm cursor-default', colors.text.secondary)}>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <span>Status updates reflect the overall state of the visit</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0" />
              <span>Cancelling a visit keeps it in the system with audit trail</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <span>Deleting a visit is permanent and requires a documented reason</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
              <span>All actions are logged for audit purposes</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

VisitStatusComponent.displayName = 'VisitStatus';

export default VisitStatusComponent;