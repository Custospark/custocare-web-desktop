import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, RefreshCw, Save, User, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { cn } from '../../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId, getUserId } from '../../../../../app/store/utils/contextSelectors';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../../app/store/rootReducer';
import {
  labKeys,
  useAddItemsToRequest,
  useCancelItem,
  useCreateLabRequestWithItems,
  useGetRequestWithItems,
  useUpdateLabRequest,
  useUpdateLabRequestItem,
} from '../../../api/lab/LabQueries';
import type { LabRequest } from '../../../api/lab/LabTypes';
import type { LabTest } from '../../../api/lab/LabTypes';
import LabRequestDetailsCard from './labrequest-form-components/LabRequestDetailsCard';
import LabRequestHeader from './labrequest-form-components/LabRequestHeader';
import LabRequestTestsCard from './labrequest-form-components/LabRequestTestsCard';
import LabTestEditorModal from './labrequest-form-components/LabTestEditorModal';
import type { ColorTokens, LabRequestFormData, LabRequestTestFormData } from './labrequest-form-components/labRequestForm.types';
import {
  EMPTY_LAB_REQUEST,
  EMPTY_LAB_REQUEST_TEST,
  applySelectedLabTest,
  buildDiagnosisContext,
  buildLocalLabRequestTest,
  toCreateLabRequestPayload,
  toLabRequestFormData,
  toLabRequestTestFormData,
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

  // Extract request context exactly the same way PrescriptionForm does it.
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const patientId = useSelector((state: RootState) => selectActiveVisitPatientId(state));
  const visitId = useSelector((state: RootState) => selectActiveVisitId(state));
  const userId = useSelector((state: RootState) => getUserId(state));

  const [createdRequestUuid, setCreatedRequestUuid] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [formData, setFormData] = useState<LabRequestFormData>(EMPTY_LAB_REQUEST);
  const [tests, setTests] = useState<LabRequestTestFormData[]>([]);
  const [editingTest, setEditingTest] = useState<LabRequestTestFormData | null>(null);
  const [testForm, setTestForm] = useState<LabRequestTestFormData>(EMPTY_LAB_REQUEST_TEST);
  const [isDetailsEditorOpen, setIsDetailsEditorOpen] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentRequestUuid = createdRequestUuid || existingRequest?.request_uuid || null;

  const currentRequestQuery = useGetRequestWithItems(currentRequestUuid ?? '', {
    enabled: !!currentRequestUuid,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const currentRequest = currentRequestQuery.data?.data || existingRequest || null;

  const createLabRequestWithItems = useCreateLabRequestWithItems();
  const updateLabRequest = useUpdateLabRequest();
  const addItemsToRequest = useAddItemsToRequest();
  const updateLabRequestItem = useUpdateLabRequestItem();
  const cancelItem = useCancelItem();

  const isMutating =
    createLabRequestWithItems.isPending ||
    updateLabRequest.isPending ||
    addItemsToRequest.isPending ||
    updateLabRequestItem.isPending ||
    cancelItem.isPending;

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
    [isDark],
  );

  useEffect(() => {
    if (currentRequest) {
      setFormData(toLabRequestFormData(currentRequest));
      setTests((currentRequest.items ?? []).map(toLabRequestTestFormData));
    }
  }, [currentRequest]);

  const refreshAllData = useCallback(async () => {
    if (!currentRequestUuid) return;

    setIsManualRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: labKeys.requestWithItems(currentRequestUuid) });
      await queryClient.invalidateQueries({ queryKey: labKeys.requests() });
      await queryClient.refetchQueries({ queryKey: labKeys.requestWithItems(currentRequestUuid) });
      showToast('success', 'Lab request data refreshed', 2000);
    } catch (error) {
      console.error('Failed to refresh lab request data:', error);
      showToast('error', 'Failed to refresh lab request data', 3000);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [currentRequestUuid, queryClient, showToast]);

  const refreshVisitRequests = useCallback(async () => {
    if (!visitId) return;
    await queryClient.invalidateQueries({ queryKey: labKeys.requestByVisit(Number(visitId)) });
    await queryClient.invalidateQueries({ queryKey: labKeys.requests() });
  }, [visitId, queryClient]);

  const handleFormChange = useCallback(
    (field: keyof LabRequestFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value as LabRequestFormData[typeof field] }));
    },
    [],
  );

  const handleTestFormChange = useCallback(
    (field: keyof LabRequestTestFormData, value: string | number | boolean) => {
      setTestForm((prev) => ({ ...prev, [field]: value as LabRequestTestFormData[typeof field] }));
    },
    [],
  );

  const resetTestEditor = useCallback(() => {
    setEditingTest(null);
    setTestForm(EMPTY_LAB_REQUEST_TEST);
    setShowTestModal(false);
  }, []);

  const openAddTestModal = useCallback(() => {
    setEditingTest(null);
    setTestForm({ ...EMPTY_LAB_REQUEST_TEST, local_id: Date.now() });
    setShowTestModal(true);
  }, []);

  const handleSelectLabTest = useCallback((labTest: LabTest) => {
    setTestForm((prev) => applySelectedLabTest(prev, labTest));
  }, []);

  const editTestHandler = useCallback((item: LabRequestTestFormData) => {
    setEditingTest(item);
    setTestForm(item);
    setShowTestModal(true);
  }, []);

  const saveTest = useCallback(async () => {
    if (!testForm.lab_test_id || !testForm.test_name.trim()) {
      showToast('error', 'Please select a lab test', 3000);
      return;
    }

    try {
      if (editingTest?.is_existing && currentRequest?.request_uuid && editingTest.item_uuid) {
        await updateLabRequestItem.mutateAsync({
          uuid: editingTest.item_uuid,
          data: {
            lab_test_id: testForm.lab_test_id,
            sample_type: testForm.sample_type.trim() || null,
            notes: testForm.notes.trim() || null,
          },
        });
        await refreshAllData();
      } else if (!editingTest?.is_existing && currentRequest?.request_uuid) {
        await addItemsToRequest.mutateAsync({
          uuid: currentRequest.request_uuid,
          items: [
            {
              lab_test_id: testForm.lab_test_id,
              sample_type: testForm.sample_type.trim() || null,
              notes: testForm.notes.trim() || null,
            },
          ],
        });
        await refreshAllData();
      } else if (editingTest) {
        setTests((prev) =>
          prev.map((item) =>
            item.local_id === editingTest.local_id ? { ...buildLocalLabRequestTest(testForm), local_id: editingTest.local_id } : item,
          ),
        );
      } else {
        setTests((prev) => [...prev, buildLocalLabRequestTest(testForm)]);
      }

      resetTestEditor();
      showToast('success', editingTest ? 'Test updated successfully' : 'Test added successfully', 3000);
    } catch (error) {
      console.error('Failed to save requested test:', error);
      showToast('error', 'Failed to save requested test', 5000);
    }
  }, [
    addItemsToRequest,
    currentRequest,
    editingTest,
    refreshAllData,
    resetTestEditor,
    showToast,
    testForm,
    updateLabRequestItem,
  ]);

  const deleteTestHandler = useCallback(
    async (item: LabRequestTestFormData) => {
      const confirmed = await confirm({
        title: 'Remove Requested Test',
        message: `Are you sure you want to remove "${item.test_name}" from this lab request?`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!confirmed) return;

      try {
        if (currentRequest?.request_uuid && item.item_uuid) {
          await cancelItem.mutateAsync({
            uuid: item.item_uuid,
            reason: 'Removed from request before processing',
          });
          await refreshAllData();
        } else {
          setTests((prev) => prev.filter((entry) => entry.local_id !== item.local_id));
        }

        showToast('success', 'Requested test removed', 3000);
      } catch (error) {
        console.error('Failed to remove requested test:', error);
        showToast('error', 'Failed to remove requested test', 5000);
      }
    },
    [cancelItem, confirm, currentRequest, refreshAllData, showToast, theme],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!facilityId || !patientId || !visitId) {
        showToast('error', 'Missing facility, patient, or visit information', 5000);
        return;
      }

      if (tests.length === 0) {
        showToast('error', 'Please add at least one lab test', 5000);
        return;
      }

      setIsSubmitting(true);

      try {
        if (currentRequest?.request_uuid) {
          const result = await updateLabRequest.mutateAsync({
            uuid: currentRequest.request_uuid,
            data: {
              visit_id: Number(visitId),
              patient_id: Number(patientId),
              facility_id: Number(facilityId),
              requested_by_staff_id: userId ?? null,
              priority: formData.priority,
              clinical_notes: formData.clinical_notes.trim() || null,
              diagnosis_context: buildDiagnosisContext(formData),
            },
          });

          await refreshAllData();
          await refreshVisitRequests();
          showToast('success', 'Lab request updated successfully', 5000);
          onSuccess?.(result.data.id);
        } else {
          const payload = toCreateLabRequestPayload({
            form: formData,
            tests,
            facilityId: Number(facilityId),
            patientId: Number(patientId),
            visitId: Number(visitId),
            userId,
          });

          const result = await createLabRequestWithItems.mutateAsync(payload);
          setCreatedRequestUuid(result.data.request_uuid);
          await refreshVisitRequests();
          showToast('success', 'Lab request created successfully', 5000);
          onSuccess?.(result.data.id);
        }

        setIsDetailsEditorOpen(false);
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
      facilityId,
      formData,
      onSuccess,
      patientId,
      refreshAllData,
      refreshVisitRequests,
      showToast,
      tests,
      updateLabRequest,
      userId,
      visitId,
    ],
  );

  if (currentRequestUuid && currentRequestQuery.isLoading) {
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
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>No active patient selected</h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Open this form from an active visit to create or edit a lab request.
          </p>
          {onCancel && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onCancel}
                className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}
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
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>No facility selected</h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Please select a facility before creating or editing a lab request.
          </p>
          {onCancel && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onCancel}
                className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}
              >
                <X className="h-4 w-4" /> Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

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
        selectedTestsCount={tests.length}
        onAddTest={openAddTestModal}
        onRefresh={refreshAllData}
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
            onCloseEditor={() => setIsDetailsEditorOpen(false)}
            onChange={handleFormChange}
          />

          <LabRequestTestsCard
            isDark={isDark}
            colors={colors}
            tests={tests}
            onAddTest={openAddTestModal}
            onEditTest={editTestHandler}
            onDeleteTest={deleteTestHandler}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isMutating || isSubmitting || tests.length === 0}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
              isMutating || isSubmitting || tests.length === 0
                ? 'cursor-not-allowed bg-gray-400'
                : 'cursor-pointer bg-blue-600 hover:bg-blue-700',
            )}
          >
            {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {currentRequest ? 'Save Lab Request Updates' : 'Create Lab Request'}
          </button>
        </div>
      </form>

      <LabTestEditorModal
        open={showTestModal}
        isDark={isDark}
        colors={colors}
        facilityId={Number(facilityId)}
        form={testForm}
        editingTest={editingTest}
        isMutating={isMutating}
        onClose={resetTestEditor}
        onSelectTest={handleSelectLabTest}
        onChange={handleTestFormChange}
        onSubmit={saveTest}
      />
    </motion.div>
  );
};

export default LabRequestForm;