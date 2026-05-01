import React from 'react';
import { Ban, Clock3, Edit3, ShieldAlert } from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { LabRequestItemWithTest } from '../../../../../api/lab/LabTypes';
import type { ColorTokens } from '../labRequestForm.types';
import { LabRequestItemDetailsContent } from './LabRequestItemDetailsContent';
import type { LabRequestItemsTableRow } from './types';
import {
  badgeBase,
  formatTurnaroundTimeWithMinutes,
  getItemStatusBadgeColor,
  getItemStatusIcon,
} from './utils';

interface LabRequestItemsMobileCardsProps {
  isDark: boolean;
  colors: ColorTokens;
  rows: LabRequestItemsTableRow[];
  canModify: boolean;
  onEditItem: (item: LabRequestItemsTableRow['draftItem']) => void;
  onDeleteItem: (item: LabRequestItemsTableRow['draftItem']) => void;
  onViewResults: (persistedItem: LabRequestItemWithTest) => void;
}

export const LabRequestItemsMobileCards: React.FC<LabRequestItemsMobileCardsProps> = ({
  isDark,
  colors,
  rows,
  canModify,
  onEditItem,
  onDeleteItem,
  onViewResults,
}) => {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <div
          key={row.key}
          className={cn(
            'rounded-xl border p-4',
            colors.border.primary,
            colors.bg.subtle,
            row.isDraft && (isDark ? 'bg-purple-900/10' : 'bg-purple-50/50'),
            row.isCancelled && (isDark ? 'bg-red-900/5' : 'bg-red-50/30'),
            row.isLocked && (isDark ? 'bg-gray-800/30' : 'bg-gray-50/50')
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-medium', colors.text.secondary)}>
                #{row.index + 1}
              </span>
              <div className={cn('font-semibold', colors.text.primary)}>
                {row.displayName}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={cn(badgeBase, getItemStatusBadgeColor(row.status, isDark))}>
                {getItemStatusIcon(row.status)}
                <span className="ml-1 capitalize">
                  {row.status.replace(/_/g, ' ')}
                </span>
              </span>

              {canModify && !row.isLocked && !row.isCancelled && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditItem(row.draftItem)}
                    className={cn(
                      'cursor-pointer rounded-lg border p-1.5 transition-colors',
                      colors.border.primary,
                      isDark
                        ? 'text-slate-200 hover:bg-slate-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(row.draftItem)}
                    className={cn(
                      'cursor-pointer rounded-lg border p-1.5 transition-colors',
                      colors.border.primary,
                      isDark
                        ? 'text-red-300 hover:bg-red-950/40'
                        : 'text-red-700 hover:bg-red-50'
                    )}
                  >
                    <Ban className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="space-y-0.5">
              <div className={cn('text-xs font-medium', colors.text.secondary)}>Category</div>
              <div className={cn('text-sm', colors.text.primary)}>{row.category || '—'}</div>
            </div>

            <div className="space-y-0.5">
              <div className={cn('text-xs font-medium', colors.text.secondary)}>Code</div>
              <div className={cn('text-sm font-mono', colors.text.primary)}>{row.code || '—'}</div>
            </div>

            <div className="space-y-0.5">
              <div className={cn('text-xs font-medium', colors.text.secondary)}>Details</div>
              <div>
                <LabRequestItemDetailsContent
                  isDark={isDark}
                  colors={colors}
                  row={row}
                  onViewResults={onViewResults}
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <div className={cn('text-xs font-medium', colors.text.secondary)}>Turnaround</div>
              <div className="flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                <span className={cn('text-sm', colors.text.primary)}>
                  {formatTurnaroundTimeWithMinutes(row.turnaroundTimeHours)}
                </span>
              </div>
            </div>

            <div className="col-span-2 space-y-0.5">
              <div className={cn('text-xs font-medium', colors.text.secondary)}>Fasting</div>
              <div>
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
                      Required
                    </span>
                  </div>
                ) : (
                  <span className={cn('text-xs', colors.text.tertiary)}>Not required</span>
                )}
              </div>
            </div>

            {row.notes && (
              <div className="col-span-2 space-y-0.5">
                <div className={cn('text-xs font-medium', colors.text.secondary)}>Notes</div>
                <div className={cn('text-sm', colors.text.primary)}>{row.notes}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
