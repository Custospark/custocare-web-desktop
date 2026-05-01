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

interface LabResultMobileCardProps {
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

export const LabResultMobileCard: React.FC<LabResultMobileCardProps> = ({
  item,
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
    <div className={cn('rounded-xl border m-4 p-4', colors.border.primary, colors.bg.subtle)}>
      <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className={cn('font-semibold break-words', colors.text.primary)}>
            {item.lab_test?.name || 'Unnamed test'}
          </div>
          <div className={cn('text-xs break-words', colors.text.secondary)}>
            {item.lab_test?.code || 'No code'} • {item.lab_test?.category || 'Uncategorized'}
          </div>
        </div>
        <LabResultStatusIndicator item={item} isDark={isDark} />
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
              Result Summary
            </p>
            <p className={cn('mt-1 text-sm break-words', colors.text.primary)}>
              {loading ? 'Loading results...' : resultSummary || 'No results yet'}
            </p>
            {!loading && results.length > 0 && (
              <div className="mt-2 space-y-1">
                {results.slice(0, 3).map((result, idx) => (
                  <div key={idx} className={cn('text-xs', colors.text.secondary)}>
                    {result.value} {result.unit && `(${result.unit})`}
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

          <div>
            <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
              Primary Flag
            </p>
            <div className="mt-1">
              <span className={cn(badgeBase, getResultFlagClasses(primaryFlag, isDark))}>
                {formatLabel(primaryFlag)}
              </span>
            </div>
          </div>

          <div>
            <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
              Sample Type
            </p>
            <p className={cn('mt-1 text-sm break-words', colors.text.primary)}>
              {item.sample_type || 'N/A'}
            </p>
          </div>

          <div>
            <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
              Results Count
            </p>
            <p className={cn('mt-1 text-sm', colors.text.primary)}>
              <strong>{results.length}</strong> total results
            </p>
          </div>

          <div>
            <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
              Completed At
            </p>
            <p className={cn('mt-1 text-sm break-words', colors.text.primary)}>
              {formatDisplayDateTime(item.completed_at) || 'Not completed'}
            </p>
          </div>

          <div>
            <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
              Verified At
            </p>
            <p className={cn('mt-1 text-sm break-words', colors.text.primary)}>
              {formatDisplayDateTime(item.verified_at) || 'Not verified'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={() => onEditItemResults(item)}
            disabled={item.status === LabRequestItemStatus.CANCELLED || requestLocked}
            className={cn(
              'cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
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
      </div>
    </div>
  );
};