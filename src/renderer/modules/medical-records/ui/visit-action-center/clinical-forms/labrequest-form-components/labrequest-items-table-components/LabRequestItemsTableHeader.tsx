import React from 'react';
import {
  Calendar,
  CheckCircle2,
  PackageSearch,
  Plus,
  ShieldAlert,
  Syringe,
  User,
} from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../../api/lab/LabTypes';
import type { ColorTokens } from '../labRequestForm.types';
import { formatDate } from '../labRequestForm.types';
import type { LabRequestItemsTableStats } from './types';

interface LabRequestItemsTableHeaderProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest | null;
  requestedByName: string | null;
  stats: LabRequestItemsTableStats;
  isReadOnly: boolean;
  canModify: boolean;
  onAddItem: () => void;
  onManageLabItems: () => void;
}

export const LabRequestItemsTableHeader: React.FC<LabRequestItemsTableHeaderProps> = ({
  isDark,
  colors,
  request,
  requestedByName,
  stats,
  isReadOnly,
  canModify,
  onAddItem,
  onManageLabItems,
}) => {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 border-b p-5',
        colors.border.primary
      )}
    >
      <div className="space-y-2">
        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>
            Lab Request Tests
          </h3>

          {requestedByName && (
            <div className={cn('mt-1 flex items-center gap-1.5 text-xs', colors.text.secondary)}>
              <User className="h-3 w-3" />
              <span>Ordered by: {requestedByName}</span>
            </div>
          )}
        </div>

        {request && (
          <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs', colors.text.tertiary)}>
            {request.requested_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>Requested: {formatDate(request.requested_at)}</span>
              </div>
            )}

            {request.collected_at && (
              <div className="flex items-center gap-1.5">
                <Syringe className="h-3 w-3" />
                <span>Collected: {formatDate(request.collected_at)}</span>
              </div>
            )}

            {request.completed_at && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                <span>Completed: {formatDate(request.completed_at)}</span>
              </div>
            )}

            {request.reviewed_at && (
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3" />
                <span>Reviewed: {formatDate(request.reviewed_at)}</span>
              </div>
            )}
          </div>
        )}

        <div className={cn('flex flex-wrap gap-4 text-sm', colors.text.secondary)}>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <span>{stats.pendingItems} Pending</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span>{stats.inProgressItems} In Progress</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span>{stats.completedItems} Completed</span>
          </div>

          {stats.cancelledItems > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span>{stats.cancelledItems} Cancelled</span>
            </div>
          )}

          {stats.draftItems > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span>{stats.draftItems} Draft</span>
            </div>
          )}
        </div>

        {isReadOnly && request && (
          <div
            className={cn(
              'mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs',
              isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            )}
          >
            <ShieldAlert className="h-3 w-3" />
            <span>Read-only - Request is {request.status_label}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onManageLabItems}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
            colors.border.primary,
            colors.bg.hover,
            colors.text.primary
          )}
        >
          <PackageSearch className="h-4 w-4" />
          Browse Tests
        </button>

        {canModify && (
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Test
          </button>
        )}
      </div>
    </div>
  );
};
