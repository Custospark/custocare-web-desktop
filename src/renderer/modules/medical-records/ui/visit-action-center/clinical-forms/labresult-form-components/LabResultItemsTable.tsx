// lab-results/labresult-form-components/LabResultItemsTable.tsx
import React, { useEffect, useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Edit3,
  FileSearch,
  FlaskConical,
  ShieldCheck,
  TestTubeDiagonal,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useGetResultsByLabRequestItem } from '../../../../api/lab/LabQueries';
import type { LabRequest, LabRequestItem, LabResult } from '../../../../api/lab/LabTypes';
import { LabRequestItemStatus } from '../../../../api/lab/LabTypes';
import type { ColorTokens } from './labResultForm.types';
import {
  extractResultsArray,
  formatDisplayDateTime,
  formatLabel,
  getItemStatusClasses,
  getPrimaryFlag,
  getResultFlagClasses,
  summarizeResults,
} from './labResultForm.utils';
import { LabResultItemStatusActions } from './LabResultItemStatusActions';

interface LabResultItemsTableProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest;
  staffId?: number | null;
  requestLocked: boolean;
  refreshToken: number;
  onEditItemResults: (item: LabRequestItem) => void;
  onResultsHydrated: (itemUuid: string, results: LabResult[]) => void;
  onActionComplete: () => void;
}

interface RowProps {
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

const StatusIndicator: React.FC<{ item: LabRequestItem; isDark: boolean }> = ({ item, isDark }) => {
  const icon =
    item.status === LabRequestItemStatus.VERIFIED ? (
      <ShieldCheck className="h-3.5 w-3.5" />
    ) : item.status === LabRequestItemStatus.COMPLETED ? (
      <CheckCircle2 className="h-3.5 w-3.5" />
    ) : item.status === LabRequestItemStatus.IN_PROGRESS ? (
      <Activity className="h-3.5 w-3.5" />
    ) : item.status === LabRequestItemStatus.SAMPLE_COLLECTED ? (
      <TestTubeDiagonal className="h-3.5 w-3.5" />
    ) : item.status === LabRequestItemStatus.CANCELLED ? (
      <AlertCircle className="h-3.5 w-3.5" />
    ) : (
      <Clock3 className="h-3.5 w-3.5" />
    );

  return (
    <span className={cn(badgeBase, getItemStatusClasses(item.status, isDark))}>
      {icon}
      {formatLabel(item.status)}
    </span>
  );
};

const LabResultTableRow: React.FC<RowProps> = ({
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
    () => extractResultsArray(resultsQuery.data),
    [resultsQuery.data]
  );

  const primaryFlag = useMemo(
    () => getPrimaryFlag(results),
    [results]
  );

  const resultSummary = useMemo(
    () => summarizeResults(results),
    [results]
  );

  useEffect(() => {
    onResultsHydrated(item.item_uuid, results);
  }, [item.item_uuid, onResultsHydrated, results]);

  useEffect(() => {
    if (!refreshToken) return;
    void resultsQuery.refetch();
  }, [refreshToken, resultsQuery]);

  const loading = resultsQuery.isLoading || resultsQuery.isFetching;

  return (
    <>
      <tr className={cn('border-b align-top transition-colors', colors.border.primary, isDark ? 'hover:bg-gray-800/40' : 'hover:bg-slate-50')}>
        <td className="px-3 py-4 text-center">
          <span className={cn('text-sm font-semibold', colors.text.secondary)}>{index + 1}</span>
        </td>

        <td className="px-4 py-4">
          <div className="flex items-start gap-2.5">
            <FlaskConical className={cn('mt-0.5 h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
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

        <td className="px-4 py-4">
          <div className="space-y-2">
            <StatusIndicator item={item} isDark={isDark} />
            <div className={cn('text-xs', colors.text.secondary)}>
              Sample: {item.sample_type || 'N/A'}
            </div>
          </div>
        </td>

        <td className="px-4 py-4">
          {loading ? (
            <span className={cn('text-xs', colors.text.secondary)}>Loading results...</span>
          ) : (
            <div className="space-y-2">
              <span className={cn(badgeBase, getResultFlagClasses(primaryFlag, isDark))}>
                {formatLabel(primaryFlag)}
              </span>
              <p className={cn('max-w-[300px] text-xs leading-5', colors.text.primary)}>
                {resultSummary}
              </p>
            </div>
          )}
        </td>

        <td className="px-4 py-4">
          <div className="space-y-1.5 text-xs">
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

        <td className="px-4 py-4">
          <div className="flex flex-col items-start gap-2">
            <button
              type="button"
              onClick={() => onEditItemResults(item)}
              disabled={item.status === LabRequestItemStatus.CANCELLED}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                colors.border.primary,
                colors.bg.hover,
                colors.text.primary,
                item.status === LabRequestItemStatus.CANCELLED && 'cursor-not-allowed opacity-50'
              )}
            >
              <Edit3 className="h-3.5 w-3.5" />
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

      <tr className={cn('border-b xl:hidden', colors.border.primary)}>
        <td colSpan={6} className="px-4 py-3">
          <div className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className={cn('font-semibold', colors.text.primary)}>
                  {item.lab_test?.name || 'Unnamed test'}
                </div>
                <div className={cn('text-xs', colors.text.secondary)}>
                  {item.lab_test?.code || 'No code'} • {item.lab_test?.category || 'Uncategorized'}
                </div>
              </div>
              <StatusIndicator item={item} isDark={isDark} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Result Summary
                </p>
                <p className={cn('mt-1 text-sm', colors.text.primary)}>
                  {loading ? 'Loading results...' : resultSummary}
                </p>
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
                <p className={cn('mt-1 text-sm', colors.text.primary)}>
                  {item.sample_type || 'N/A'}
                </p>
              </div>

              <div>
                <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Timeline
                </p>
                <p className={cn('mt-1 text-sm', colors.text.primary)}>
                  Completed: {formatDisplayDateTime(item.completed_at)}
                </p>
                <p className={cn('text-sm', colors.text.secondary)}>
                  Verified: {formatDisplayDateTime(item.verified_at)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onEditItemResults(item)}
                disabled={item.status === LabRequestItemStatus.CANCELLED}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
                  colors.border.primary,
                  colors.bg.hover,
                  colors.text.primary,
                  item.status === LabRequestItemStatus.CANCELLED && 'cursor-not-allowed opacity-50'
                )}
              >
                <Edit3 className="h-3.5 w-3.5" />
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
        </td>
      </tr>
    </>
  );
};

export const LabResultItemsTable: React.FC<LabResultItemsTableProps> = ({
  isDark,
  colors,
  request,
  staffId,
  requestLocked,
  refreshToken,
  onEditItemResults,
  onResultsHydrated,
  onActionComplete,
}) => {
  const items = Array.isArray(request.items) ? request.items : [];
  const pendingCount = items.filter((item) => item.status === LabRequestItemStatus.PENDING).length;
  const inProgressCount = items.filter(
    (item) =>
      item.status === LabRequestItemStatus.SAMPLE_COLLECTED ||
      item.status === LabRequestItemStatus.IN_PROGRESS
  ).length;
  const completedCount = items.filter(
    (item) =>
      item.status === LabRequestItemStatus.COMPLETED ||
      item.status === LabRequestItemStatus.VERIFIED
  ).length;

  return (
    <section className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
      <div className={cn('flex flex-wrap items-start justify-between gap-4 border-b p-5', colors.border.primary)}>
        <div className="space-y-2">
          <div>
            <h2 className={cn('text-base font-semibold', colors.text.primary)}>
              Requested Lab Tests and Results
            </h2>
            <p className={cn('mt-1 text-sm', colors.text.secondary)}>
              Enter, review, verify, and monitor status progression for each requested lab test.
            </p>
          </div>

          <div className={cn('flex flex-wrap gap-4 text-sm', colors.text.secondary)}>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
              <span>{pendingCount} Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>{inProgressCount} Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>{completedCount} Completed / Verified</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium',
            requestLocked
              ? isDark
                ? 'border-amber-800/50 bg-amber-950/30 text-amber-300'
                : 'border-amber-200 bg-amber-50 text-amber-700'
              : isDark
              ? 'border-emerald-800/50 bg-emerald-950/20 text-emerald-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          )}
        >
          {requestLocked ? <AlertCircle className="h-4 w-4" /> : <FileSearch className="h-4 w-4" />}
          {requestLocked
            ? 'Request-level editing restrictions are active'
            : 'Result entry and status actions are available'}
        </div>
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full min-w-[1200px] border-collapse">
          <thead>
            <tr className={cn('border-b', colors.border.primary)}>
              <th className={cn('w-12 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>#</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Test</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Status</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Results</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Timing</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <LabResultTableRow
                key={item.item_uuid}
                item={item}
                index={index}
                isDark={isDark}
                colors={colors}
                staffId={staffId}
                requestLocked={requestLocked}
                refreshToken={refreshToken}
                onEditItemResults={onEditItemResults}
                onResultsHydrated={onResultsHydrated}
                onActionComplete={onActionComplete}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 p-4 xl:hidden">
        {items.map((item, index) => (
          <div key={item.item_uuid}>
            <LabResultTableRow
              item={item}
              index={index}
              isDark={isDark}
              colors={colors}
              staffId={staffId}
              requestLocked={requestLocked}
              refreshToken={refreshToken}
              onEditItemResults={onEditItemResults}
              onResultsHydrated={onResultsHydrated}
              onActionComplete={onActionComplete}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default LabResultItemsTable;
