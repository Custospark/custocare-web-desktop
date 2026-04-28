// LabRequestForm.tsx
/**
 * ============================================================================
 * LAB REQUEST FORM
 * ============================================================================
 *
 * Enterprise-grade lab request orchestration component.
 *
 * Scope included:
 * - Create/edit lab requests
 * - Add/edit/remove lab request items
 * - Use template flow
 * - Open management flows for:
 *   - Lab templates
 *   - Lab template fields
 *   - Lab items / lab tests
 * - Inventory-aware item selection architecture
 *
 * Scope intentionally excluded:
 * - Lab results entry / lab result forms
 * - Lab results workflow
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  RefreshCw,
  Save,
  User,
  X,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { getActiveFacilityId, getUserId } from '../../../../../app/store/utils/contextSelectors';
import { selectActiveVisitPatientId, selectActiveVisitId } from '../../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../../app/store/rootReducer';

import type {
  LabRequest,
  LabTemplate,
  LabTest,
  CreateLabRequestWithItemsRequest,
} from '../../../api/lab/LabTypes';
import {
  LabRequestPriority,
  LabRequestStatus,
} from '../../../api/lab/LabTypes';
import {
  labKeys,
  useAddItemsToRequest,
  useCancelItem,
  useCancelLabRequest,
  useCreateLabRequestItem,
  useCreateLabRequestWithItems,
  useGetActiveTemplates,
  useGetLabTests,
  useGetPopularTests,
  useGetRequestWithItems,
  useGetRequestsByVisit,
  useUpdateLabRequest,
  useUpdateLabRequestItem,
} from '../../../api/lab/LabQueries';

import LabRequestHeader from './labrequest-form-components/LabRequestHeader';
import LabRequestContextBanner from './labrequest-form-components/LabRequestContextBanner';
import LabRequestDetailsCard from './labrequest-form-components/LabRequestDetailsCard';
import LabRequestItemsTable from './labrequest-form-components/LabRequestItemsTable';
import LabRequestItemEditorModal from './labrequest-form-components/LabRequestItemEditorModal';
import LabTemplateSelectorModal from './labrequest-form-components/LabTemplateSelectorModal';
import LabTemplateManagerModal from './labrequest-form-components/LabTemplateManagerModal';
import LabTemplateFieldManagerModal from './labrequest-form-components/LabTemplateFieldManagerModal';
import LabItemManagerModal from './labrequest-form-components/LabItemManagerModal';

import type {
  ColorTokens,
  LabRequestDraftItem,
  LabRequestFormData,
  LabRequestItemEditorData,
  LabTemplateSelectionResult,
} from './labrequest-form-components/labRequestForm.types';
import {
  EMPTY_LAB_REQUEST,
  EMPTY_LAB_REQUEST_ITEM,
  buildDiagnosisContextPayload,
  buildLocalLabRequestDraftItem,
  isLabRequestDraftItemPersistable,
  toLabRequestDraftItems,
  toLabRequestFormData,
  toLabRequestItemCreatePayload,
  toLabRequestItemUpdatePayload,
} from './labrequest-form-components/labRequestForm.types';

interface LabRequestFormProps {
  theme?: 'light' | 'dark';
  existingRequest?: LabRequest | null;
  onCancel?: () => void;
  onSuccess?: (requestId: number) => void;
}

export const LabRequestForm: React.FC<LabRequestFormProps> = ({
  theme = 'light',
  existingRequest,
  onCancel,
  onSuccess,
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  /**
   * --------------------------------------------------------------------------
   * EXACT ACTIVE CONTEXT EXTRACTION
   * --------------------------------------------------------------------------
   * This follows the same extraction pattern already used in PrescriptionForm.
   */
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const patientId = useSelector((state: RootState) => selectActiveVisitPatientId(state));
  const visitId = useSelector((state: RootState) => selectActiveVisitId(state));
  const userId = useSelector((state: RootState) => getUserId(state));

  const patientNumericId = patientId ? Number(patientId) : 0;
  const visitNumericId = visitId ? Number(visitId) : 0;

  /**
   * --------------------------------------------------------------------------
   * ACTIVE REQUEST RESOLUTION
   * --------------------------------------------------------------------------
   * Mirrors the prescription pattern:
   * - use explicitly passed request if present
   * - otherwise derive the most relevant request from the active visit
   */
  const visitRequestsQuery = useGetRequestsByVisit(visitNumericId, {
    enabled: !!visitNumericId && !existingRequest,
  });

  const resolvedExistingRequest = useMemo<LabRequest | null>(() => {
    if (existingRequest) return existingRequest;

    const requests = visitRequestsQuery.data?.data || [];
    if (!requests.length) return null;

    const activeStatuses = [
      LabRequestStatus.PENDING,
      LabRequestStatus.IN_PROGRESS,
    ];

    const activeRequests = requests.filter((request) =>
      activeStatuses.includes(request.status)
    );

    const candidatePool = activeRequests.length ? activeRequests : requests;

    const sorted = [...candidatePool].sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    });

    return sorted[0] ?? null;
  }, [existingRequest, visitRequestsQuery.data]);

  const [createdRequestUuid, setCreatedRequestUuid] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const currentRequestUuid = createdRequestUuid || resolvedExistingRequest?.request_uuid || '';

  const currentRequestQuery = useGetRequestWithItems(currentRequestUuid, {
    enabled: !!currentRequestUuid,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const currentRequest = currentRequestQuery.data?.data || resolvedExistingRequest || null;

  /**
   * --------------------------------------------------------------------------
   * LOCAL FORM STATE
   * --------------------------------------------------------------------------
   * All editors remain CLOSED by default.
   * A form opens only after explicit user action, per your requirement.
   */
  const [formData, setFormData] = useState<LabRequestFormData>(EMPTY_LAB_REQUEST);
  const [draftItems, setDraftItems] = useState<LabRequestDraftItem[]>([]);
  const [editingItem, setEditingItem] = useState<LabRequestDraftItem | null>(null);
  const [itemEditorData, setItemEditorData] = useState<LabRequestItemEditorData>(EMPTY_LAB_REQUEST_ITEM);

  const [isDetailsEditorOpen, setIsDetailsEditorOpen] = useState(false);
  const [showItemEditorModal, setShowItemEditorModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTemplateFieldManager, setShowTemplateFieldManager] = useState(false);
  const [showLabItemManager, setShowLabItemManager] = useState(false);

  const [selectedTemplateForManagement, setSelectedTemplateForManagement] = useState<LabTemplate | null>(null);
  const [selectedLabItemForManagement, setSelectedLabItemForManagement] = useState<LabTest | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * --------------------------------------------------------------------------
   * SUPPORTING QUERIES
   * --------------------------------------------------------------------------
   * These support:
   * - template selection
   * - lab item search
   * - inventory-aware selection flow in child components
   * - CRUD manager entry points
   */
  const shouldLoadReferenceData =
    !!facilityId &&
    (
      showTemplateSelector ||
      showTemplateManager ||
      showTemplateFieldManager ||
      showLabItemManager ||
      showItemEditorModal
    );

  const templatesQuery = useGetActiveTemplates(facilityId || undefined, {
    enabled: shouldLoadReferenceData,
  });

  const labItemsQuery = useGetLabTests(
    {
      facility_id: facilityId || undefined,
      is_active: true,
      per_page: 100,
      order_by: 'name',
      order_direction: 'asc',
    },
    {
      enabled: shouldLoadReferenceData,
    }
  );

  const popularLabItemsQuery = useGetPopularTests(facilityId || 0, 12, {
    enabled: !!facilityId && (showItemEditorModal || showLabItemManager),
  });

  /**
   * --------------------------------------------------------------------------
   * MUTATIONS
   * --------------------------------------------------------------------------
   */
  const createLabRequestWithItems = useCreateLabRequestWithItems();
  const updateLabRequest = useUpdateLabRequest();
  const cancelLabRequest = useCancelLabRequest();
  const addItemsToRequest = useAddItemsToRequest();
  const createLabRequestItem = useCreateLabRequestItem();
  const updateLabRequestItem = useUpdateLabRequestItem();
  const cancelItem = useCancelItem();

  const isMutating =
    createLabRequestWithItems.isPending ||
    updateLabRequest.isPending ||
    cancelLabRequest.isPending ||
    addItemsToRequest.isPending ||
    createLabRequestItem.isPending ||
    updateLabRequestItem.isPending ||
    cancelItem.isPending;

  /**
   * --------------------------------------------------------------------------
   * THEME TOKENS
   * --------------------------------------------------------------------------
   */
  const colors: ColorTokens = useMemo(
    () => ({
      bg: {
        card: isDark ? 'bg-gray-900' : 'bg-white',
        input: isDark ? 'bg-gray-800' : 'bg-gray-50',
        subtle: isDark ? 'bg-gray-800/60' : 'bg-gray-50',
        hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
        muted: isDark ? 'bg-gray-800' : 'bg-gray-100',
        modal: isDark ? 'bg-gray-900/95' : 'bg-white/95',
      },
      text: {
        primary: isDark ? 'text-gray-100' : 'text-gray-900',
        secondary: isDark ? 'text-gray-400' : 'text-gray-600',
        tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
        brand: isDark ? 'text-blue-400' : 'text-blue-600',
      },
      border: {
        primary: isDark ? 'border-gray-700' : 'border-gray-200',
        subtle: isDark ? 'border-gray-800' : 'border-gray-100',
        focus: 'focus:border-blue-500',
      },
    }),
    [isDark]
  );

  /**
   * --------------------------------------------------------------------------
   * SYNC CURRENT REQUEST INTO FORM
   * --------------------------------------------------------------------------
   */
  useEffect(() => {
    if (currentRequest) {
      setFormData(toLabRequestFormData(currentRequest));
    }
  }, [currentRequest]);

  useEffect(() => {
    if (currentRequest?.items) {
      setDraftItems(toLabRequestDraftItems(currentRequest.items));
    }
  }, [currentRequest]);

  /**
   * --------------------------------------------------------------------------
   * HELPERS
   * --------------------------------------------------------------------------
   */
  const refreshAllData = useCallback(async () => {
    setIsManualRefreshing(true);

    try {
      if (visitNumericId) {
        await queryClient.invalidateQueries({
          queryKey: labKeys.requestByVisit(visitNumericId),
        });
        await queryClient.refetchQueries({
          queryKey: labKeys.requestByVisit(visitNumericId),
        });
      }

      if (currentRequestUuid) {
        await queryClient.invalidateQueries({
          queryKey: labKeys.requestWithItems(currentRequestUuid),
        });
        await queryClient.refetchQueries({
          queryKey: labKeys.requestWithItems(currentRequestUuid),
        });
      }

      await queryClient.invalidateQueries({
        queryKey: labKeys.requests(),
      });

      showToast('success', 'Lab request data refreshed', 2000);
    } catch (error) {
      console.error('Failed to refresh lab request data:', error);
      showToast('error', 'Failed to refresh lab request data', 3000);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [currentRequestUuid, queryClient, showToast, visitNumericId]);

  const resetItemEditor = useCallback(() => {
    setItemEditorData(EMPTY_LAB_REQUEST_ITEM);
    setEditingItem(null);
    setShowItemEditorModal(false);
  }, []);

  const openAddItemModal = useCallback(() => {
    setItemEditorData(EMPTY_LAB_REQUEST_ITEM);
    setEditingItem(null);
    setShowItemEditorModal(true);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof LabRequestFormData, value: string | LabRequestPriority) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleItemEditorChange = useCallback(
    (field: keyof LabRequestItemEditorData, value: string | number | boolean | null) => {
      setItemEditorData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleEditItem = useCallback((item: LabRequestDraftItem) => {
    setEditingItem(item);
    setItemEditorData({
      id: item.id ?? null,
      item_uuid: item.item_uuid ?? null,
      display_name: item.display_name,
      lab_test_id: item.lab_test_id ?? null,
      source: item.source,
      source_inventory_item_id: item.source_inventory_item_id ?? null,
      sample_type: item.sample_type || '',
      notes: item.notes || '',
      template_id: item.template_id ?? null,
      template_name: item.template_name || '',
      code: item.code || '',
      category: item.category || '',
      turnaround_time_hours: item.turnaround_time_hours ?? null,
      requires_fasting: !!item.requires_fasting,
      is_from_inventory: !!item.is_from_inventory,
      inventory_display_unit: item.inventory_display_unit || '',
      inventory_available_quantity: item.inventory_available_quantity ?? null,
    });
    setShowItemEditorModal(true);
  }, []);

  const refreshRequestWithItems = useCallback(async () => {
    if (!currentRequestUuid) return;

    await queryClient.invalidateQueries({
      queryKey: labKeys.requestWithItems(currentRequestUuid),
    });

    await queryClient.refetchQueries({
      queryKey: labKeys.requestWithItems(currentRequestUuid),
    });
  }, [currentRequestUuid, queryClient]);

  /**
   * --------------------------------------------------------------------------
   * ITEM SAVE FLOW
   * --------------------------------------------------------------------------
   * Production-safe rule:
   * - if selected from inventory but not mapped to a real lab item/test,
   *   do not persist to request yet
   * - user should create/map a lab item first from the manager flow
   */
  const handleSaveItem = useCallback(async () => {
    if (!itemEditorData.display_name.trim()) {
      showToast('error', 'Lab item name is required', 3000);
      return;
    }

    if (!itemEditorData.lab_test_id) {
      showToast(
        'error',
        'This selection is not yet mapped to a lab item. Create or map a lab item before adding it to the lab request.',
        5000
      );
      return;
    }

    try {
      if (editingItem && currentRequest?.id && editingItem.item_uuid) {
        await updateLabRequestItem.mutateAsync({
          uuid: editingItem.item_uuid,
          data: toLabRequestItemUpdatePayload(itemEditorData, currentRequest.id),
        });

        await refreshRequestWithItems();
        showToast('success', 'Lab request item updated successfully', 3000);
        resetItemEditor();
        return;
      }

      if (editingItem && !currentRequest) {
        const updatedLocalItem = buildLocalLabRequestDraftItem(itemEditorData, editingItem.id || Date.now());

        setDraftItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updatedLocalItem : item))
        );

        showToast('success', 'Lab request item updated', 3000);
        resetItemEditor();
        return;
      }

      if (currentRequest?.id) {
        await createLabRequestItem.mutateAsync({
          lab_request_id: currentRequest.id,
          ...toLabRequestItemCreatePayload(itemEditorData),
        });

        await refreshRequestWithItems();
        showToast('success', 'Lab request item added successfully', 3000);
        resetItemEditor();
        return;
      }

      const localItem = buildLocalLabRequestDraftItem(itemEditorData, Date.now());
      setDraftItems((prev) => [...prev, localItem]);
      showToast('success', 'Lab request item added. It will be saved when you submit the request.', 4000);
      resetItemEditor();
    } catch (error) {
      console.error('Failed to save lab request item:', error);
      showToast('error', 'Failed to save lab request item', 5000);
    }
  }, [
    createLabRequestItem,
    currentRequest,
    editingItem,
    itemEditorData,
    refreshRequestWithItems,
    resetItemEditor,
    showToast,
    updateLabRequestItem,
  ]);

  const handleDeleteItem = useCallback(
    async (item: LabRequestDraftItem) => {
      const confirmed = await confirm({
        title: currentRequest ? 'Cancel Lab Item' : 'Remove Lab Item',
        message: currentRequest
          ? `Are you sure you want to cancel "${item.display_name}" from this lab request?`
          : `Are you sure you want to remove "${item.display_name}" from this unsaved lab request?`,
        confirmText: currentRequest ? 'Cancel Item' : 'Remove Item',
        cancelText: 'Keep Item',
        variant: 'danger',
        theme,
      });

      if (!confirmed) return;

      try {
        if (currentRequest && item.item_uuid) {
          await cancelItem.mutateAsync({
            uuid: item.item_uuid,
            reason: 'Removed during lab request update',
            cancelledByStaffId: userId || undefined,
          });

          await refreshRequestWithItems();
          showToast('success', 'Lab request item cancelled successfully', 3000);
          return;
        }

        setDraftItems((prev) => prev.filter((draft) => draft.id !== item.id));
        showToast('success', 'Lab request item removed', 3000);
      } catch (error) {
        console.error('Failed to remove/cancel lab request item:', error);
        showToast('error', 'Failed to remove lab request item', 5000);
      }
    },
    [cancelItem, confirm, currentRequest, refreshRequestWithItems, showToast, theme, userId]
  );

  /**
   * --------------------------------------------------------------------------
   * TEMPLATE APPLY FLOW
   * --------------------------------------------------------------------------
   * Template selection can introduce multiple lab items.
   * Only persistable items are allowed into the final payload.
   */
  const handleApplyTemplate = useCallback(
    async (selection: LabTemplateSelectionResult) => {
      const persistableItems = selection.items.filter(isLabRequestDraftItemPersistable);

      if (!persistableItems.length) {
        showToast(
          'error',
          'The selected template did not produce any valid lab items that can be added to a request.',
          5000
        );
        return;
      }

      try {
        if (currentRequest?.request_uuid) {
          await addItemsToRequest.mutateAsync({
            uuid: currentRequest.request_uuid,
            items: persistableItems.map((item) => ({
              lab_test_id: item.lab_test_id as number,
              sample_type: item.sample_type || null,
              notes: item.notes || null,
            })),
          });

          await refreshRequestWithItems();
          showToast(
            'success',
            `Template "${selection.template.name}" applied successfully`,
            4000
          );
        } else {
          setDraftItems((prev) => [...prev, ...persistableItems]);
          showToast(
            'success',
            `Template "${selection.template.name}" applied. Items will be saved when you submit the request.`,
            4000
          );
        }

        setSelectedTemplateForManagement(selection.template);
        setShowTemplateSelector(false);
      } catch (error) {
        console.error('Failed to apply lab template:', error);
        showToast('error', 'Failed to apply lab template', 5000);
      }
    },
    [addItemsToRequest, currentRequest, refreshRequestWithItems, showToast]
  );

  /**
   * --------------------------------------------------------------------------
   * REQUEST SAVE FLOW
   * --------------------------------------------------------------------------
   * - New request: create request with items
   * - Existing request: update details only
   *   item CRUD already occurs from item-level actions
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!facilityId) {
        showToast('error', 'Missing facility information', 5000);
        return;
      }

      if (!patientId) {
        showToast('error', 'Missing patient information', 5000);
        return;
      }

      if (!visitId) {
        showToast('error', 'Missing active visit information', 5000);
        return;
      }

      if (!userId) {
        showToast('error', 'Missing requesting staff information', 5000);
        return;
      }

      if (!formData.priority) {
        showToast('error', 'Request priority is required', 5000);
        return;
      }

      if (draftItems.length === 0) {
        showToast('error', 'Please add at least one lab item to the request', 5000);
        return;
      }

      const unresolvedItems = draftItems.filter((item) => !isLabRequestDraftItemPersistable(item));
      if (unresolvedItems.length > 0) {
        showToast(
          'error',
          'Some selected items are not yet mapped to valid lab items. Resolve them before submitting the request.',
          6000
        );
        return;
      }

      setIsSubmitting(true);

      try {
        if (currentRequest?.request_uuid) {
          const result = await updateLabRequest.mutateAsync({
            uuid: currentRequest.request_uuid,
            data: {
              visit_id: visitNumericId,
              patient_id: patientNumericId,
              facility_id: facilityId,
              requested_by_staff_id: userId,
              priority: formData.priority,
              clinical_notes: formData.clinical_notes || null,
              diagnosis_context: buildDiagnosisContextPayload(formData),
              metadata: {
                source: 'lab-request-form',
                context: 'active-visit',
              },
            },
          });

          if (result.success) {
            await refreshRequestWithItems();
            setIsDetailsEditorOpen(false);
            showToast('success', 'Lab request updated successfully', 5000);
            onSuccess?.(result.data.id);
          }

          return;
        }

        const createPayload: CreateLabRequestWithItemsRequest = {
          visit_id: visitNumericId,
          patient_id: patientNumericId,
          facility_id: facilityId,
          requested_by_staff_id: userId,
          priority: formData.priority,
          clinical_notes: formData.clinical_notes || null,
          diagnosis_context: buildDiagnosisContextPayload(formData),
          metadata: {
            source: 'lab-request-form',
            context: 'active-visit',
          },
          items: draftItems
            .filter(isLabRequestDraftItemPersistable)
            .map((item) => ({
              lab_test_id: item.lab_test_id as number,
              sample_type: item.sample_type || null,
              notes: item.notes || null,
            })),
        };

        const result = await createLabRequestWithItems.mutateAsync(createPayload);

        if (result.success) {
          setCreatedRequestUuid(result.data.request_uuid);
          setIsDetailsEditorOpen(false);

          await queryClient.invalidateQueries({
            queryKey: labKeys.requestByVisit(visitNumericId),
          });

          showToast('success', 'Lab request created successfully', 5000);
          onSuccess?.(result.data.id);
        }
      } catch (error) {
        console.error('Failed to save lab request:', error);
        showToast('error', 'Failed to save lab request', 5000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      createLabRequestWithItems,
      currentRequest,
      draftItems,
      facilityId,
      formData,
      onSuccess,
      patientId,
      patientNumericId,
      queryClient,
      refreshRequestWithItems,
      showToast,
      updateLabRequest,
      userId,
      visitId,
      visitNumericId,
    ]
  );

  const handleCancelCurrentRequest = useCallback(async () => {
    if (!currentRequest?.request_uuid) return;

    const confirmed = await confirm({
      title: 'Cancel Lab Request',
      message: 'Are you sure you want to cancel this lab request?',
      confirmText: 'Cancel Request',
      cancelText: 'Keep Request',
      variant: 'danger',
      theme,
    });

    if (!confirmed) return;

    try {
      await cancelLabRequest.mutateAsync({
        uuid: currentRequest.request_uuid,
        reason: 'Cancelled from lab request form',
        cancelledByStaffId: userId || undefined,
      });

      await refreshAllData();
      showToast('success', 'Lab request cancelled successfully', 5000);
      onCancel?.();
    } catch (error) {
      console.error('Failed to cancel lab request:', error);
      showToast('error', 'Failed to cancel lab request', 5000);
    }
  }, [cancelLabRequest, confirm, currentRequest, onCancel, refreshAllData, showToast, theme, userId]);

  /**
   * --------------------------------------------------------------------------
   * LOADING / CONTEXT GUARDS
   * --------------------------------------------------------------------------
   */
  const isLoadingInitial =
    visitRequestsQuery.isLoading ||
    (!!currentRequestUuid && currentRequestQuery.isLoading);

  if (isLoadingInitial) {
    return (
      <div className="p-6">
        <LoadingSkeleton
          variant="dashboard"
          theme={isDark ? 'dark' : 'light'}
          message="Loading lab request data..."
        />
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="p-6">
        <div className={cn('rounded-xl border p-6 text-center', colors.border.primary, colors.bg.card)}>
          <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', colors.bg.muted)}>
            <User className={cn('h-6 w-6', colors.text.secondary)} />
          </div>
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>
            No active patient selected
          </h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Open this form from an active visit to create or edit a lab request.
          </p>
          {onCancel && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                <X className="h-4 w-4" /> Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!facilityId) {
    return (
      <div className="p-6">
        <div className={cn('rounded-xl border p-6 text-center', colors.border.primary, colors.bg.card)}>
          <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', colors.bg.muted)}>
            <Building2 className={cn('h-6 w-6', colors.text.secondary)} />
          </div>
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>
            No facility selected
          </h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Please select a facility before creating or editing a lab request.
          </p>
          {onCancel && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                <X className="h-4 w-4" /> Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /**
   * --------------------------------------------------------------------------
   * RENDER
   * --------------------------------------------------------------------------
   */
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="p-6"
    >
      <LabRequestHeader
        isDark={isDark}
        colors={colors}
        request={currentRequest}
        onOpenTemplateSelector={() => setShowTemplateSelector(true)}
        onOpenTemplateManager={() => setShowTemplateManager(true)}
        onOpenTemplateFieldManager={() => setShowTemplateFieldManager(true)}
        onOpenLabItemManager={() => setShowLabItemManager(true)}
        onAddItem={openAddItemModal}
        onRefresh={refreshAllData}
        isRefreshing={isManualRefreshing}
      />

      <LabRequestContextBanner
        isDark={isDark}
        colors={colors}
        facilityId={facilityId}
        patientId={patientNumericId}
        visitId={visitNumericId}
        requestedByStaffId={userId || null}
        request={currentRequest}
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <LabRequestDetailsCard
            isDark={isDark}
            colors={colors}
            request={currentRequest}
            formData={formData}
            isEditorOpen={isDetailsEditorOpen}
            onOpenEditor={() => setIsDetailsEditorOpen(true)}
            onCloseEditor={() => setIsDetailsEditorOpen(false)}
            onChange={handleFormChange}
            onCancelRequest={handleCancelCurrentRequest}
            isCancellingRequest={cancelLabRequest.isPending}
          />

          <LabRequestItemsTable
            isDark={isDark}
            colors={colors}
            request={currentRequest}
            items={draftItems}
            onAddItem={openAddItemModal}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onManageLabItems={() => setShowLabItemManager(true)}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                colors.bg.hover,
                colors.text.secondary
              )}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isMutating || isSubmitting || draftItems.length === 0}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
              isMutating || isSubmitting || draftItems.length === 0
                ? 'cursor-not-allowed bg-gray-400'
                : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {currentRequest ? 'Save Lab Request Updates' : 'Create Lab Request'}
          </button>
        </div>
      </form>

           <LabRequestItemEditorModal
        open={showItemEditorModal}
        isDark={isDark}
        colors={colors}
        editingItem={editingItem}
        formData={itemEditorData}
        isMutating={isMutating}
        templates={templatesQuery.data?.data || []}
        labItems={labItemsQuery.data?.data?.data || []}
        popularLabItems={popularLabItemsQuery.data?.data || []}
        onClose={resetItemEditor}
        onChange={handleItemEditorChange}
        onOpenTemplateManager={() => setShowTemplateManager(true)}
        onOpenLabItemManager={() => setShowLabItemManager(true)}
        onSubmit={handleSaveItem}
      />

      <LabTemplateSelectorModal
        open={showTemplateSelector}
        isDark={isDark}
        colors={colors}
        templates={templatesQuery.data?.data || []}
        labItems={labItemsQuery.data?.data?.data || []}
        onClose={() => setShowTemplateSelector(false)}
        onApplyTemplate={handleApplyTemplate}
        onManageTemplates={() => setShowTemplateManager(true)}
        onManageTemplateFields={(template) => {
          setSelectedTemplateForManagement(template);
          setShowTemplateFieldManager(true);
        }}
        onManageLabItems={() => setShowLabItemManager(true)}
      />

      <LabTemplateManagerModal
        open={showTemplateManager}
        isDark={isDark}
        colors={colors}
        selectedTemplate={selectedTemplateForManagement}
        templates={templatesQuery.data?.data || []}
        onClose={() => setShowTemplateManager(false)}
        onSelectTemplate={(template) => setSelectedTemplateForManagement(template)}
        onManageFields={(template) => {
          setSelectedTemplateForManagement(template);
          setShowTemplateFieldManager(true);
        }}
      />

      <LabTemplateFieldManagerModal
        open={showTemplateFieldManager}
        isDark={isDark}
        colors={colors}
        selectedTemplate={selectedTemplateForManagement}
        templates={templatesQuery.data?.data || []}
        onClose={() => setShowTemplateFieldManager(false)}
        onSelectTemplate={(template) => setSelectedTemplateForManagement(template)}
      />

      <LabItemManagerModal
        open={showLabItemManager}
        isDark={isDark}
        colors={colors}
        selectedLabItem={selectedLabItemForManagement}
        templates={templatesQuery.data?.data || []}
        labItems={labItemsQuery.data?.data?.data || []}
        popularLabItems={popularLabItemsQuery.data?.data || []}
        onClose={() => setShowLabItemManager(false)}
        onSelectLabItem={(item) => setSelectedLabItemForManagement(item)}
      />
    </motion.div>
  );
};

export default LabRequestForm;
