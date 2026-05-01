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
  if (!results.length) return false;

  const hasAnyResultWithValue = results.some((result) => {
    const hasValue =
      (result.value && result.value.trim().length > 0) ||
      result.numeric_value !== null;
    return hasValue;
  });

  return hasAnyResultWithValue;
};

const canVerifyItem = (results: LabResult[]): boolean => {
  if (!results.length) return false;

  const allHaveValues = results.every((result) => {
    const hasValue =
      (result.value && result.value.trim().length > 0) ||
      result.numeric_value !== null;
    return hasValue;
  });

  if (!allHaveValues) return false;

  const nonManualResults = results.filter((r) => r.template_field_id !== null);
  
  if (nonManualResults.length === 0) {
    return true;
  }

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

  const isBusy = updateStatus.isPending || markCollected.isPending || verifyItem.isPending;
  const noStaffContext = !staffId;
  const disabled = requestLocked || noStaffContext || isBusy;

  const action = useMemo(() => {
    switch (item.status) {
      case LabRequestItemStatus.PENDING:
        return {
          label: 'Mark Sample as Collected',
          icon: <TestTubeDiagonal className="h-3.5 w-3.5" />,
          activeClassName: 'border-blue-500 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer',
          disabledClassName: 'border-blue-200 bg-blue-100 text-blue-400 cursor-not-allowed opacity-60',
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
          activeClassName: 'border-amber-500 bg-amber-600 text-white hover:bg-amber-700 cursor-pointer',
          disabledClassName: 'border-amber-200 bg-amber-100 text-amber-400 cursor-not-allowed opacity-60',
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
          activeClassName: 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer',
          disabledClassName: 'border-emerald-200 bg-emerald-100 text-emerald-400 cursor-not-allowed opacity-60',
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
          label: 'Mark Results as Verified.',
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          activeClassName: 'border-purple-500 bg-purple-600 text-white hover:bg-purple-700 cursor-pointer',
          disabledClassName: 'border-purple-200 bg-purple-100 text-purple-400 cursor-not-allowed opacity-60',
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
          activeClassName: 'border-gray-400 bg-gray-500 text-white cursor-default',
          disabledClassName: 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60',
          execute: async () => undefined,
          terminal: true,
        };
      default:
        return null;
    }
  }, [item.item_uuid, item.sample_identifier, item.status, markCollected, results, staffId, updateStatus, verifyItem]);

  if (!action) return null;

  const hardDisabled = disabled || !!action.blocked || !!action.terminal;
  const isActionBlocked = !!action.blocked && !action.terminal;

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
          hardDisabled || isActionBlocked ? action.disabledClassName : action.activeClassName
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