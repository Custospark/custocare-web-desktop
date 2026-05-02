import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { selectActiveVisitId, selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import {
  extractVitalErrorMessage,
  extractVitalFieldErrors,
  useCreateVital,
  useGetActiveVisitVitals,
  useUpdateVital,
} from '../../../api/vitals/vitalQueries';
import type { CreateVitalRequest } from '../../../api/vitals/vitalTypes';

import VitalsEditor from './vitals-form-components/VitalsEditor';
import VitalsEmptyState from './vitals-form-components/VitalsEmptyState';
import VitalsHeader from './vitals-form-components/VitalsHeader';
import VitalsPreviewModal from './vitals-form-components/VitalsPreviewModal';
import   VitalsSummaryCard
 from './vitals-form-components/VitalsSummaryCard';

import type {
  VitalsFormData,
  VitalsMode,
  VitalsPreviewAction,
} from './vitals-form-components/vitalsForm.types';
import {
  EMPTY_VITALS_FORM,
  buildCreateVitalPayload,
  buildUpdateVitalPayload,
  extractVitalsFormValues,
  getVitalsId,
  getVitalsTheme,
  mapApiFieldErrorsToFormErrors,
  pickPrimaryVitals,
  calculateBmi,
  serializeCustomFields,
} from './vitals-form-components/vitalsForm.utils';

export interface VitalsFormProps {
  theme?: 'light' | 'dark';
  onSaved?: (vitalsId: number | null) => void;
  onCancel?: () => void;
}

export const VitalsForm: React.FC<VitalsFormProps> = ({
  theme = 'light',
  onSaved,
}) => {
  const isDark = theme === 'dark';
  const colors = getVitalsTheme(theme);

  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatientId = useSelector(selectActiveVisitPatientId);

  const [mode, setMode] = useState<VitalsMode>('idle');
  const [formData, setFormData] = useState<VitalsFormData>(EMPTY_VITALS_FORM);
  const [customFields, setCustomFields] = useState(formData.dynamicCustomFields);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof VitalsFormData, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAction, setPreviewAction] = useState<VitalsPreviewAction>('preview');

  const vitalsQuery = useGetActiveVisitVitals({
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const visitVitals = vitalsQuery.data?.data ?? [];
  const activeVitals = useMemo(() => pickPrimaryVitals(visitVitals), [visitVitals]);
  const hydratedValues = useMemo(
    () => extractVitalsFormValues(activeVitals),
    [activeVitals]
  );

  // Initialize custom fields from hydrated values
  useEffect(() => {
    if (activeVitals) {
      setCustomFields(hydratedValues.dynamicCustomFields);
    } else {
      setCustomFields([]);
    }
  }, [activeVitals, hydratedValues.dynamicCustomFields]);

  // Helper function to refresh vitals after mutation
  const refreshVitals = useCallback(() => {
    if (activeVisitId) {
      vitalsQuery.refetch();
    }
  }, [activeVisitId, vitalsQuery]);

  useEffect(() => {
    if (mode === 'idle') {
      setFormData(activeVitals ? hydratedValues : EMPTY_VITALS_FORM);
      setCustomFields(activeVitals ? hydratedValues.dynamicCustomFields : []);
      setFieldErrors({});
      setFormError(null);
    }
  }, [mode, activeVitals, hydratedValues]);

  const handleMutationError = useCallback((error: unknown) => {
    const normalizedMessage = extractVitalErrorMessage(
      error as never,
      'Unable to save vital signs right now.'
    );
    const apiFieldErrors = extractVitalFieldErrors(error as never);
    setFormError(normalizedMessage);
    setFieldErrors(mapApiFieldErrorsToFormErrors(apiFieldErrors));
  }, []);

  const createMutation = useCreateVital({
    onSuccess: (response) => {
      const savedId = getVitalsId(response.data ?? null);
      refreshVitals();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.(savedId);
    },
    onError: handleMutationError,
  });

  const updateMutation = useUpdateVital({
    onSuccess: (response) => {
      const savedId = getVitalsId(response.data ?? null);
      refreshVitals();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.(savedId);
    },
    onError: handleMutationError,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = vitalsQuery.isLoading && !!activeVisitId;

  const handleChange = useCallback(
    (field: keyof VitalsFormData, value: number | string | null) => {
      setFormError(null);
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        
        // Auto-calculate BMI when height or weight changes
        if (field === 'height' || field === 'weight' || field === 'heightUnit' || field === 'weightUnit') {
          const bmi = calculateBmi(
            updated.height,
            updated.weight,
            updated.heightUnit,
            updated.weightUnit
          );
          if (bmi !== null) {
            updated.bmi = bmi;
          }
        }
        
        return updated;
      });
    },
    []
  );

  const handleUnitChange = useCallback(
    (field: keyof VitalsFormData, value: string) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        
        // Recalculate BMI when units change
        if (field === 'heightUnit' || field === 'weightUnit') {
          const bmi = calculateBmi(
            updated.height,
            updated.weight,
            updated.heightUnit,
            updated.weightUnit
          );
          if (bmi !== null) {
            updated.bmi = bmi;
          }
        }
        
        return updated;
      });
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
    setFormData(EMPTY_VITALS_FORM);
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
    setFormData(activeVitals ? hydratedValues : EMPTY_VITALS_FORM);
    setCustomFields(activeVitals ? hydratedValues.dynamicCustomFields : []);
    setMode('idle');
  }, [activeVitals, hydratedValues]);

  const openPreview = useCallback((action: VitalsPreviewAction = 'preview') => {
    setPreviewAction(action);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewAction('preview');
  }, []);

  const handleCreateSubmit = useCallback(() => {
    const payload = buildCreateVitalPayload(formData);
    // Add custom fields to payload
    const customFieldsSerialized = serializeCustomFields(customFields);
    const finalPayload = {
      ...payload,
      custom_fields: Object.keys(customFieldsSerialized).length > 0 ? customFieldsSerialized : null,
    };
    createMutation.mutate(finalPayload as CreateVitalRequest);
  }, [createMutation, formData, customFields]);

  const handleUpdateSubmit = useCallback(() => {
    const id = getVitalsId(activeVitals);
    if (!id) {
      setFormError('This vital record could not be updated because its identifier is missing.');
      return;
    }
    const payload = buildUpdateVitalPayload(formData);
    // Add custom fields to payload
    const customFieldsSerialized = serializeCustomFields(customFields);
    const finalPayload = {
      ...payload,
      custom_fields: Object.keys(customFieldsSerialized).length > 0 ? customFieldsSerialized : null,
    };
    updateMutation.mutate({ id, data: finalPayload });
  }, [activeVitals, formData, customFields, updateMutation]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setFormError(null);
      setFieldErrors({});

      if (mode === 'edit' && activeVitals) {
        handleUpdateSubmit();
      } else {
        handleCreateSubmit();
      }
    },
    [mode, activeVitals, handleCreateSubmit, handleUpdateSubmit]
  );

  const previewValues = mode === 'create' || mode === 'edit' ? formData : hydratedValues;

  return (
    <>
      <div className="space-y-6 px-6 mb-6">
        {/* Vitals Header with Refresh Button */}
        <VitalsHeader
          isDark={isDark}
          colors={colors}
          hasActiveVisit={!!activeVisitId}
          hasExistingVitals={!!activeVitals}
          vitalsCount={visitVitals.length}
          isFetching={vitalsQuery.isFetching}
          onRefresh={refreshVitals}
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
                  Select the current patient visit first to record or update vital signs.
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
                <p className={cn('text-sm font-medium', colors.text.primary)}>Loading vital signs</p>
                <p className={cn('text-sm', colors.text.secondary)}>
                  Checking whether this visit already has recorded vital signs.
                </p>
              </div>
            </div>
          </div>
        )}

        {!!activeVisitId && vitalsQuery.isError && !isLoading && (
          <div className={cn('rounded-2xl border p-5 mb-6', colors.border.primary, colors.bg.card)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className={cn('rounded-xl p-2.5', isDark ? 'bg-red-900/20' : 'bg-red-50')}>
                  <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-red-300' : 'text-red-700')} />
                </div>
                <div>
                  <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                    Unable to load vital signs
                  </h3>
                  <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                    {extractVitalErrorMessage(
                      vitalsQuery.error as never,
                      'Something went wrong while loading vital signs.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => vitalsQuery.refetch()}
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

        {!!activeVisitId && !isLoading && !vitalsQuery.isError && mode === 'idle' && activeVitals && (
          <VitalsSummaryCard
            isDark={isDark}
            colors={colors}
            vitals={activeVitals}
            customFields={customFields}
            onEdit={handleEdit}
            onPreview={() => openPreview('preview')}
            onPrint={() => openPreview('print')}
            onDownload={() => openPreview('download')}
          />
        )}

        {!!activeVisitId && !isLoading && !vitalsQuery.isError && mode === 'idle' && !activeVitals && (
          <VitalsEmptyState
            isDark={isDark}
            colors={colors}
            patientId={activePatientId ?? null}
            onCreate={handleCreate}
          />
        )}

        {!!activeVisitId && !isLoading && !vitalsQuery.isError && (mode === 'create' || mode === 'edit') && (
          <VitalsEditor
            isDark={isDark}
            colors={colors}
            mode={mode}
            formData={formData}
            customFields={customFields}
            fieldErrors={fieldErrors}
            formError={formError}
            isSubmitting={isSubmitting}
            onChange={handleChange}
            onUnitChange={handleUnitChange}
            onCustomFieldsChange={handleCustomFieldsChange}
            onCancel={handleCancelEdit}
            onPreview={() => openPreview('preview')}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <VitalsPreviewModal
        open={previewOpen}
        onClose={closePreview}
        vitals={activeVitals}
        values={previewValues}
        initialAction={previewAction}
      />
    </>
  );
};

export type { VitalsFormData };
export default VitalsForm;