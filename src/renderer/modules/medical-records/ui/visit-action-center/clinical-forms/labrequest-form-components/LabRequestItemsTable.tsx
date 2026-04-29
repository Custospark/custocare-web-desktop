// labrequest-form-components/LabRequestItemsTable.tsx
import React, { useCallback, useEffect, useState } from 'react';
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
  XCircle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';
import { labKeys } from '../../../../api/lab/LabQueries';
import type { LabRequest, LabRequestItem } from '../../../../api/lab/LabTypes';
import type { ColorTokens } from './labRequestForm.types';

interface LabRequestItemsTableProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest | null;
  staffId: number | null | undefined;
  onAddItem: () => void;
  onManageLabItems: () => void;
  onRequestUpdate?: () => Promise<void>;
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

export const LabRequestItemsTable: React.FC<LabRequestItemsTableProps> = ({
  isDark,
  colors,
  request,
  staffId,
  onAddItem,
  onManageLabItems,
  onRequestUpdate,
}) => {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<LabRequestItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<LabRequestItem>>({});

  // Get items from request - cancelled items are filtered out by backend
  const items = request?.items || [];
  const canEdit = request?.status === 'pending';
  const canAdd = request?.status === 'pending' || request?.status === 'in_progress';

  const pendingItems = items.filter(item => item.status === 'pending').length;
  const inProgressItems = items.filter(item => item.status === 'in_progress' || item.status === 'sample_collected').length;
  const completedItems = items.filter(item => item.status === 'completed' || item.status === 'verified').length;

  // Refresh the request data
  const refreshData = useCallback(async () => {
    if (!request?.request_uuid) return;
    
    setIsLoading(true);
    try {
      await queryClient.invalidateQueries({ 
        queryKey: labKeys.requestWithItems(request.request_uuid) 
      });
      await queryClient.refetchQueries({ 
        queryKey: labKeys.requestWithItems(request.request_uuid) 
      });
      if (onRequestUpdate) {
        await onRequestUpdate();
      }
    } catch (error) {
      console.error('Failed to refresh items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [queryClient, request?.request_uuid, onRequestUpdate]);

  // Cancel an item
  const handleCancelItem = useCallback(async (item: LabRequestItem) => {
    const confirmed = await confirm({
      title: 'Cancel Lab Test',
      message: `Are you sure you want to cancel "${item.lab_test?.name || `Test #${item.lab_test_id}`}" from this lab request?`,
      confirmText: 'Cancel Test',
      cancelText: 'Keep Test',
      variant: 'danger',
      theme: isDark ? 'dark' : 'light',
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/lab/request-items/${item.item_uuid}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          reason: 'Cancelled from lab request form',
          cancelled_by_staff_id: staffId,
        }),
      });

      if (!response.ok) throw new Error('Failed to cancel item');

      await refreshData();
      showToast('success', 'Lab test cancelled successfully', 3000);
    } catch (error) {
      console.error('Failed to cancel item:', error);
      showToast('error', 'Failed to cancel lab test', 5000);
    } finally {
      setIsLoading(false);
    }
  }, [confirm, isDark, refreshData, showToast, staffId]);

  // Update an item (edit sample type, notes, etc.)
  const handleUpdateItem = useCallback(async () => {
    if (!editingItem || !editFormData) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/lab/request-items/${editingItem.item_uuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          sample_type: editFormData.sample_type,
          notes: editFormData.notes,
          updated_by_staff_id: staffId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update item');

      await refreshData();
      showToast('success', 'Lab test updated successfully', 3000);
      setShowEditModal(false);
      setEditingItem(null);
      setEditFormData({});
    } catch (error) {
      console.error('Failed to update item:', error);
      showToast('error', 'Failed to update lab test', 5000);
    } finally {
      setIsLoading(false);
    }
  }, [editingItem, editFormData, refreshData, showToast, staffId]);

  // Open edit modal
  const openEditModal = useCallback((item: LabRequestItem) => {
    setEditingItem(item);
    setEditFormData({
      sample_type: item.sample_type || '',
      notes: item.notes || '',
    });
    setShowEditModal(true);
  }, []);

  // Close edit modal
  const closeEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingItem(null);
    setEditFormData({});
  }, []);

  // Edit form change handler
  const handleEditChange = useCallback((field: keyof LabRequestItem, value: string | null) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <>
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
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            )}
            
            <button
              type="button"
              onClick={onManageLabItems}
              disabled={isLoading}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.bg.hover,
                colors.text.primary,
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <PackageSearch className="h-4 w-4" />
              Browse Tests
            </button>

            {canAdd && (
              <button
                type="button"
                onClick={onAddItem}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-800 disabled:opacity-50"
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
                {canAdd 
                  ? 'Add one or more Lab Tests to prepare this request for processing'
                  : 'This request cannot be modified in its current state'}
              </p>
              {canAdd && (
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
                      {canEdit && (
                        <th className={cn('px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => {
                      const labTest = item.lab_test;
                      const hasCriticalResults = item.results?.some(r => r.flag === 'critical');
                      const hasAbnormalResults = item.results?.some(r => r.flag === 'abnormal');
                      const workflowStep = getWorkflowStep(item.status);
                      
                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            'border-b align-top transition-colors',
                            colors.border.primary,
                            isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                          )}
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
                                <div className={cn('font-semibold', colors.text.primary)}>
                                  {labTest?.name || `Test #${item.lab_test_id}`}
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
                              <span className={cn(badgeBase, getStatusBadgeColor(item.status, isDark))}>
                                {getStatusIcon(item.status)}
                                <span className="ml-1 capitalize">{item.status_label || item.status}</span>
                              </span>
                              {item.status !== 'pending' && item.status !== 'cancelled' && (
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
                              {item.result_flag && item.result_flag !== 'pending' && (
                                <div className={cn(
                                  'mt-1 text-xs',
                                  item.result_flag === 'critical' ? (isDark ? 'text-red-400' : 'text-red-600') :
                                  item.result_flag === 'abnormal' ? (isDark ? 'text-amber-400' : 'text-amber-600') :
                                  (isDark ? 'text-green-400' : 'text-green-600')
                                )}>
                                  Flag: {item.result_flag_label}
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
                              {item.sample_identifier && (
                                <div className={cn('text-xs', colors.text.tertiary)}>
                                  ID: {item.sample_identifier}
                                </div>
                              )}
                              {item.collected_at && (
                                <div className={cn('text-xs', colors.text.tertiary)}>
                                  Collected: {new Date(item.collected_at).toLocaleDateString()}
                                </div>
                              )}
                              {item.collected_by && (
                                <div className={cn('text-xs', colors.text.tertiary)}>
                                  By: {item.collected_by.name}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Requirements */}
                          <td className="px-4 py-4">
                            {labTest?.requires_fasting ? (
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
                                {labTest?.turnaround_time_hours 
                                  ? labTest.turnaround_time_hours < 24 
                                    ? `${labTest.turnaround_time_hours} hrs` 
                                    : `${Math.floor(labTest.turnaround_time_hours / 24)} days`
                                  : 'N/A'}
                              </span>
                            </div>
                            {item.turnaround_time_minutes && (
                              <div className={cn('mt-1 text-xs', colors.text.tertiary)}>
                                Actual: {Math.floor(item.turnaround_time_minutes / 60)}h {item.turnaround_time_minutes % 60}m
                              </div>
                            )}
                          </td>

                          {/* Category / Code */}
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              {labTest?.category && (
                                <div className={cn('text-sm', colors.text.primary)}>
                                  {labTest.category}
                                </div>
                              )}
                              {labTest?.code && (
                                <div className={cn('text-xs', colors.text.secondary)}>
                                  Code: {labTest.code}
                                </div>
                              )}
                              {!labTest?.category && !labTest?.code && (
                                <span className={cn('text-xs', colors.text.tertiary)}>—</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          {canEdit && (
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(item)}
                                  disabled={isLoading}
                                  className={cn(
                                    'rounded-lg border p-2 transition-colors',
                                    colors.border.primary,
                                    isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100',
                                    isLoading && 'opacity-50 cursor-not-allowed'
                                  )}
                                  title="Edit test details"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCancelItem(item)}
                                  disabled={isLoading}
                                  className={cn(
                                    'rounded-lg border p-2 transition-colors',
                                    colors.border.primary,
                                    isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50',
                                    isLoading && 'opacity-50 cursor-not-allowed'
                                  )}
                                  title="Cancel this test"
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
                  const labTest = item.lab_test;
                  const hasCriticalResults = item.results?.some(r => r.flag === 'critical');
                  const hasAbnormalResults = item.results?.some(r => r.flag === 'abnormal');
                  
                  return (
                    <div key={item.id} className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            {hasCriticalResults ? (
                              <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-red-400' : 'text-red-600')} />
                            ) : hasAbnormalResults ? (
                              <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-amber-400' : 'text-amber-600')} />
                            ) : (
                              <Beaker className={cn('mt-0.5 h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                            )}
                            <div>
                              <div className={cn('font-semibold', colors.text.primary)}>
                                {labTest?.name || `Test #${item.lab_test_id}`}
                              </div>
                              {labTest?.category && (
                                <div className={cn('mt-0.5 text-xs', colors.text.secondary)}>
                                  {labTest.category}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={cn(badgeBase, getStatusBadgeColor(item.status, isDark))}>
                            {getStatusIcon(item.status)}
                            <span className="ml-1 capitalize">{item.status_label || item.status}</span>
                          </span>
                          {canEdit && (
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
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
                                onClick={() => handleCancelItem(item)}
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
                              {labTest?.turnaround_time_hours 
                                ? labTest.turnaround_time_hours < 24 
                                  ? `${labTest.turnaround_time_hours} hrs` 
                                  : `${Math.floor(labTest.turnaround_time_hours / 24)} days`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className={cn('text-xs font-medium', colors.text.secondary)}>Fasting</div>
                          <div>
                            {labTest?.requires_fasting ? (
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
                            {labTest?.code || '—'}
                          </div>
                        </div>
                        
                        {item.result_flag && item.result_flag !== 'pending' && (
                          <div className="col-span-2 space-y-1">
                            <div className={cn('text-xs font-medium', colors.text.secondary)}>Result Flag</div>
                            <div className={cn(
                              'text-sm',
                              item.result_flag === 'critical' ? (isDark ? 'text-red-400' : 'text-red-600') :
                              item.result_flag === 'abnormal' ? (isDark ? 'text-amber-400' : 'text-amber-600') :
                              (isDark ? 'text-green-400' : 'text-green-600')
                            )}>
                              {item.result_flag_label}
                            </div>
                          </div>
                        )}
                        
                        {item.notes && (
                          <div className="col-span-2 space-y-1">
                            <div className={cn('text-xs font-medium', colors.text.secondary)}>Notes</div>
                            <div className={cn('text-sm', colors.text.primary)}>
                              {item.notes}
                            </div>
                          </div>
                        )}

                        {item.collected_by && (
                          <div className="col-span-2 space-y-1">
                            <div className={cn('text-xs font-medium', colors.text.secondary)}>Collected By</div>
                            <div className={cn('text-sm', colors.text.primary)}>
                              {item.collected_by.name}
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

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={cn(
            'rounded-xl p-6 w-full max-w-md',
            isDark ? 'bg-gray-800' : 'bg-white',
            colors.border.primary
          )}>
            <h3 className={cn('text-lg font-semibold mb-4', colors.text.primary)}>
              Edit Lab Test
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={cn('block text-sm font-medium mb-1', colors.text.secondary)}>
                  Test Name
                </label>
                <div className={cn('text-sm', colors.text.primary)}>
                  {editingItem.lab_test?.name || `Test #${editingItem.lab_test_id}`}
                </div>
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', colors.text.secondary)}>
                  Sample Type
                </label>
                <input
                  type="text"
                  value={editFormData.sample_type || ''}
                  onChange={(e) => handleEditChange('sample_type', e.target.value)}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    colors.border.primary,
                    isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                  )}
                  placeholder="e.g., Blood, Urine, Stool"
                />
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', colors.text.secondary)}>
                  Notes
                </label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => handleEditChange('notes', e.target.value)}
                  rows={3}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm',
                    colors.border.primary,
                    isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                  )}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeEditModal}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  colors.border.primary,
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateItem}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LabRequestItemsTable;