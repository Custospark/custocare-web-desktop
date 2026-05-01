import React from 'react';
import {
  AlertCircle,
  Ban,
  Clock3,
  Edit3,
  Save,
  ShieldAlert,
  TestTubeDiagonal,
  XCircle,
} from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import { LabRequestItemStatus } from '../../../../../api/lab/LabTypes';
import type { LabRequestItemWithTest, LabRequest } from '../../../../../api/lab/LabTypes';
import type { ColorTokens } from '../labRequestForm.types';
import { LabRequestItemDetailsContent } from './LabRequestItemDetailsContent';
import type { LabRequestItemsTableRow } from './types';
import {
  badgeBase,
  formatTurnaroundTimeWithMinutes,
  getDraftBadgeColor,
  getItemStatusBadgeColor,
  getItemStatusIcon,
  getRowClassName,
} from './utils';

interface LabRequestItemsDesktopTableProps {
  isDark: boolean;
  colors: ColorTokens;
  rows: LabRequestItemsTableRow[];
  canModify: boolean;
  request: LabRequest | null;
  onEditItem: (item: LabRequestItemsTableRow['draftItem']) => void;
  onDeleteItem: (item: LabRequestItemsTableRow['draftItem']) => void;
  onViewResults: (persistedItem: LabRequestItemWithTest) => void;
}

export const LabRequestItemsDesktopTable: React.FC<LabRequestItemsDesktopTableProps> = ({
  isDark,
  colors,
  rows,
  canModify,
  request,
  onEditItem,
  onDeleteItem,
  onViewResults,
}) => {
  const renderActionButtons = (row: LabRequestItemsTableRow) => {
    if (!canModify) return null;

    if (row.isLocked || row.isCancelled) {
      return <span className={cn('text-xs', colors.text.tertiary)}>—</span>;
    }

    return (
      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onEditItem(row.draftItem)}
          className={cn(
            'cursor-pointer rounded-lg border p-1.5 transition-colors',
            colors.border.primary,
            isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
          )}
          title="Edit test details"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDeleteItem(row.draftItem)}
          className={cn(
            'cursor-pointer rounded-lg border p-1.5 transition-colors',
            colors.border.primary,
            isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50'
          )}
          title={request ? 'Cancel this test' : 'Remove this test'}
        >
          <Ban className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[1000px] border-collapse">
        <thead>
          <tr className={cn('border-b', colors.border.primary)}>
            <th className={cn('w-12 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
              #
            </th>
            <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
              Test Name
            </th>
            <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
              Status
            </th>
            <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
              Details
            </th>
            <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
              Requirements
            </th>
            <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
              Turnaround
            </th>
            <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
              Category / Code
            </th>
            {canModify && (
              <th className={cn('px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={getRowClassName(isDark, colors, row.isDraft, row.isCancelled, row.isLocked)}
            >
              <td className="px-3 py-4 text-center">
                <span className={cn('text-sm font-medium', colors.text.secondary)}>
                  {row.index + 1}
                </span>
              </td>

              <td className="px-4 py-4">
                <div className="flex items-start gap-2.5">
                  {row.hasCriticalResults ? (
                    <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-red-400' : 'text-red-600')} />
                  ) : row.hasAbnormalResults ? (
                    <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-amber-400' : 'text-amber-600')} />
                  ) : (
                    <TestTubeDiagonal className={cn('mt-0.5 h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={cn('font-semibold', colors.text.primary)}>
                        {row.displayName}
                      </div>

                      {row.isDraft && (
                        <span className={cn(badgeBase, getDraftBadgeColor(isDark))}>
                          <Save className="mr-1 h-2.5 w-2.5" />
                          Draft
                        </span>
                      )}

                      {row.isCancelled && (
                        <span
                          className={cn(
                            badgeBase,
                            isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                          )}
                        >
                          <XCircle className="mr-1 h-2.5 w-2.5" />
                          Cancelled
                        </span>
                      )}
                    </div>

                    {row.notes && (
                      <div className={cn('mt-1 text-xs italic', colors.text.tertiary)}>
                        Note: {row.notes}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              <td className="px-4 py-4">
                <div className="space-y-2">
                  <span className={cn(badgeBase, getItemStatusBadgeColor(row.status, isDark))}>
                    {getItemStatusIcon(row.status)}
                    <span className="ml-1 capitalize">
                      {row.status.replace(/_/g, ' ')}
                    </span>
                  </span>

                  {!row.isDraft &&
                    !row.isCancelled &&
                    row.status !== LabRequestItemStatus.PENDING && (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-1.5 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${(row.workflowStep / 5) * 100}%` }}
                          />
                        </div>
                        <span className={cn('text-xs', colors.text.tertiary)}>
                          Step {row.workflowStep}/5
                        </span>
                      </div>
                    )}
                </div>
              </td>

              <td className="px-4 py-4">
                <LabRequestItemDetailsContent
                  isDark={isDark}
                  colors={colors}
                  row={row}
                  onViewResults={onViewResults}
                />
              </td>

              <td className="px-4 py-4">
                {row.requiresFasting ? (
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert
                      className={cn(
                        'h-3.5 w-3.5',
                        isDark ? 'text-orange-300' : 'text-orange-600'
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs',
                        isDark ? 'text-orange-300' : 'text-orange-700'
                      )}
                    >
                      Fasting required
                    </span>
                  </div>
                ) : (
                  <span className={cn('text-xs', colors.text.tertiary)}>No fasting</span>
                )}
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <Clock3
                    className={cn(
                      'h-3.5 w-3.5',
                      isDark ? 'text-green-300' : 'text-green-600'
                    )}
                  />
                  <span className={cn('text-sm', colors.text.primary)}>
                    {formatTurnaroundTimeWithMinutes(row.turnaroundTimeHours)}
                  </span>
                </div>
              </td>

              <td className="px-4 py-4">
                <div className="space-y-0.5">
                  {row.category && (
                    <div className={cn('text-sm', colors.text.primary)}>
                      {row.category}
                    </div>
                  )}
                  {row.code && (
                    <div className={cn('text-xs font-mono', colors.text.secondary)}>
                      {row.code}
                    </div>
                  )}
                  {!row.category && !row.code && (
                    <span className={cn('text-xs', colors.text.tertiary)}>—</span>
                  )}
                </div>
              </td>

              {canModify && (
                <td className="px-4 py-4 text-center">{renderActionButtons(row)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
