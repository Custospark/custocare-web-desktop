import React, { useMemo } from 'react';
import {
  Activity,
  CheckCheck,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  TestTubeDiagonal,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  useMarkSampleCollected,
  useUpdateItemStatus,
  useVerifyItem,
} from '../../../../api/lab/LabQueries';
import {
  LabRequestItemStatus,
  LabResultFlag,
  type LabResult,
} from '../../../../api/lab/LabTypes';
import type { LabResultStatusActionsProps } from './labResultForm.types';

const canCompleteItem = (results: LabResult[]): boolean => {
  // If there are no results, cannot complete
  if (!results.length) return false;

  // Check if there's at least one result with a value (not empty)
  const hasAnyResultWithValue = results.some((result) => {
    const hasValue =
      (result.value && result.value.trim().length > 0) ||
      result.numeric_value !== null;
    return hasValue;
  });

  return hasAnyResultWithValue;
};

// For verification, we need all non-manual results to be non-pending
// Manual results are considered complete immediately
const canVerifyItem = (results: LabResult[]): boolean => {
  if (!results.length) return false;

  // Check if all results have values (not empty)
  const allHaveValues = results.every((result) => {
    const hasValue =
      (result.value && result.value.trim().length > 0) ||
      result.numeric_value !== null;
    return hasValue;
  });

  if (!allHaveValues) return false;

  // For verification, we only care about non-manual results not being pending
  // Manual results (template_field_id === null) can be verified immediately
  const nonManualResults = results.filter((r) => r.template_field_id !== null);
  
  if (nonManualResults.length === 0) {
    // All results are manual, so we can verify
    return true;
  }

  // Check if non-manual results are not pending
  return nonManualResults.every((result) => result.flag !== LabResultFlag.PENDING);
};

export const LabResultItemStatusActions: React.FC<LabResultStatusActionsProps> = ({
  item,
  results,
  staffId,
  requestLocked,
  onActionComplete,
}) => {
  const updateStatus = useUpdateItemStatus();
  const markCollected = useMarkSampleCollected();
  const verifyItem = useVerifyItem();

  const isBusy =
    updateStatus.isPending || markCollected.isPending || verifyItem.isPending;

  const noStaffContext = !staffId;
  const disabled = requestLocked || noStaffContext || isBusy;

  const action = useMemo(() => {
    switch (item.status) {
      case LabRequestItemStatus.PENDING:
        return {
          label: 'Mark Sample as Collected',
          icon: <TestTubeDiagonal className="h-3.5 w-3.5" />,
          className:
            'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50',
          execute: async () => {
            await markCollected.mutateAsync({
              uuid: item.item_uuid,
              collectedByStaffId: staffId as number,
              sampleIdentifier: item.sample_identifier || undefined,
            });
          },
        };
      case LabRequestItemStatus.SAMPLE_COLLECTED:
        return {
          label: 'Start Test Processing',
          icon: <Activity className="h-3.5 w-3.5" />,
          className:
            'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50',
          execute: async () => {
            await updateStatus.mutateAsync({
              uuid: item.item_uuid,
              status: LabRequestItemStatus.IN_PROGRESS,
            });
          },
        };
      case LabRequestItemStatus.IN_PROGRESS:
        return {
          label: 'Mark Test as Completed',
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          className:
            'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50',
          execute: async () => {
            if (!canCompleteItem(results)) return;
            await updateStatus.mutateAsync({
              uuid: item.item_uuid,
              status: LabRequestItemStatus.COMPLETED,
            });
          },
          blocked: !canCompleteItem(results),
          blockedMessage: 'Please enter at least one result value before marking the test as completed',
        };
      case LabRequestItemStatus.COMPLETED:
        return {
          label: 'Verify Test Results',
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          className:
            'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800/40 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-950/50',
          execute: async () => {
            if (!canVerifyItem(results)) return;
            await verifyItem.mutateAsync({
              uuid: item.item_uuid,
              verifiedByStaffId: staffId as number,
            });
          },
          blocked: !canVerifyItem(results),
          blockedMessage: 'Please ensure all result values are entered before verification',
        };
      case LabRequestItemStatus.VERIFIED:
        return {
          label: 'Results Verified',
          icon: <CheckCheck className="h-3.5 w-3.5" />,
          className:
            'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800/40 dark:bg-gray-900/30 dark:text-gray-300',
          execute: async () => undefined,
          terminal: true,
        };
      default:
        return null;
    }
  }, [item.item_uuid, item.sample_identifier, item.status, markCollected, results, staffId, updateStatus, verifyItem]);

  if (!action) return null;

  const hardDisabled =
    disabled || !!action.blocked || !!action.terminal;

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <button
        type="button"
        disabled={hardDisabled}
        onClick={() => {
          void action.execute().then(() => {
            if (!action.terminal && !action.blocked) onActionComplete();
          });
        }}
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
          action.className,
          hardDisabled && 'cursor-not-allowed opacity-60'
        )}
        title={
          noStaffContext
            ? 'Staff information is required for this action'
            : action.blockedMessage
        }
      >
        {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : action.icon}
        {isBusy ? 'Processing...' : action.label}
      </button>

      {action.blockedMessage && action.blocked && (
        <span className="text-[11px] text-amber-600 dark:text-amber-300">
          {action.blockedMessage}
        </span>
      )}

      {noStaffContext && (
        <span className="text-[11px] text-red-600 dark:text-red-300">
          Unable to proceed. Staff information not found.
        </span>
      )}

      {requestLocked && (
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          This request is locked and cannot be modified.
        </span>
      )}
    </div>
  );
};

export default LabResultItemStatusActions;