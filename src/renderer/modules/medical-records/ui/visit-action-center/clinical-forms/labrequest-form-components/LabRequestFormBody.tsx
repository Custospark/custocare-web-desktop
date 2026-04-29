import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Save, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';

import type {
  CreateLabRequestWithItemsRequest,
  LabRequestPriority,
  LabTemplate,
} from '../../../../api/lab/LabTypes';
import { labKeys, useAddItemsToRequest, useCancelItem, useCancelLabRequest, useCreateLabRequestItem, useCreateLabRequestWithItems, useUpdateLabRequest, useUpdateLabRequestItem } from '../../../../api/lab/LabQueries';

import LabRequestHeader from './LabRequestHeader';
import LabRequestDetailsCard from './LabRequestDetailsCard';
import LabRequestItemsTable from './LabRequestItemsTable';
import { LabRequestStateGuard } from './LabRequestStateGuard';
import { LabRequestItemEditorController } from './LabRequestItemEditorController';
import { LabRequestManagementModals } from './LabRequestManagementModals';
import { useLabRequestResolvedRequest } from './LabRequestResolvedRequestScope';
import { useLabRequestReferenceData } from './LabRequestReferenceDataScope';
import type {
  ColorTokens,
  LabRequestDraftItem,
  LabRequestFormData,
  LabRequestItemEditorData,
  LabTemplateSelectionResult,
} from './labRequestForm.types';
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
} from './labRequestForm.types';

interface LabRequestFormBodyProps {
  theme: 'light' | 'dark';
  isDark: boolean;
  colors: ColorTokens;
  facilityId: number | null;
  patientId: number | null;
  visitId: number | null ;
  staffId: number | null | undefined;
  patientNumericId: number;
  visitNumericId: number;
  onCancel?: () => void;
  onSuccess?: (requestId: number) => void;
  setCreatedRequestUuid: React.Dispatch<React.SetStateAction<string | null>>;
}

export const LabRequestFormBody: React.FC<LabRequestFormBodyProps> = ({
  theme,
  isDark,
  colors,
  facilityId,
  patientId,
  visitId,
  staffId,
  patientNumericId,
  visitNumericId,
  onCancel,
  onSuccess,
  setCreatedRequestUuid,
}) => {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const {
    currentRequest,
    currentRequestUuid,
    isLoadingInitial,
    refetchVisitRequests,
    refetchCurrentRequest,
  } = useLabRequestResolvedRequest();

  const { templates, labItems, popularLabItems, refetchReferenceData } =
    useLabRequestReferenceData();

  const [formData, setFormData] = useState<LabRequestFormData>(EMPTY_LAB_REQUEST);
  const [localDraftItems, setLocalDraftItems] = useState<LabRequestDraftItem[]>([]);
  const [editingItem, setEditingItem] = useState<LabRequestDraftItem | null>(null);
  const [itemEditorData, setItemEditorData] =
    useState<LabRequestItemEditorData>(EMPTY_LAB_REQUEST_ITEM);

  const [isDetailsEditorOpen, setIsDetailsEditorOpen] = useState(false);
  const [showItemEditorModal, setShowItemEditorModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showTemplateFieldManager, setShowTemplateFieldManager] = useState(false);
  const [showLabItemManager, setShowLabItemManager] = useState(false);

  const [selectedTemplateUuid, setSelectedTemplateUuid] = useState<string | null>(null);
  const [selectedLabItemUuid, setSelectedLabItemUuid] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const displayItems = useMemo<LabRequestDraftItem[]>(() => {
    if (currentRequest) {
      return toLabRequestDraftItems(currentRequest.items || []);
    }

    return localDraftItems;
  }, [currentRequest, localDraftItems]);

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

  useEffect(() => {
    if (currentRequest) {
      setFormData(toLabRequestFormData(currentRequest));
      setLocalDraftItems([]);
    }
  }, [currentRequest]);

  const refreshRequestData = useCallback(
    async (requestUuidOverride?: string | null) => {
      const targetRequestUuid = requestUuidOverride ?? currentRequestUuid;

      await queryClient.invalidateQueries({ queryKey: labKeys.requests() });
      await queryClient.invalidateQueries({ queryKey: labKeys.items() });

      if (visitNumericId) {
        await queryClient.invalidateQueries({
          queryKey: labKeys.requestByVisit(visitNumericId),
        });
      }

      if (targetRequestUuid) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: labKeys.requestDetail(targetRequestUuid),
          }),
          queryClient.invalidateQueries({
            queryKey: labKeys.requestWithItems(targetRequestUuid),
          }),
          queryClient.invalidateQueries({
            queryKey: labKeys.requestWithFullDetails(targetRequestUuid),
          }),
          queryClient.invalidateQueries({
            queryKey: labKeys.itemByLabRequest(targetRequestUuid),
          }),
        ]);
      }

      await Promise.all([
        visitNumericId ? refetchVisitRequests() : Promise.resolve(),
        targetRequestUuid === currentRequestUuid && targetRequestUuid
          ? refetchCurrentRequest()
          : Promise.resolve(),
        targetRequestUuid
          ? queryClient.refetchQueries({
              queryKey: labKeys.requestWithFullDetails(targetRequestUuid),
              exact: true,
              type: 'active',
            })
          : Promise.resolve(),
        targetRequestUuid
          ? queryClient.refetchQueries({
              queryKey: labKeys.itemByLabRequest(targetRequestUuid),
              exact: true,
              type: 'active',
            })
          : Promise.resolve(),
      ]);
    },
    [
      currentRequestUuid,
      queryClient,
      refetchCurrentRequest,
      refetchVisitRequests,
      visitNumericId,
    ]
  );

  const syncAllVisibleLabData = useCallback(
    async (options?: {
      requestUuid?: string | null;
      includeReferenceData?: boolean;
      includeRequestData?: boolean;
      toastMessage?: string;
    }) => {
      const {
        requestUuid,
        includeReferenceData = true,
        includeRequestData = true,
        toastMessage,
      } = options || {};

      await queryClient.invalidateQueries({ queryKey: labKeys.all() });

      if (includeReferenceData) {
        await queryClient.invalidateQueries({ queryKey: labKeys.templates() });
        await queryClient.invalidateQueries({ queryKey: labKeys.tests() });
        await queryClient.invalidateQueries({ queryKey: labKeys.fields() });
        await refetchReferenceData();
      }

      if (includeRequestData) {
        await refreshRequestData(requestUuid);
      }

      if (toastMessage) {
        showToast('success', toastMessage, 2500);
      }
    },
    [queryClient, refetchReferenceData, refreshRequestData, showToast]
  );

  const handleManualRefresh = useCallback(async () => {
    setIsManualRefreshing(true);

    try {
      await syncAllVisibleLabData({
        toastMessage: 'Lab request data refreshed',
      });
    } catch (error) {
      console.error('Failed to refresh lab request data:', error);
      showToast('error', 'Failed to refresh lab request data', 3000);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [showToast, syncAllVisibleLabData]);

  const refreshReferenceDataSafely = useCallback(
    async (errorMessage: string) => {
      try {
        await refetchReferenceData();
      } catch (error) {
        console.error(errorMessage, error);
      }
    },
    [refetchReferenceData]
  );

  const resetItemEditor = useCallback(() => {
    setItemEditorData(EMPTY_LAB_REQUEST_ITEM);
    setEditingItem(null);
    setShowItemEditorModal(false);
  }, []);

  const openAddItemModal = useCallback(async () => {
    await refreshReferenceDataSafely(
      'Failed to refresh reference data before opening item modal:'
    );
    setItemEditorData(EMPTY_LAB_REQUEST_ITEM);
    setEditingItem(null);
    setShowItemEditorModal(true);
  }, [refreshReferenceDataSafely]);

  const handleOpenTemplateSelector = useCallback(async () => {
    setShowTemplateSelector(true);
    await refreshReferenceDataSafely(
      'Failed to refresh templates before opening selector:'
    );
  }, [refreshReferenceDataSafely]);

  const handleOpenTemplateManager = useCallback(async () => {
    await refreshReferenceDataSafely(
      'Failed to refresh templates before opening manager:'
    );
    setShowTemplateManager(true);
  }, [refreshReferenceDataSafely]);

  const handleOpenTemplateFieldManager = useCallback(
    async (template?: LabTemplate | null) => {
      await refreshReferenceDataSafely(
        'Failed to refresh reference data before opening field manager:'
      );
      if (template) {
        setSelectedTemplateUuid(template.template_uuid);
      }
      setShowTemplateFieldManager(true);
    },
    [refreshReferenceDataSafely]
  );

  const handleOpenLabItemManager = useCallback(async () => {
    await refreshReferenceDataSafely(
      'Failed to refresh lab tests before opening manager:'
    );
    setShowLabItemManager(true);
  }, [refreshReferenceDataSafely]);

  const handleFormChange = useCallback(
    (field: keyof LabRequestFormData, value: string | LabRequestPriority) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleItemEditorChange = useCallback(
    (
      field: keyof LabRequestItemEditorData,
      value: string | number | boolean | null
    ) => {
      setItemEditorData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );


  const handleSaveItem = useCallback(async () => {
  console.log('🔍 Saving item with data:', itemEditorData);

  if (!itemEditorData.display_name.trim()) {
    showToast('error', 'Lab Test name is required', 3000);
    return;
  }

  if (!itemEditorData.lab_test_id) {
    console.error('❌ No lab_test_id found in:', itemEditorData);
    showToast(
      'error',
      'Please select a lab test from the catalog before adding it to the request.',
      5000
    );
    return;
  }

  try {
    // Case 1: Editing existing item in an existing request
    if (editingItem && currentRequest?.id && editingItem.item_uuid) {
      console.log('📝 Updating existing item in request');
      await updateLabRequestItem.mutateAsync({
        uuid: editingItem.item_uuid,
        data: toLabRequestItemUpdatePayload(itemEditorData, currentRequest.id),
      });

      // Force refresh the request data
      await refreshRequestData(currentRequest.request_uuid);
      await refetchCurrentRequest();
      
      showToast('success', 'Lab test updated successfully', 3000);
      resetItemEditor();
      return;
    }

    // Case 2: Editing existing local draft item (no request yet)
    if (editingItem && !currentRequest) {
      console.log('📝 Updating local draft item');
      const updatedLocalItem = buildLocalLabRequestDraftItem(
        itemEditorData,
        editingItem.id || Date.now()
      );

      setLocalDraftItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? updatedLocalItem : item
        )
      );

      showToast('success', 'Lab test updated successfully', 3000);
      resetItemEditor();
      return;
    }

    // Case 3: Adding new item to existing request via API
    if (currentRequest?.id) {
      console.log('➕ Adding new item to existing request via API');
      console.log('Request ID:', currentRequest.id);
      
      const createPayload = toLabRequestItemCreatePayload(itemEditorData);
      console.log('Create payload:', createPayload);
      
      // Create the item
      await createLabRequestItem.mutateAsync({
        lab_request_id: currentRequest.id,
        ...createPayload,
      });
      
      console.log('✅ Item created, refreshing data...');
      
      // Force immediate refresh of the request data
      // Use multiple methods to ensure data is refreshed
      await Promise.all([
        // Invalidate all relevant queries
        queryClient.invalidateQueries({ 
          queryKey: labKeys.requestWithItems(currentRequest.request_uuid) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: labKeys.requestDetail(currentRequest.request_uuid) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: labKeys.requestWithFullDetails(currentRequest.request_uuid) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: labKeys.itemByLabRequest(currentRequest.request_uuid) 
        }),
        // Refresh the current request
        refetchCurrentRequest(),
        // Refresh visit requests if needed
        visitNumericId ? refetchVisitRequests() : Promise.resolve(),
      ]);
      
      // Explicitly refetch the request with items
      await queryClient.refetchQueries({
        queryKey: labKeys.requestWithItems(currentRequest.request_uuid),
        exact: true,
        type: 'active',
      });
      
      console.log('✅ Data refresh complete');
      showToast('success', 'Lab test added successfully!', 3000);
      resetItemEditor();
      return;
    }

    // Case 4: Adding new item to local draft (new request)
    console.log('📝 Adding new item to local draft (new request)');
    const localItem = buildLocalLabRequestDraftItem(itemEditorData, Date.now());
    console.log('Local item created:', localItem);
    setLocalDraftItems((prev) => [...prev, localItem]);
    
    showToast(
      'success',
      'Lab test added. It will be saved when you submit the request.',
      4000
    );
    resetItemEditor();
    
  } catch (error: any) {
    console.error('❌ Failed to save lab request item:', error);
    console.error('Error details:', error.response?.data || error.message);
    showToast(
      'error', 
      error.response?.data?.message || 'Failed to save lab test. Please try again.',
      5000
    );
  }
}, [
  createLabRequestItem,
  currentRequest,
  editingItem,
  itemEditorData,
  queryClient,
  refetchCurrentRequest,
  refetchVisitRequests,
  refreshRequestData,
  resetItemEditor,
  showToast,
  updateLabRequestItem,
  visitNumericId,
]);

  

  const handleApplyTemplate = useCallback(
    async (selection: LabTemplateSelectionResult) => {
      const persistableItems = selection.items.filter(
        isLabRequestDraftItemPersistable
      );

      if (!persistableItems.length) {
        showToast(
          'error',
          'The selected template did not produce any valid lab tests that can be added to a request.',
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

          await syncAllVisibleLabData({
            requestUuid: currentRequest.request_uuid,
            includeReferenceData: true,
            includeRequestData: true,
          });
        } else {
          setLocalDraftItems((prev) => [...prev, ...persistableItems]);
        }

        setSelectedTemplateUuid(selection.template.template_uuid);
        setShowTemplateSelector(false);
      } catch (error) {
        console.error('Failed to apply lab template:', error);
        showToast('error', 'Failed to apply lab template', 5000);
      }
    },
    [addItemsToRequest, currentRequest, showToast, syncAllVisibleLabData]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
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

      if (!staffId) {
        showToast('error', 'Missing requesting staff information', 5000);
        return;
      }

      if (!formData.priority) {
        showToast('error', 'Request priority is required', 5000);
        return;
      }

      if (displayItems.length === 0) {
        showToast('error', 'Please add at least one Lab Test to the request', 5000);
        return;
      }

      const unresolvedItems = displayItems.filter(
        (item) => !isLabRequestDraftItemPersistable(item)
      );
      if (unresolvedItems.length > 0) {
        showToast(
          'error',
          'Some selected items are not yet mapped to valid Lab Tests. Resolve them before submitting the request.',
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
              requested_by_staff_id: staffId,
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
            await syncAllVisibleLabData({
              requestUuid: currentRequest.request_uuid,
              includeReferenceData: true,
              includeRequestData: true,
            });

            setIsDetailsEditorOpen(false);
            onSuccess?.(result.data.id);
          }

          return;
        }

        const createPayload: CreateLabRequestWithItemsRequest = {
          visit_id: visitNumericId,
          patient_id: patientNumericId,
          facility_id: facilityId,
          requested_by_staff_id: staffId,
          priority: formData.priority,
          clinical_notes: formData.clinical_notes || null,
          diagnosis_context: buildDiagnosisContextPayload(formData),
          metadata: {
            source: 'lab-request-form',
            context: 'active-visit',
          },
          items: displayItems
            .filter(isLabRequestDraftItemPersistable)
            .map((item) => ({
              lab_test_id: item.lab_test_id as number,
              sample_type: item.sample_type || null,
              notes: item.notes || null,
            })),
        };

        const result = await createLabRequestWithItems.mutateAsync(createPayload);

        if (result.success) {
          const newRequestUuid = result.data.request_uuid;

          setCreatedRequestUuid(newRequestUuid);
          setLocalDraftItems([]);
          setIsDetailsEditorOpen(false);

          await syncAllVisibleLabData({
            requestUuid: newRequestUuid,
            includeReferenceData: true,
            includeRequestData: true,
          });

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
      displayItems,
      facilityId,
      formData,
      onSuccess,
      patientId,
      patientNumericId,
      setCreatedRequestUuid,
      showToast,
      staffId,
      syncAllVisibleLabData,
      updateLabRequest,
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
        cancelledByStaffId: staffId || undefined,
      });

      await syncAllVisibleLabData({
        requestUuid: currentRequest.request_uuid,
        includeReferenceData: true,
        includeRequestData: true,
      });

      onCancel?.();
    } catch (error) {
      console.error('Failed to cancel lab request:', error);
      showToast('error', 'Failed to cancel lab request', 5000);
    }
  }, [
    cancelLabRequest,
    confirm,
    currentRequest,
    onCancel,
    showToast,
    staffId,
    syncAllVisibleLabData,
    theme,
  ]);

  return (
    <LabRequestStateGuard
      isLoading={isLoadingInitial}
      isDark={isDark}
      colors={colors}
      patientId={patientId}
      facilityId={facilityId}
      onCancel={onCancel}
    >
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
          onOpenTemplateSelector={handleOpenTemplateSelector}
          onOpenTemplateManager={handleOpenTemplateManager}
          onOpenTemplateFieldManager={() => handleOpenTemplateFieldManager()}
          onOpenLabItemManager={handleOpenLabItemManager}
          onAddItem={openAddItemModal}
          onRefresh={handleManualRefresh}
          isRefreshing={isManualRefreshing}
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
              onCloseEditor={() => {
                if (currentRequest) {
                  setFormData(toLabRequestFormData(currentRequest));
                }
                setIsDetailsEditorOpen(false);
              }}
              onChange={handleFormChange}
              onCancelRequest={handleCancelCurrentRequest}
              isCancellingRequest={cancelLabRequest.isPending}
            />

            <LabRequestItemsTable
                isDark={isDark}
                colors={colors}
                request={currentRequest}
                staffId={staffId}
                onAddItem={openAddItemModal}
                onManageLabItems={handleOpenLabItemManager}
                onRequestUpdate={refreshRequestData}
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
              disabled={isMutating || isSubmitting || displayItems.length === 0}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                isMutating || isSubmitting || displayItems.length === 0
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
              )}
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {currentRequest ? 'Save Lab Request Updates' : 'Create Lab Request'}
            </button>
          </div>
        </form>

        <LabRequestItemEditorController
          open={showItemEditorModal}
          isDark={isDark}
          colors={colors}
          editingItem={editingItem}
          formData={itemEditorData}
          isMutating={isMutating}
          templates={templates}
          labItems={labItems}
          popularLabItems={popularLabItems}
          onClose={resetItemEditor}
          onChange={handleItemEditorChange}
          onOpenTemplateManager={handleOpenTemplateManager}
          onOpenLabItemManager={handleOpenLabItemManager}
          onSubmit={handleSaveItem}
        />

        <LabRequestManagementModals
          openTemplateSelector={showTemplateSelector}
          openTemplateManager={showTemplateManager}
          openTemplateFieldManager={showTemplateFieldManager}
          openLabItemManager={showLabItemManager}
          isDark={isDark}
          colors={colors}
          templates={templates}
          labItems={labItems}
          popularLabItems={popularLabItems}
          selectedTemplateUuid={selectedTemplateUuid}
          selectedLabItemUuid={selectedLabItemUuid}
          onSelectTemplateUuid={setSelectedTemplateUuid}
          onSelectLabItemUuid={setSelectedLabItemUuid}
          onCloseTemplateSelector={() => setShowTemplateSelector(false)}
          onCloseTemplateManager={async () => {
            setShowTemplateManager(false);
            await refreshReferenceDataSafely(
              'Failed to refresh templates after closing manager:'
            );
          }}
          onCloseTemplateFieldManager={async () => {
            setShowTemplateFieldManager(false);
            await refreshReferenceDataSafely(
              'Failed to refresh template field data after closing manager:'
            );
          }}
          onCloseLabItemManager={async () => {
            setShowLabItemManager(false);
            await refreshReferenceDataSafely(
              'Failed to refresh lab test data after closing manager:'
            );
          }}
          onApplyTemplate={handleApplyTemplate}
          onOpenTemplateManager={handleOpenTemplateManager}
          onOpenLabItemManager={handleOpenLabItemManager}
          onOpenTemplateFieldManager={(template) => {
            setSelectedTemplateUuid(template.template_uuid);
            setShowTemplateFieldManager(true);
          }}
        />
      </motion.div>
    </LabRequestStateGuard>
  );
};