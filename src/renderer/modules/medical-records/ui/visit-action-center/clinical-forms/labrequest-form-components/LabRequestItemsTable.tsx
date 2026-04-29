// labrequest-form-components/LabRequestItemsTable.tsx
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
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import type { ColorTokens, LabRequestDraftItem } from './labRequestForm.types';

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

// Helper to get status badge color
const getStatusBadgeColor = (status: string | undefined, isDark: boolean): string => {
  if (!status) return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';
  
  const statusColors: Record<string, string> = {
    pending: isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
    sample_collected: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
    in_progress: isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700',
    completed: isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700',
    verified: isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
  };
  
  return statusColors[status] || (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700');
};

// Helper to get status icon
const getStatusIcon = (status: string | undefined) => {
  switch (status) {
    case 'pending': return <Clock3 className="h-3 w-3" />;
    case 'sample_collected': return <Syringe className="h-3 w-3" />;
    case 'in_progress': return <Beaker className="h-3 w-3" />;
    case 'completed': return <CheckCircle2 className="h-3 w-3" />;
    case 'verified': return <CheckCircle2 className="h-3 w-3" />;
    default: return <Beaker className="h-3 w-3" />;
  }
};

// Helper to get workflow step number
const getWorkflowStep = (status: string | undefined): number => {
  switch (status) {
    case 'pending': return 1;
    case 'sample_collected': return 2;
    case 'in_progress': return 3;
    case 'completed': return 4;
    case 'verified': return 5;
    default: return 0;
  }
};

// Helper to get draft badge color
const getDraftBadgeColor = (isDark: boolean): string => {
  return isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700';
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
  // Determine if we can modify items based on request status
  const canModify = request ? request.status === 'pending' : true;
  
  // Count items by status
  const pendingItems = items.filter(item => item.status === 'pending' || item.isDraft).length;
  const inProgressItems = items.filter(item => item.status === 'in_progress' || item.status === 'sample_collected').length;
  const completedItems = items.filter(item => item.status === 'completed' || item.status === 'verified').length;
  const draftItems = items.filter(item => item.isDraft).length;

  // Get row styling based on draft status
  const getRowClassName = (isDraft: boolean) => {
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
      <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b p-4', colors.border.primary)}>
        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>
            Lab Request Tests
          </h3>
          <div className={cn('flex flex-wrap gap-3 mt-1 text-sm', colors.text.secondary)}>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              {pendingItems} Pending
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              {inProgressItems} In Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {completedItems} Completed
            </span>
            {draftItems > 0 && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                {draftItems} Draft
              </span>
            )}
          </div>
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
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" />
              Add Test
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <div className={cn('rounded-xl border border-dashed p-8 text-center', colors.border.primary, colors.bg.subtle)}>
            <FlaskConical className={cn('mx-auto mb-3 h-10 w-10', colors.text.tertiary)} />
            <p className={cn('text-sm font-medium', colors.text.primary)}>
              No Lab Tests added yet
            </p>
            <p className={cn('mt-1 text-sm', colors.text.secondary)}>
              Add one or more Lab Tests to prepare this request for processing
            </p>
            {canModify && (
              <button
                type="button"
                onClick={onAddItem}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
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
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className={cn('border-b', colors.border.primary)}>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Test Name</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Status</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Sample Type</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Requirements</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Turnaround</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Category / Code</th>
                    {canModify && (
                      <th className={cn('px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const isDraft = item.isDraft === true;
                    const itemStatus = isDraft ? 'pending' : (item.status || 'pending');
                    const workflowStep = getWorkflowStep(itemStatus);
                    const hasCriticalResults = !isDraft && (item as any).results?.some((r: any) => r.flag === 'critical');
                    const hasAbnormalResults = !isDraft && (item as any).results?.some((r: any) => r.flag === 'abnormal');
                    
                    return (
                      <tr
                        key={item.tempId || item.id}
                        className={getRowClassName(isDraft)}
                      >
                        {/* Test Name */}
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-2">
                            {hasCriticalResults ? (
                              <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-red-400' : 'text-red-600')} />
                            ) : hasAbnormalResults ? (
                              <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-amber-400' : 'text-amber-600')} />
                            ) : (
                              <TestTubeDiagonal className={cn('mt-0.5 h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className={cn('font-semibold', colors.text.primary)}>
                                  {item.display_name}
                                </div>
                                {isDraft && (
                                  <span className={cn(badgeBase, getDraftBadgeColor(isDark))}>
                                    <Save className="h-2.5 w-2.5 mr-1" />
                                    Draft
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
                            <span className={cn(badgeBase, getStatusBadgeColor(itemStatus, isDark))}>
                              {getStatusIcon(itemStatus)}
                              <span className="ml-1 capitalize">{itemStatus}</span>
                            </span>
                            {!isDraft && itemStatus !== 'pending' && itemStatus !== 'cancelled' && (
                              <div className="flex items-center gap-1">
                                <div className="flex-1 h-1 bg-gray-200 rounded-full dark:bg-gray-700">
                                  <div 
                                    className="h-1 rounded-full bg-blue-500 transition-all"
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
                          <div className="space-y-1">
                            <div className={cn('text-sm', colors.text.primary)}>
                              {item.sample_type || 'Not specified'}
                            </div>
                          </div>
                        </td>

                        {/* Requirements */}
                        <td className="px-4 py-4">
                          {item.requires_fasting ? (
                            <div className="flex items-center gap-1">
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
                            <Clock3 className={cn('h-4 w-4', isDark ? 'text-green-300' : 'text-green-600')} />
                            <span className={cn('text-sm', colors.text.primary)}>
                              {item.turnaround_time_hours 
                                ? item.turnaround_time_hours < 24 
                                  ? `${item.turnaround_time_hours} hrs` 
                                  : `${Math.floor(item.turnaround_time_hours / 24)} days`
                                : 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Category / Code */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {item.category && (
                              <div className={cn('text-sm', colors.text.primary)}>
                                {item.category}
                              </div>
                            )}
                            {item.code && (
                              <div className={cn('text-xs', colors.text.secondary)}>
                                Code: {item.code}
                              </div>
                            )}
                            {!item.category && !item.code && (
                              <span className={cn('text-xs', colors.text.tertiary)}>—</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        {canModify && (
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditItem(item)}
                                className={cn(
                                  'rounded-lg border p-2 transition-colors',
                                  colors.border.primary,
                                  isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                                )}
                                title="Edit test details"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDeleteItem(item)}
                                className={cn(
                                  'rounded-lg border p-2 transition-colors',
                                  colors.border.primary,
                                  isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50'
                                )}
                                title={request ? 'Cancel this test' : 'Remove this test'}
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            </div>
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
              {items.map((item) => {
                const isDraft = item.isDraft === true;
                const itemStatus = isDraft ? 'pending' : (item.status || 'pending');
                
                return (
                  <div 
                    key={item.tempId || item.id} 
                    className={cn(
                      'rounded-xl border p-4',
                      colors.border.primary, 
                      colors.bg.subtle,
                      isDraft && (isDark ? 'bg-purple-900/10' : 'bg-purple-50/50')
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <Beaker className={cn('mt-0.5 h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                          <div>
                            <div className="flex items-center gap-2">
                              <div className={cn('font-semibold', colors.text.primary)}>
                                {item.display_name}
                              </div>
                              {isDraft && (
                                <span className={cn(badgeBase, getDraftBadgeColor(isDark))}>
                                  <Save className="h-2.5 w-2.5 mr-1" />
                                  Draft
                                </span>
                              )}
                            </div>
                            {item.category && (
                              <div className={cn('mt-0.5 text-xs', colors.text.secondary)}>
                                {item.category}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={cn(badgeBase, getStatusBadgeColor(itemStatus, isDark))}>
                          {getStatusIcon(itemStatus)}
                          <span className="ml-1 capitalize">{itemStatus}</span>
                        </span>
                        {canModify && (
                          <div className="flex gap-1">
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

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Sample Type</div>
                        <div className={cn('text-sm', colors.text.primary)}>
                          {item.sample_type || 'Not specified'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
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
                      
                      <div className="space-y-1">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Fasting</div>
                        <div>
                          {item.requires_fasting ? (
                            <div className="flex items-center gap-1">
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
                      
                      <div className="space-y-1">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Code</div>
                        <div className={cn('text-sm', colors.text.primary)}>
                          {item.code || '—'}
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="col-span-2 space-y-1">
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