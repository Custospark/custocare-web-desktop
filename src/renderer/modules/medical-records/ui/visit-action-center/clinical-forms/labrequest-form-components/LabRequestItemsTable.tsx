import React from 'react';
import {
  AlertCircle,
  Ban,
  Beaker,
  CheckCircle2,
  Clock3,
  Edit3,
  FlaskConical,
  PackageSearch,
  Plus,
  ShieldAlert,
  Syringe,
  TestTubeDiagonal,
  Save,
  User,
  XCircle,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import { LabRequestStatus, LabRequestItemStatus } from '../../../../api/lab/LabTypes';
import type { ColorTokens, LabRequestDraftItem } from './labRequestForm.types';
import { formatDate } from './labRequestForm.types';

interface LabRequestItemsTableProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest | null;
  items: LabRequestDraftItem[];
  onAddItem: () => void;
  onEditItem: (item: LabRequestDraftItem) => void;
  onDeleteItem: (item: LabRequestDraftItem) => void;
  onManageLabItems: () => void;
}

const badgeBase = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

// Helper to get status badge color for request items
const getItemStatusBadgeColor = (status: string | undefined, isDark: boolean): string => {
  if (!status) return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
  
  const statusColors: Record<string, string> = {
    [LabRequestItemStatus.PENDING]: isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
    [LabRequestItemStatus.SAMPLE_COLLECTED]: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
    [LabRequestItemStatus.IN_PROGRESS]: isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700',
    [LabRequestItemStatus.COMPLETED]: isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700',
    [LabRequestItemStatus.VERIFIED]: isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    [LabRequestItemStatus.CANCELLED]: isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700',
  };
  
  return statusColors[status] || (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');
};

// Helper to get status icon
const getItemStatusIcon = (status: string | undefined) => {
  switch (status) {
    case LabRequestItemStatus.PENDING: return <Clock3 className="h-3 w-3" />;
    case LabRequestItemStatus.SAMPLE_COLLECTED: return <Syringe className="h-3 w-3" />;
    case LabRequestItemStatus.IN_PROGRESS: return <Beaker className="h-3 w-3" />;
    case LabRequestItemStatus.COMPLETED: return <CheckCircle2 className="h-3 w-3" />;
    case LabRequestItemStatus.VERIFIED: return <CheckCircle className="h-3 w-3" />;
    case LabRequestItemStatus.CANCELLED: return <XCircle className="h-3 w-3" />;
    default: return <Beaker className="h-3 w-3" />;
  }
};

// Helper to get workflow step number
const getWorkflowStep = (status: string | undefined): number => {
  switch (status) {
    case LabRequestItemStatus.PENDING: return 1;
    case LabRequestItemStatus.SAMPLE_COLLECTED: return 2;
    case LabRequestItemStatus.IN_PROGRESS: return 3;
    case LabRequestItemStatus.COMPLETED: return 4;
    case LabRequestItemStatus.VERIFIED: return 5;
    default: return 0;
  }
};

// Helper to get draft badge color
const getDraftBadgeColor = (isDark: boolean): string => {
  return isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700';
};

// Helper to format staff name with prefix
const formatStaffName = (staff: { name: string | null; professional_title?: string | null } | null | undefined): string => {
  if (!staff?.name) return 'Unknown clinician';
  
  const title = staff.professional_title || 'Dr.';
  const titlePrefix = title.toLowerCase().includes('dr') ? '' : 'Dr. ';
  return `${titlePrefix}${staff.name}`;
};

export const LabRequestItemsTable: React.FC<LabRequestItemsTableProps> = ({
  isDark,
  colors,
  request,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onManageLabItems,
}) => {




  // Helper to format turnaround time with minutes in brackets
const formatTurnaroundTimeWithMinutes = (hours: number | null | undefined): string => {
  if (!hours) return 'N/A';
  
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  
  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if (minutes === 0) {
      return `${wholeHours} hr${wholeHours !== 1 ? 's' : ''}`;
    }
    return `${wholeHours} hr${wholeHours !== 1 ? 's' : ''} (${minutes} min${minutes !== 1 ? 's' : ''})`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const wholeHours = Math.floor(remainingHours);
  const minutes = Math.round((remainingHours - wholeHours) * 60);
  
  let result = `${days} day${days !== 1 ? 's' : ''}`;
  if (wholeHours > 0) {
    result += ` ${wholeHours} hr${wholeHours !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    result += ` (${minutes} min${minutes !== 1 ? 's' : ''})`;
  }
  return result;
};
  // Determine if we can modify items based on request status
  const canModify = !request || (
    request.status !== LabRequestStatus.CANCELLED &&
    request.status !== LabRequestStatus.COMPLETED &&
    request.status !== LabRequestStatus.REVIEWED
  );
  
  // Determine if this is a read-only view
  const isReadOnly = !canModify;
  
  // Format requested by display
  const requestedByName = request?.requested_by ? formatStaffName(request.requested_by) : null;
  
  // Count items by status
  const pendingItems = items.filter(item => 
    (item.status === LabRequestItemStatus.PENDING || item.isDraft) && 
    item.status !== LabRequestItemStatus.CANCELLED
  ).length;
  
  const inProgressItems = items.filter(item => 
    item.status === LabRequestItemStatus.IN_PROGRESS ||
    item.status === LabRequestItemStatus.SAMPLE_COLLECTED
  ).length;
  
  const completedItems = items.filter(item => 
    item.status === LabRequestItemStatus.COMPLETED ||
    item.status === LabRequestItemStatus.VERIFIED
  ).length;
  
  const cancelledItems = items.filter(item => 
    item.status === LabRequestItemStatus.CANCELLED
  ).length;
  
  const draftItems = items.filter(item => item.isDraft).length;

  // Get row styling based on draft status or cancelled status
  const getRowClassName = (isDraft: boolean, isCancelled: boolean) => {
    if (isCancelled) {
      return cn(
        'border-b align-top transition-colors opacity-60',
        colors.border.primary,
        isDark ? 'bg-red-900/5 hover:bg-red-900/10' : 'bg-red-50/30 hover:bg-red-50/50'
      );
    }
    
    return cn(
      'border-b align-top transition-colors',
      colors.border.primary,
      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50',
      isDraft && 'opacity-75 bg-opacity-50',
      isDraft && (isDark ? 'bg-purple-900/10' : 'bg-purple-50/50')
    );
  };

  return (
    <section className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
      {/* Header Section */}
      <div className={cn('flex flex-wrap items-start justify-between gap-4 border-b p-5', colors.border.primary)}>
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
          
          {/* Request metadata with dates */}
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
          
          {/* Status badges */}
          <div className={cn('flex flex-wrap gap-4 text-sm', colors.text.secondary)}>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span>{pendingItems} Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>{inProgressItems} In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span>{completedItems} Completed</span>
            </div>
            {cancelledItems > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span>{cancelledItems} Cancelled</span>
              </div>
            )}
            {draftItems > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span>{draftItems} Draft</span>
              </div>
            )}
          </div>
          
          {/* Read-only indicator */}
          {isReadOnly && request && (
            <div className={cn('mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs', 
              isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            )}>
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
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Test
            </button>
          )}
        </div>
      </div>

      {/* Table Body */}
      <div className="p-5">
        {items.length === 0 ? (
          <div className={cn('rounded-xl border border-dashed p-12 text-center', colors.border.primary, colors.bg.subtle)}>
            <FlaskConical className={cn('mx-auto mb-4 h-12 w-12', colors.text.tertiary)} />
            <p className={cn('text-base font-medium', colors.text.primary)}>
              No Lab Tests added yet
            </p>
            <p className={cn('mt-1 text-sm', colors.text.secondary)}>
              Add one or more Lab Tests to prepare this request for processing
            </p>
            {canModify && (
              <button
                type="button"
                onClick={onAddItem}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Your First Test
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
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
                      Sample Type
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
                  {items.map((item, idx) => {
                    const isDraft = item.isDraft === true;
                    const isCancelled = item.status === LabRequestItemStatus.CANCELLED;
                    const itemStatus = isDraft ? LabRequestItemStatus.PENDING : (item.status || LabRequestItemStatus.PENDING);
                    const workflowStep = getWorkflowStep(itemStatus);
                    const hasCriticalResults = !isDraft && (item as any).results?.some((r: any) => r.flag === 'critical');
                    const hasAbnormalResults = !isDraft && (item as any).results?.some((r: any) => r.flag === 'abnormal');
                    
                    return (
                      <tr
                        key={item.tempId || item.id}
                        className={getRowClassName(isDraft, isCancelled)}
                      >
                        {/* Row Number */}
                        <td className="px-3 py-4 text-center">
                          <span className={cn('text-sm font-medium', colors.text.secondary)}>
                            {idx + 1}
                          </span>
                         </td>

                        {/* Test Name */}
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-2.5">
                            {hasCriticalResults ? (
                              <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-red-400' : 'text-red-600')} />
                            ) : hasAbnormalResults ? (
                              <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-amber-400' : 'text-amber-600')} />
                            ) : (
                              <TestTubeDiagonal className={cn('mt-0.5 h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className={cn('font-semibold', colors.text.primary)}>
                                  {item.display_name}
                                </div>
                                {isDraft && (
                                  <span className={cn(badgeBase, getDraftBadgeColor(isDark))}>
                                    <Save className="h-2.5 w-2.5 mr-1" />
                                    Draft
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className={cn(badgeBase, isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700')}>
                                    <XCircle className="h-2.5 w-2.5 mr-1" />
                                    Cancelled
                                  </span>
                                )}
                              </div>
                              {item.notes && (
                                <div className={cn('mt-1 text-xs italic', colors.text.tertiary)}>
                                  Note: {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                         </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <span className={cn(badgeBase, getItemStatusBadgeColor(itemStatus, isDark))}>
                              {getItemStatusIcon(itemStatus)}
                              <span className="ml-1 capitalize">{itemStatus.replace('_', ' ')}</span>
                            </span>
                            {!isDraft && !isCancelled && itemStatus !== LabRequestItemStatus.PENDING && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full dark:bg-gray-700">
                                  <div 
                                    className="h-1.5 rounded-full bg-blue-500 transition-all"
                                    style={{ width: `${(workflowStep / 5) * 100}%` }}
                                  />
                                </div>
                                <span className={cn('text-xs', colors.text.tertiary)}>
                                  Step {workflowStep}/5
                                </span>
                              </div>
                            )}
                          </div>
                         </td>

                        {/* Sample Type */}
                        <td className="px-4 py-4">
                          <div className={cn('text-sm', colors.text.primary)}>
                            {item.sample_type || '—'}
                          </div>
                         </td>

                        {/* Requirements */}
                        <td className="px-4 py-4">
                          {item.requires_fasting ? (
                            <div className="flex items-center gap-1.5">
                              <ShieldAlert className={cn('h-3.5 w-3.5', isDark ? 'text-orange-300' : 'text-orange-600')} />
                              <span className={cn('text-xs', isDark ? 'text-orange-300' : 'text-orange-700')}>
                                Fasting required
                              </span>
                            </div>
                          ) : (
                            <span className={cn('text-xs', colors.text.tertiary)}>No fasting</span>
                          )}
                         </td>

                        {/* Turnaround */}
                       <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Clock3 className={cn('h-3.5 w-3.5', isDark ? 'text-green-300' : 'text-green-600')} />
                            <span className={cn('text-sm', colors.text.primary)}>
                              {formatTurnaroundTimeWithMinutes(item.turnaround_time_hours)}
                            </span>
                          </div>
                        </td>
                        {/* Category / Code */}
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            {item.category && (
                              <div className={cn('text-sm', colors.text.primary)}>
                                {item.category}
                              </div>
                            )}
                            {item.code && (
                              <div className={cn('text-xs font-mono', colors.text.secondary)}>
                                {item.code}
                              </div>
                            )}
                            {!item.category && !item.code && (
                              <span className={cn('text-xs', colors.text.tertiary)}>—</span>
                            )}
                          </div>
                         </td>

                        {/* Actions - Only show if not cancelled and can modify */}
                        {canModify && !isCancelled && (
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onEditItem(item)}
                                className={cn(
                                  'rounded-lg border p-1.5 transition-colors',
                                  colors.border.primary,
                                  isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                                )}
                                title="Edit test details"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteItem(item)}
                                className={cn(
                                  'rounded-lg border p-1.5 transition-colors',
                                  colors.border.primary,
                                  isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50'
                                )}
                                title={request ? 'Cancel this test' : 'Remove this test'}
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            </div>
                           </td>
                        )}
                        
                        {/* Empty actions cell for cancelled items */}
                        {canModify && isCancelled && (
                          <td className="px-4 py-4 text-center">
                            <span className={cn('text-xs', colors.text.tertiary)}>—</span>
                          </td>
                        )}
                       </tr>
                    );
                  })}
                </tbody>
               </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="grid gap-3 lg:hidden">
              {items.map((item, idx) => {
                const isDraft = item.isDraft === true;
                const isCancelled = item.status === LabRequestItemStatus.CANCELLED;
                const itemStatus = isDraft ? LabRequestItemStatus.PENDING : (item.status || LabRequestItemStatus.PENDING);
                
                return (
                  <div 
                    key={item.tempId || item.id} 
                    className={cn(
                      'rounded-xl border p-4',
                      colors.border.primary, 
                      colors.bg.subtle,
                      isDraft && (isDark ? 'bg-purple-900/10' : 'bg-purple-50/50'),
                      isCancelled && (isDark ? 'bg-red-900/5' : 'bg-red-50/30')
                    )}
                  >
                    {/* Header with row number and actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium', colors.text.secondary)}>
                          #{idx + 1}
                        </span>
                        <div className={cn('font-semibold', colors.text.primary)}>
                          {item.display_name}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={cn(badgeBase, getItemStatusBadgeColor(itemStatus, isDark))}>
                          {getItemStatusIcon(itemStatus)}
                          <span className="ml-1 capitalize">{itemStatus.replace('_', ' ')}</span>
                        </span>
                        {canModify && !isCancelled && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditItem(item)}
                              className={cn(
                                'rounded-lg border p-1.5 transition-colors',
                                colors.border.primary,
                                isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                              )}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item)}
                              className={cn(
                                'rounded-lg border p-1.5 transition-colors',
                                colors.border.primary,
                                isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50'
                              )}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata grid */}
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      <div className="space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Category</div>
                        <div className={cn('text-sm', colors.text.primary)}>
                          {item.category || '—'}
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Code</div>
                        <div className={cn('text-sm font-mono', colors.text.primary)}>
                          {item.code || '—'}
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Sample Type</div>
                        <div className={cn('text-sm', colors.text.primary)}>
                          {item.sample_type || '—'}
                        </div>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Turnaround</div>
                        <div className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          <span className={cn('text-sm', colors.text.primary)}>
                            {item.turnaround_time_hours 
                              ? item.turnaround_time_hours < 24 
                                ? `${item.turnaround_time_hours} hrs` 
                                : `${Math.floor(item.turnaround_time_hours / 24)} days`
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="col-span-2 space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Fasting</div>
                        <div>
                          {item.requires_fasting ? (
                            <div className="flex items-center gap-1.5">
                              <ShieldAlert className={cn('h-3.5 w-3.5', isDark ? 'text-orange-300' : 'text-orange-600')} />
                              <span className={cn('text-xs', isDark ? 'text-orange-300' : 'text-orange-700')}>
                                Required
                              </span>
                            </div>
                          ) : (
                            <span className={cn('text-xs', colors.text.tertiary)}>Not required</span>
                          )}
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="col-span-2 space-y-0.5">
                          <div className={cn('text-xs font-medium', colors.text.secondary)}>Notes</div>
                          <div className={cn('text-sm', colors.text.primary)}>
                            {item.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default LabRequestItemsTable;