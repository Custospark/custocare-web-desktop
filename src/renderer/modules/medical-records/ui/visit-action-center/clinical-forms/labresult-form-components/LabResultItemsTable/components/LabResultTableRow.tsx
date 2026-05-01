import React, { useEffect, useMemo } from 'react';
import { cn } from '../../../../../../../../shared/utils/classNameUtils';
import { useGetResultsByLabRequestItem } from '../../../../../../api/lab/LabQueries';
import type { LabRequestItem, LabResult } from '../../../../../../api/lab/LabTypes';
import { LabRequestItemStatus } from '../../../../../../api/lab/LabTypes';
import type { ColorTokens } from '../../labResultForm.types';
import {
  formatDisplayDateTime,
  formatLabel,
  getPrimaryFlag,
  getResultFlagClasses,
  summarizeResults,
} from '../../labResultForm.utils';
import { LabResultItemStatusActions } from '../../LabResultItemStatusActions';
import { LabResultStatusIndicator } from './LabResultStatusIndicator';
import { extractResultsFromResponse } from '../utils/labResultTableUtils';

interface LabResultTableRowProps {
  item: LabRequestItem;
  index: number;
  isDark: boolean;
  colors: ColorTokens;
  staffId?: number | null;
  requestLocked: boolean;
  refreshToken: number;
  onEditItemResults: (item: LabRequestItem) => void;
  onResultsHydrated: (itemUuid: string, results: LabResult[]) => void;
  onActionComplete: () => void;
}

const badgeBase = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';

export const LabResultTableRow: React.FC<LabResultTableRowProps> = ({
  item,
  index,
  isDark,
  colors,
  staffId,
  requestLocked,
  refreshToken,
  onEditItemResults,
  onResultsHydrated,
  onActionComplete,
}) => {
  const resultsQuery = useGetResultsByLabRequestItem(item.item_uuid, {
    enabled: !!item.item_uuid,
  });

  const results = useMemo(
    () => extractResultsFromResponse(resultsQuery.data),
    [resultsQuery.data]
  );

  const primaryFlag = useMemo(() => getPrimaryFlag(results), [results]);
  const resultSummary = useMemo(() => summarizeResults(results), [results]);

  useEffect(() => {
    onResultsHydrated(item.item_uuid, results);
  }, [item.item_uuid, onResultsHydrated, results]);

  useEffect(() => {
    if (!refreshToken) return;
    void resultsQuery.refetch();
  }, [refreshToken, resultsQuery]);

  const loading = resultsQuery.isLoading || resultsQuery.isFetching;

  return (
    <tr className={cn('border-b align-top transition-colors', colors.border.primary, isDark ? 'hover:bg-gray-800/40' : 'hover:bg-slate-50')}>
      <td className="px-3 py-4 text-center whitespace-nowrap">
        <span className={cn('text-sm font-semibold', colors.text.secondary)}>{index + 1}</span>
      </td>

      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-start gap-2.5 min-w-[200px]">
          <div className="space-y-1">
            <div className={cn('font-semibold', colors.text.primary)}>
              {item.lab_test?.name || 'Unnamed test'}
            </div>
            <div className={cn('text-xs', colors.text.secondary)}>
              {item.lab_test?.code || 'No code'} • {item.lab_test?.category || 'Uncategorized'}
            </div>
            {item.notes && (
              <div className={cn('text-xs italic', colors.text.tertiary)}>
                Note: {item.notes}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-4 whitespace-nowrap">
        <div className="space-y-2 min-w-[130px]">
          <LabResultStatusIndicator item={item} isDark={isDark} />
          <div className={cn('text-xs', colors.text.secondary)}>
            Sample: {item.sample_type || 'N/A'}
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="min-w-[200px] max-w-[300px]">
          {loading ? (
            <span className={cn('text-xs', colors.text.secondary)}>Loading results...</span>
          ) : (
            <div className="space-y-2">
              <span className={cn(badgeBase, getResultFlagClasses(primaryFlag, isDark))}>
                {formatLabel(primaryFlag)}
              </span>
              <p className={cn('text-xs leading-5 break-words', colors.text.primary)}>
                {resultSummary}
              </p>
              {results.length > 0 && (
                <div className="mt-2 space-y-1">
                  {results.slice(0, 3).map((result, idx) => (
                    <div key={idx} className={cn('text-xs', colors.text.secondary)}>
                      {result.value} {result.unit && `(${result.unit})`}
                      {result.interpretation && ` - ${result.interpretation}`}
                    </div>
                  ))}
                  {results.length > 3 && (
                    <div className={cn('text-xs italic', colors.text.tertiary)}>
                      +{results.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-4 whitespace-nowrap">
        <div className="space-y-1.5 text-xs min-w-[140px]">
          <div className={cn(colors.text.primary)}>
            Results: <strong>{results.length}</strong>
          </div>
          <div className={cn(colors.text.secondary)}>
            Completed: {formatDisplayDateTime(item.completed_at)}
          </div>
          <div className={cn(colors.text.secondary)}>
            Verified: {formatDisplayDateTime(item.verified_at)}
          </div>
        </div>
      </td>

      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex flex-col items-start gap-2 min-w-[180px]">
          <button
            type="button"
            onClick={() => onEditItemResults(item)}
            disabled={item.status === LabRequestItemStatus.CANCELLED || requestLocked}
            className={cn(
              'cursor-pointer inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
              colors.border.primary,
              colors.bg.hover,
              colors.text.primary,
              (item.status === LabRequestItemStatus.CANCELLED || requestLocked) && 'cursor-not-allowed opacity-50'
            )}
          >
            Enter / Edit Results
          </button>

          <LabResultItemStatusActions
            item={item}
            results={results}
            staffId={staffId}
            requestLocked={requestLocked}
            onActionComplete={() => {
              void resultsQuery.refetch();
              onActionComplete();
            }}
          />
        </div>
      </td>
    </tr>
  );
};