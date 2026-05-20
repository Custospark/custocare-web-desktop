import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import {
  extractDiagnosisErrorMessage,
  extractDiagnosisFieldErrors,
  useCreateDiagnosis,
  useGetActiveVisitDiagnoses,
  useUpdateDiagnosis,
  useVerifyDiagnosis,
  useDisputeDiagnosis,
  useResolveDiagnosis,
  useReactivateDiagnosis,
} from '../../../api/diagnosis/diagnosisQueries';
import type { CreateDiagnosisRequest } from '../../../api/diagnosis/diagnosisTypes';

import DiagnosesEditor from './diagnoses-form-components/DiagnosesEditor';
import DiagnosesEmptyState from './diagnoses-form-components/DiagnosesEmptyState';
import DiagnosesHeader from './diagnoses-form-components/DiagnosesHeader';
import DiagnosesPreviewModal from './diagnoses-form-components/DiagnosesPreviewModal';
import DiagnosesSummaryCard from './diagnoses-form-components/DiagnosesSummaryCard';
import ConfirmationDialog from '../../../../../shared/components/Feedback/Prompt/ConfirmationDialog';
import type {
  DiagnosesFormData,
  DiagnosesMode,
  DiagnosesPreviewAction,
} from './diagnoses-form-components/diagnosesForm.types';
import {
  EMPTY_DIAGNOSES_FORM,
  buildCreateDiagnosisPayload,
  buildUpdateDiagnosisPayload,
  extractDiagnosesFormValues,
  getDiagnosisId,
  getDiagnosesTheme,
  mapApiFieldErrorsToFormErrors,
  pickPrimaryDiagnosis,
  serializeCustomFields,
} from './diagnoses-form-components/diagnosesForm.utils';

export interface DiagnosisFormProps {
  theme?: 'light' | 'dark';
  onSaved?: (diagnosisId: number | null) => void;
  onCancel?: () => void;
}

// Dialog state type
interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  confirmText: string;
  cancelText: string;
  showInput: boolean;
  inputLabel: string;
  inputPlaceholder: string;
  onConfirm: (value?: string) => void;
}

export const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  theme = 'light',
  onSaved,
}) => {
  const isDark = theme === 'dark';
  const colors = getDiagnosesTheme(theme);

  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatientId = useSelector(selectActiveVisitPatientId);

  const [mode, setMode] = useState<DiagnosesMode>('idle');
  const [formData, setFormData] = useState<DiagnosesFormData>(EMPTY_DIAGNOSES_FORM);
  const [customFields, setCustomFields] = useState(formData.dynamicCustomFields);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof DiagnosesFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAction, setPreviewAction] = useState<DiagnosesPreviewAction>('preview');
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const diagnosesQuery = useGetActiveVisitDiagnoses({
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const visitDiagnoses = diagnosesQuery.data?.data ?? [];
  const activeDiagnosis = useMemo(() => pickPrimaryDiagnosis(visitDiagnoses), [visitDiagnoses]);
  const hydratedValues = useMemo(
    () => extractDiagnosesFormValues(activeDiagnosis),
    [activeDiagnosis]
  );

  // Initialize custom fields from hydrated values
  useEffect(() => {
    if (activeDiagnosis) {
      setCustomFields(hydratedValues.dynamicCustomFields);
    } else {
      setCustomFields([]);
    }
  }, [activeDiagnosis, hydratedValues.dynamicCustomFields]);

  // Helper function to refresh diagnoses after mutation
  const refreshDiagnoses = useCallback(() => {
    if (activeVisitId) {
      diagnosesQuery.refetch();
    }
  }, [activeVisitId, diagnosesQuery]);

  useEffect(() => {
    if (mode === 'idle') {
      setFormData(activeDiagnosis ? hydratedValues : EMPTY_DIAGNOSES_FORM);
      setCustomFields(activeDiagnosis ? hydratedValues.dynamicCustomFields : []);
      setFieldErrors({});
      setFormError(null);
    }
  }, [mode, activeDiagnosis, hydratedValues]);

  const handleMutationError = useCallback((error: unknown) => {
    const normalizedMessage = extractDiagnosisErrorMessage(
      error as never,
      'Unable to save diagnosis right now.'
    );
    const apiFieldErrors = extractDiagnosisFieldErrors(error as never);
    setFormError(normalizedMessage);
    setFieldErrors(mapApiFieldErrorsToFormErrors(apiFieldErrors));
  }, []);

  const createMutation = useCreateDiagnosis({
    onSuccess: (response) => {
      const savedId = getDiagnosisId(response.data ?? null);
      refreshDiagnoses();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.(savedId);
    },
    onError: handleMutationError,
  });

  const updateMutation = useUpdateDiagnosis({
    onSuccess: (response) => {
      const savedId = getDiagnosisId(response.data ?? null);
      refreshDiagnoses();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.(savedId);
    },
    onError: handleMutationError,
  });

  const verifyMutation = useVerifyDiagnosis({
    onSuccess: (response) => {
      refreshDiagnoses();
      setMode('idle');
      onSaved?.(response.data?.id ?? null);
    },
    onError: handleMutationError,
  });

  const disputeMutation = useDisputeDiagnosis({
    onSuccess: (response) => {
      refreshDiagnoses();
      setMode('idle');
      onSaved?.(response.data?.id ?? null);
    },
    onError: handleMutationError,
  });

  const resolveMutation = useResolveDiagnosis({
    onSuccess: (response) => {
      refreshDiagnoses();
      setMode('idle');
      onSaved?.(response.data?.id ?? null);
    },
    onError: handleMutationError,
  });

  const reactivateMutation = useReactivateDiagnosis({
    onSuccess: (response) => {
      refreshDiagnoses();
      setMode('idle');
      onSaved?.(response.data?.id ?? null);
    },
    onError: handleMutationError,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = diagnosesQuery.isLoading && !!activeVisitId;

  const isVerifying = verifyMutation.isPending;
  const isDisputing = disputeMutation.isPending;
  const isResolving = resolveMutation.isPending;
  const isReactivating = reactivateMutation.isPending;

  // Helper to show dialog
  const showDialog = useCallback((options: Omit<DialogState, 'isOpen' | 'onConfirm'>): Promise<string | boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        ...options,
        isOpen: true,
        onConfirm: (value?: string) => {
          resolve(value ?? true);
          setDialogState(null);
        },
      });
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(null);
  }, []);

  const handleChange = useCallback(
    (field: keyof DiagnosesFormData, value: string | null) => {
      setFormError(null);
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleCustomFieldsChange = useCallback((fields: typeof customFields) => {
    setCustomFields(fields);
    setFormData((prev) => ({ ...prev, dynamicCustomFields: fields }));
  }, []);

  const handleCreate = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(EMPTY_DIAGNOSES_FORM);
    setCustomFields([]);
    setMode('create');
  }, []);

  const handleEdit = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(hydratedValues);
    setCustomFields(hydratedValues.dynamicCustomFields);
    setMode('edit');
  }, [hydratedValues]);

  const handleCancelEdit = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(activeDiagnosis ? hydratedValues : EMPTY_DIAGNOSES_FORM);
    setCustomFields(activeDiagnosis ? hydratedValues.dynamicCustomFields : []);
    setMode('idle');
  }, [activeDiagnosis, hydratedValues]);

  const openPreview = useCallback((action: DiagnosesPreviewAction = 'preview') => {
    setPreviewAction(action);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewAction('preview');
  }, []);

  const handleCreateSubmit = useCallback(() => {
    const payload = buildCreateDiagnosisPayload(formData);
    const customFieldsSerialized = serializeCustomFields(customFields);
    const finalPayload = {
      ...payload,
      custom_fields: Object.keys(customFieldsSerialized).length > 0 ? customFieldsSerialized : null,
    };
    createMutation.mutate(finalPayload as CreateDiagnosisRequest);
  }, [createMutation, formData, customFields]);

  const handleUpdateSubmit = useCallback(() => {
    const id = getDiagnosisId(activeDiagnosis);
    if (!id) {
      setFormError('This diagnosis could not be updated because its identifier is missing.');
      return;
    }
    const payload = buildUpdateDiagnosisPayload(formData);
    const customFieldsSerialized = serializeCustomFields(customFields);
    const finalPayload = {
      ...payload,
      custom_fields: Object.keys(customFieldsSerialized).length > 0 ? customFieldsSerialized : null,
    };
    updateMutation.mutate({ id, data: finalPayload });
  }, [activeDiagnosis, formData, customFields, updateMutation]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setFormError(null);
      setFieldErrors({});

      // Validate required fields
      if (!formData.diagnosisCode.trim()) {
        setFieldErrors({ diagnosisCode: 'Please enter a diagnosis code.' });
        return;
      }
      if (!formData.diagnosisDescription.trim()) {
        setFieldErrors({ diagnosisDescription: 'Please enter a diagnosis description.' });
        return;
      }

      if (mode === 'edit' && activeDiagnosis) {
        handleUpdateSubmit();
      } else {
        handleCreateSubmit();
      }
    },
    [formData, mode, activeDiagnosis, handleCreateSubmit, handleUpdateSubmit]
  );

  const handleVerify = useCallback(async () => {
    const id = getDiagnosisId(activeDiagnosis);
    if (id) {
      const confirmed = await showDialog({
        title: 'Verify Diagnosis',
        message: 'Are you sure you want to verify this diagnosis? This action confirms the diagnosis is accurate.',
        type: 'success',
        confirmText: 'Yes, Verify',
        cancelText: 'Cancel',
        showInput: false,
        inputLabel: '',
        inputPlaceholder: '',
      });
      if (confirmed) {
        verifyMutation.mutate(id);
      }
    }
  }, [activeDiagnosis, verifyMutation, showDialog]);

  const handleDispute = useCallback(async () => {
    const id = getDiagnosisId(activeDiagnosis);
    if (id) {
      const reason = await showDialog({
        title: 'Dispute Diagnosis',
        message: 'Please provide a reason for disputing this diagnosis:',
        type: 'warning',
        confirmText: 'Submit Dispute',
        cancelText: 'Cancel',
        showInput: true,
        inputLabel: 'Dispute Reason',
        inputPlaceholder: 'Enter the reason for disputing this diagnosis...',
      });
      if (reason && typeof reason === 'string') {
        disputeMutation.mutate({ id, reason: reason || undefined });
      }
    }
  }, [activeDiagnosis, disputeMutation, showDialog]);

  const handleResolve = useCallback(async () => {
    const id = getDiagnosisId(activeDiagnosis);
    if (id) {
      const notes = await showDialog({
        title: 'Resolve Diagnosis',
        message: 'Add resolution notes (optional):',
        type: 'success',
        confirmText: 'Mark as Resolved',
        cancelText: 'Cancel',
        showInput: true,
        inputLabel: 'Resolution Notes',
        inputPlaceholder: 'Enter resolution notes...',
      });
      if (notes !== false) {
        resolveMutation.mutate({ id, resolution_notes: (notes as string) || undefined });
      }
    }
  }, [activeDiagnosis, resolveMutation, showDialog]);

  const handleReactivate = useCallback(async () => {
    const id = getDiagnosisId(activeDiagnosis);
    if (id) {
      const confirmed = await showDialog({
        title: 'Reactivate Diagnosis',
        message: 'Are you sure you want to reactivate this diagnosis?',
        type: 'info',
        confirmText: 'Yes, Reactivate',
        cancelText: 'Cancel',
        showInput: false,
        inputLabel: '',
        inputPlaceholder: '',
      });
      if (confirmed) {
        reactivateMutation.mutate(id);
      }
    }
  }, [activeDiagnosis, reactivateMutation, showDialog]);

  const previewValues = mode === 'create' || mode === 'edit' ? formData : hydratedValues;

  return (
    <>
      <div className="space-y-6 px-6 mb-6">
        {/* Diagnoses Header with Refresh Button */}
        <DiagnosesHeader
          isDark={isDark}
          colors={colors}
          hasActiveVisit={!!activeVisitId}
          hasExistingDiagnoses={!!activeDiagnosis}
          diagnosesCount={visitDiagnoses.length}
          isFetching={diagnosesQuery.isFetching}
          onRefresh={refreshDiagnoses}
        />

        {!activeVisitId && (
          <div
            className={cn(
              'rounded-2xl border p-5',
              colors.border.primary,
              colors.bg.card
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn('rounded-xl p-2.5', isDark ? 'bg-amber-900/20' : 'bg-amber-50')}>
                <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-amber-300' : 'text-amber-700')} />
              </div>
              <div>
                <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                  No active visit selected
                </h3>
                <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                  Select the current patient visit first to record or update diagnoses.
                </p>
              </div>
            </div>
          </div>
        )}

        {!!activeVisitId && isLoading && (
          <div className={cn('rounded-2xl border p-6 mb-6', colors.border.primary, colors.bg.card)}>
            <div className="flex items-center gap-3">
              <RefreshCw className={cn('h-5 w-5 animate-spin', colors.text.secondary)} />
              <div>
                <p className={cn('text-sm font-medium', colors.text.primary)}>Loading diagnoses</p>
                <p className={cn('text-sm', colors.text.secondary)}>
                  Checking whether this visit already has recorded diagnoses.
                </p>
              </div>
            </div>
          </div>
        )}

        {!!activeVisitId && diagnosesQuery.isError && !isLoading && (
          <div className={cn('rounded-2xl border p-5 mb-6', colors.border.primary, colors.bg.card)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className={cn('rounded-xl p-2.5', isDark ? 'bg-red-900/20' : 'bg-red-50')}>
                  <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-red-300' : 'text-red-700')} />
                </div>
                <div>
                  <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                    Unable to load diagnoses
                  </h3>
                  <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                    {extractDiagnosisErrorMessage(
                      diagnosesQuery.error as never,
                      'Something went wrong while loading diagnoses.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => diagnosesQuery.refetch()}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {!!activeVisitId && !isLoading && !diagnosesQuery.isError && mode === 'idle' && activeDiagnosis && (
          <DiagnosesSummaryCard
            isDark={isDark}
            colors={colors}
            diagnosis={activeDiagnosis}
            customFields={customFields}
            onEdit={handleEdit}
            onPreview={() => openPreview('preview')}
            onPrint={() => openPreview('print')}
            onDownload={() => openPreview('download')}
            onVerify={activeDiagnosis.verification_status === 'draft' ? handleVerify : undefined}
            onDispute={activeDiagnosis.verification_status !== 'disputed' ? handleDispute : undefined}
            onResolve={activeDiagnosis.clinical_status !== 'resolved' && activeDiagnosis.verification_status === 'verified' ? handleResolve : undefined}
            onReactivate={activeDiagnosis.clinical_status === 'resolved' ? handleReactivate : undefined}
          />
        )}

        {!!activeVisitId && !isLoading && !diagnosesQuery.isError && mode === 'idle' && !activeDiagnosis && (
          <DiagnosesEmptyState
            isDark={isDark}
            colors={colors}
            patientId={activePatientId ?? null}
            onCreate={handleCreate}
          />
        )}

        {!!activeVisitId && !isLoading && !diagnosesQuery.isError && (mode === 'create' || mode === 'edit') && (
          <DiagnosesEditor
            isDark={isDark}
            colors={colors}
            mode={mode}
            formData={formData}
            customFields={customFields}
            fieldErrors={fieldErrors}
            formError={formError}
            isSubmitting={isSubmitting}
            isVerifying={isVerifying}
            isDisputing={isDisputing}
            isResolving={isResolving}
            isReactivating={isReactivating}
            onChange={handleChange}
            onCustomFieldsChange={handleCustomFieldsChange}
            onCancel={handleCancelEdit}
            onPreview={() => openPreview('preview')}
            onSubmit={handleSubmit}
            onVerify={mode === 'edit' && activeDiagnosis?.verification_status === 'draft' ? handleVerify : undefined}
            onDispute={mode === 'edit' && activeDiagnosis?.verification_status !== 'disputed' ? handleDispute : undefined}
            onResolve={mode === 'edit' && activeDiagnosis?.clinical_status !== 'resolved' && activeDiagnosis?.verification_status === 'verified' ? handleResolve : undefined}
            onReactivate={mode === 'edit' && activeDiagnosis?.clinical_status === 'resolved' ? handleReactivate : undefined}
          />
        )}
      </div>

      <DiagnosesPreviewModal
        open={previewOpen}
        onClose={closePreview}
        diagnosis={activeDiagnosis}
        values={previewValues}
        initialAction={previewAction}
        theme={theme}
      />

      {/* Custom Dialog Component */}
      {dialogState && (
        <ConfirmationDialog
          isOpen={dialogState.isOpen}
          onClose={closeDialog}
          onConfirm={dialogState.onConfirm}
          title={dialogState.title}
          message={dialogState.message}
          type={dialogState.type}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          showInput={dialogState.showInput}
          inputLabel={dialogState.inputLabel}
          inputPlaceholder={dialogState.inputPlaceholder}
          theme={theme}
        />
      )}
    </>
  );
};

export type { DiagnosesFormData };
export default DiagnosisForm;