import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import {
  extractConsultationErrorMessage,
  extractConsultationFieldErrors,
  useCreateConsultation,
  useGetActiveVisitConsultations,
  useUpdateConsultation,
  useAcceptConsultation,
  useDeclineConsultation,
  useCompleteConsultation,
  useCancelConsultation,
  useScheduleConsultation,
} from '../../../api/consultations/consultationQueries';
import type { CreateConsultationRequest } from '../../../api/consultations/consultationTypes';
import ConsultationsEditor from './consultations-form-components/ConsultationsEditor';
import ConsultationsEmptyState from './consultations-form-components/ConsultationsEmptyState';
import ConsultationsHeader from './consultations-form-components/ConsultationsHeader';
import ConsultationsPreviewModal from './consultations-form-components/ConsultationsPreviewModal';
import ConsultationsSummaryCard from './consultations-form-components/ConsultationsSummaryCard';
import ConfirmationDialog from '../../../../../shared/components/Feedback/Prompt/ConfirmationDialog';
import type {
  ConsultationsFormData,
  ConsultationsMode,
  ConsultationsPreviewAction,
} from './consultations-form-components/consultationsForm.types';
import {
  EMPTY_CONSULTATIONS_FORM,
  buildCreateConsultationPayload,
  buildUpdateConsultationPayload,
  extractConsultationsFormValues,
  getConsultationId,
  getConsultationsTheme,
  mapApiFieldErrorsToFormErrors,
  pickPrimaryConsultation,
  serializeCustomFields,
} from './consultations-form-components/consultationsForm.utils';

export interface ConsultationsFormProps {
  theme?: 'light' | 'dark';
  onSaved?: (consultationId: number | null) => void;
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

export const ConsultationsForm: React.FC<ConsultationsFormProps> = ({
  theme = 'light',
  onSaved,
}) => {
  const isDark = theme === 'dark';
  const colors = getConsultationsTheme(theme);

  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatientId = useSelector(selectActiveVisitPatientId);

  const [mode, setMode] = useState<ConsultationsMode>('idle');
  const [formData, setFormData] = useState<ConsultationsFormData>(EMPTY_CONSULTATIONS_FORM);
  const [customFields, setCustomFields] = useState(formData.dynamicCustomFields);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ConsultationsFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAction, setPreviewAction] = useState<ConsultationsPreviewAction>('preview');
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const consultationsQuery = useGetActiveVisitConsultations({
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const visitConsultations = consultationsQuery.data?.data ?? [];
  const activeConsultation = useMemo(() => pickPrimaryConsultation(visitConsultations), [visitConsultations]);
  const hydratedValues = useMemo(
    () => extractConsultationsFormValues(activeConsultation),
    [activeConsultation]
  );

  // Initialize custom fields from hydrated values
  useEffect(() => {
    if (activeConsultation) {
      setCustomFields(hydratedValues.dynamicCustomFields);
    } else {
      setCustomFields([]);
    }
  }, [activeConsultation, hydratedValues.dynamicCustomFields]);

  // Helper function to refresh consultations after mutation
  const refreshConsultations = useCallback(() => {
    if (activeVisitId) {
      consultationsQuery.refetch();
    }
  }, [activeVisitId, consultationsQuery]);

  useEffect(() => {
    if (mode === 'idle') {
      setFormData(activeConsultation ? hydratedValues : EMPTY_CONSULTATIONS_FORM);
      setCustomFields(activeConsultation ? hydratedValues.dynamicCustomFields : []);
      setFieldErrors({});
      setFormError(null);
    }
  }, [mode, activeConsultation, hydratedValues]);

  const handleMutationError = useCallback((error: unknown) => {
    const normalizedMessage = extractConsultationErrorMessage(
      error as never,
      'Unable to save consultation right now.'
    );
    const apiFieldErrors = extractConsultationFieldErrors(error as never);
    setFormError(normalizedMessage);
    setFieldErrors(mapApiFieldErrorsToFormErrors(apiFieldErrors));
  }, []);

  const createMutation = useCreateConsultation({
    onSuccess: (response) => {
      const savedId = getConsultationId(response.data ?? null);
      refreshConsultations();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.(savedId);
    },
    onError: handleMutationError,
  });

  const updateMutation = useUpdateConsultation({
    onSuccess: (response) => {
      const savedId = getConsultationId(response.data ?? null);
      refreshConsultations();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.(savedId);
    },
    onError: handleMutationError,
  });

  const acceptMutation = useAcceptConsultation({
    onSuccess: (response) => {
      refreshConsultations();
      setMode('idle');
      onSaved?.(response.data?.id ?? null);
    },
    onError: handleMutationError,
  });

  const declineMutation = useDeclineConsultation({
    onSuccess: (response) => {
      refreshConsultations();
      setMode('idle');
      onSaved?.(response.data?.id ?? null);
    },
    onError: handleMutationError,
  });

  const completeMutation = useCompleteConsultation({
    onSuccess: (response) => {
      refreshConsultations();
      setMode('idle');
      onSaved?.(response.data?.id ?? null);
    },
    onError: handleMutationError,
  });

  const cancelMutation = useCancelConsultation({
    onSuccess: (response) => {
      refreshConsultations();
      setMode('idle');
      onSaved?.(response.data?.id ?? null);
    },
    onError: handleMutationError,
  });

  const scheduleMutation = useScheduleConsultation({
    onSuccess: (response) => {
      refreshConsultations();
      setMode('idle');
      onSaved?.(response.data?.id ?? null);
    },
    onError: handleMutationError,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = consultationsQuery.isLoading && !!activeVisitId;

  const isAccepting = acceptMutation.isPending;
  const isDeclining = declineMutation.isPending;
  const isCompleting = completeMutation.isPending;
  const isCancelling = cancelMutation.isPending;
  const isScheduling = scheduleMutation.isPending;

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
    (field: keyof ConsultationsFormData, value: string | number | boolean | string[] | null) => {
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
    setFormData(EMPTY_CONSULTATIONS_FORM);
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
    setFormData(activeConsultation ? hydratedValues : EMPTY_CONSULTATIONS_FORM);
    setCustomFields(activeConsultation ? hydratedValues.dynamicCustomFields : []);
    setMode('idle');
  }, [activeConsultation, hydratedValues]);

  const openPreview = useCallback((action: ConsultationsPreviewAction = 'preview') => {
    setPreviewAction(action);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewAction('preview');
  }, []);

  const handleCreateSubmit = useCallback(() => {
    const payload = buildCreateConsultationPayload(formData);
    const customFieldsSerialized = serializeCustomFields(customFields);
    const finalPayload = {
      ...payload,
      custom_fields: Object.keys(customFieldsSerialized).length > 0 ? customFieldsSerialized : null,
    };
    createMutation.mutate(finalPayload as CreateConsultationRequest);
  }, [createMutation, formData, customFields]);

  const handleUpdateSubmit = useCallback(() => {
    const id = getConsultationId(activeConsultation);
    if (!id) {
      setFormError('This consultation could not be updated because its identifier is missing.');
      return;
    }
    const payload = buildUpdateConsultationPayload(formData);
    const customFieldsSerialized = serializeCustomFields(customFields);
    const finalPayload = {
      ...payload,
      custom_fields: Object.keys(customFieldsSerialized).length > 0 ? customFieldsSerialized : null,
    };
    updateMutation.mutate({ id, data: finalPayload });
  }, [activeConsultation, formData, customFields, updateMutation]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setFormError(null);
      setFieldErrors({});

      // Validate required fields
      if (!formData.specialtyRequired.trim()) {
        setFieldErrors({ specialtyRequired: 'Please enter the required specialty.' });
        return;
      }
      if (!formData.clinicalQuestion.trim()) {
        setFieldErrors({ clinicalQuestion: 'Please enter the clinical question.' });
        return;
      }

      if (mode === 'edit' && activeConsultation) {
        handleUpdateSubmit();
      } else {
        handleCreateSubmit();
      }
    },
    [formData, mode, activeConsultation, handleCreateSubmit, handleUpdateSubmit]
  );

  const handleAccept = useCallback(async () => {
    const id = getConsultationId(activeConsultation);
    if (id) {
      const confirmed = await showDialog({
        title: 'Accept Consultation',
        message: 'Are you sure you want to accept this consultation request?',
        type: 'success',
        confirmText: 'Yes, Accept',
        cancelText: 'Cancel',
        showInput: false,
        inputLabel: '',
        inputPlaceholder: '',
      });
      if (confirmed) {
        acceptMutation.mutate({ id });
      }
    }
  }, [activeConsultation, acceptMutation, showDialog]);

  const handleDecline = useCallback(async () => {
    const id = getConsultationId(activeConsultation);
    if (id) {
      const reason = await showDialog({
        title: 'Decline Consultation',
        message: 'Please provide a reason for declining this consultation:',
        type: 'warning',
        confirmText: 'Submit Decline',
        cancelText: 'Cancel',
        showInput: true,
        inputLabel: 'Decline Reason',
        inputPlaceholder: 'Enter the reason for declining this consultation...',
      });
      if (reason && typeof reason === 'string') {
        declineMutation.mutate({ id, reason: reason || undefined });
      }
    }
  }, [activeConsultation, declineMutation, showDialog]);

  const handleComplete = useCallback(async () => {
    const id = getConsultationId(activeConsultation);
    if (id) {
      const confirmed = await showDialog({
        title: 'Complete Consultation',
        message: 'Are you sure you want to mark this consultation as completed?',
        type: 'success',
        confirmText: 'Yes, Complete',
        cancelText: 'Cancel',
        showInput: false,
        inputLabel: '',
        inputPlaceholder: '',
      });
      if (confirmed) {
        completeMutation.mutate({ id });
      }
    }
  }, [activeConsultation, completeMutation, showDialog]);

  const handleCancelRequest = useCallback(async () => {
    const id = getConsultationId(activeConsultation);
    if (id) {
      const reason = await showDialog({
        title: 'Cancel Consultation',
        message: 'Please provide a reason for cancelling this consultation:',
        type: 'warning',
        confirmText: 'Submit Cancellation',
        cancelText: 'Cancel',
        showInput: true,
        inputLabel: 'Cancellation Reason',
        inputPlaceholder: 'Enter the reason for cancelling this consultation...',
      });
      if (reason && typeof reason === 'string') {
        cancelMutation.mutate({ id, reason: reason || undefined });
      }
    }
  }, [activeConsultation, cancelMutation, showDialog]);

  const handleSchedule = useCallback(async () => {
    const id = getConsultationId(activeConsultation);
    if (id) {
      // This would open a scheduling modal in a real implementation
      // For now, we'll use a simple prompt
      const scheduledFor = await showDialog({
        title: 'Schedule Consultation',
        message: 'Please enter the scheduled date and time:',
        type: 'info',
        confirmText: 'Schedule',
        cancelText: 'Cancel',
        showInput: true,
        inputLabel: 'Scheduled Date/Time',
        inputPlaceholder: 'YYYY-MM-DD HH:MM',
      });
      if (scheduledFor && typeof scheduledFor === 'string') {
        scheduleMutation.mutate({ id, scheduled_for: scheduledFor });
      }
    }
  }, [activeConsultation, scheduleMutation, showDialog]);

  const previewValues = mode === 'create' || mode === 'edit' ? formData : hydratedValues;

  return (
    <>
      <div className="space-y-6 px-6 mb-6">
        {/* Consultations Header with Refresh Button */}
        <ConsultationsHeader
          isDark={isDark}
          colors={colors}
          hasActiveVisit={!!activeVisitId}
          hasExistingConsultation={!!activeConsultation}
          consultationsCount={visitConsultations.length}
          isFetching={consultationsQuery.isFetching}
          onRefresh={refreshConsultations}
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
                  Select the current patient visit first to request or manage consultations.
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
                <p className={cn('text-sm font-medium', colors.text.primary)}>Loading consultations</p>
                <p className={cn('text-sm', colors.text.secondary)}>
                  Checking whether this visit already has consultation requests.
                </p>
              </div>
            </div>
          </div>
        )}

        {!!activeVisitId && consultationsQuery.isError && !isLoading && (
          <div className={cn('rounded-2xl border p-5 mb-6', colors.border.primary, colors.bg.card)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className={cn('rounded-xl p-2.5', isDark ? 'bg-red-900/20' : 'bg-red-50')}>
                  <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-red-300' : 'text-red-700')} />
                </div>
                <div>
                  <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                    Unable to load consultations
                  </h3>
                  <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                    {extractConsultationErrorMessage(
                      consultationsQuery.error as never,
                      'Something went wrong while loading consultations.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => consultationsQuery.refetch()}
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

        {!!activeVisitId && !isLoading && !consultationsQuery.isError && mode === 'idle' && activeConsultation && (
          <ConsultationsSummaryCard
            isDark={isDark}
            colors={colors}
            consultation={activeConsultation}
            customFields={customFields}
            onEdit={handleEdit}
            onPreview={() => openPreview('preview')}
            onPrint={() => openPreview('print')}
            onDownload={() => openPreview('download')}
            onAccept={activeConsultation.request_status === 'pending' ? handleAccept : undefined}
            onDecline={activeConsultation.request_status === 'pending' ? handleDecline : undefined}
            onComplete={activeConsultation.request_status !== 'completed' && activeConsultation.request_status !== 'cancelled' && activeConsultation.request_status !== 'declined' ? handleComplete : undefined}
            onCancelRequest={activeConsultation.request_status !== 'completed' && activeConsultation.request_status !== 'cancelled' && activeConsultation.request_status !== 'declined' ? handleCancelRequest : undefined}
            onSchedule={activeConsultation.request_status === 'accepted' || activeConsultation.request_status === 'pending' ? handleSchedule : undefined}
          />
        )}

        {!!activeVisitId && !isLoading && !consultationsQuery.isError && mode === 'idle' && !activeConsultation && (
          <ConsultationsEmptyState
            isDark={isDark}
            colors={colors}
            patientId={activePatientId ?? null}
            onCreate={handleCreate}
          />
        )}

        {!!activeVisitId && !isLoading && !consultationsQuery.isError && (mode === 'create' || mode === 'edit') && (
          <ConsultationsEditor
            isDark={isDark}
            colors={colors}
            mode={mode}
            formData={formData}
            customFields={customFields}
            fieldErrors={fieldErrors}
            formError={formError}
            isSubmitting={isSubmitting}
            isAccepting={isAccepting}
            isDeclining={isDeclining}
            isCompleting={isCompleting}
            isCancelling={isCancelling}
            isScheduling={isScheduling}
            onChange={handleChange}
            onCustomFieldsChange={handleCustomFieldsChange}
            onCancel={handleCancelEdit}
            onPreview={() => openPreview('preview')}
            onSubmit={handleSubmit}
            onAccept={mode === 'edit' && activeConsultation?.request_status === 'pending' ? handleAccept : undefined}
            onDecline={mode === 'edit' && activeConsultation?.request_status === 'pending' ? handleDecline : undefined}
            onComplete={mode === 'edit' && activeConsultation?.request_status !== 'completed' && activeConsultation?.request_status !== 'cancelled' && activeConsultation?.request_status !== 'declined' ? handleComplete : undefined}
            onCancelRequest={mode === 'edit' && activeConsultation?.request_status !== 'completed' && activeConsultation?.request_status !== 'cancelled' && activeConsultation?.request_status !== 'declined' ? handleCancelRequest : undefined}
            onSchedule={mode === 'edit' && (activeConsultation?.request_status === 'accepted' || activeConsultation?.request_status === 'pending') ? handleSchedule : undefined}
          />
        )}
      </div>

      <ConsultationsPreviewModal
        open={previewOpen}
        onClose={closePreview}
        consultation={activeConsultation}
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

export type { ConsultationsFormData };
export default ConsultationsForm;