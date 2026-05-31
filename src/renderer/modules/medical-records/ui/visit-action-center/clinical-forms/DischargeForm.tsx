import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { selectActiveVisitUuid, selectActivePatient } from '../../../../../app/store/slices/visitSlice';
import {
  useGetDischargeData,
  useCreateDischarge,
  useUpdateDischarge,
} from '../../../api/discharge/DischargeQueries';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';
import { useGetFacilityTemplates } from '../../../api/clinical-templates/ClinicalTemplateQueries';
import { TemplateSelectorModal } from './prescription-form-components/TemplateSelectorModal';
import type { ClinicalTemplate } from '../../../api/clinical-templates/ClinicalTemplateTypes';

import {
  DischargeEditor,
  DischargeEmptyState,
  DischargeHeader,
  DischargePreviewModal,
  DischargeSummaryCard,
} from './discharge-form-components';
import type {
  DischargeFormValues,
  DischargeMode,
  DischargePreviewAction,
  DischargeMedicationFormItem,
} from './discharge-form-components/dischargeForm.types';
import {
  EMPTY_DISCHARGE_FORM,
  getColors,
} from './discharge-form-components/dischargeForm.types';
import {
  buildCreateDischargePayload,
  buildUpdateDischargePayload,
  extractDischargeErrorMessage,
  extractFormErrors,
  normalizeDischargeResponse,
} from './discharge-form-components/dischargeForm.utils';

export interface DischargeFormProps {
  theme?: 'light' | 'dark';
  onSaved?: () => void;
  onCancel?: () => void;
}

export const DischargeForm: React.FC<DischargeFormProps> = ({
  theme = 'light',
  onSaved,
}) => {
  const isDark = theme === 'dark';
  const colors = getColors(theme);

  const activeVisitUuid = useSelector(selectActiveVisitUuid);
  const activePatient = useSelector(selectActivePatient);
  const facilityId = useSelector(getActiveFacilityId);

  const [templateSearch, setTemplateSearch] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const templatesQuery = useGetFacilityTemplates(
    { facility_id: facilityId ?? 0, include_system: true },
    { enabled: !!facilityId }
  );

  const [mode, setMode] = useState<DischargeMode>('idle');
  const [formData, setFormData] = useState<DischargeFormValues>(EMPTY_DISCHARGE_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAction, setPreviewAction] = useState<DischargePreviewAction>('preview');


  const dischargeQuery = useGetDischargeData(activeVisitUuid, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const dischargeData = useMemo(
    () => dischargeQuery.data?.data ?? null,
    [dischargeQuery.data]
  );

  const hydratedValues = useMemo(
    () => normalizeDischargeResponse(dischargeData),
    [dischargeData]
  );

  const refreshDischarge = useCallback(() => {
    if (activeVisitUuid) {
      dischargeQuery.refetch();
    }
  }, [activeVisitUuid, dischargeQuery]);

  const handleMutationError = useCallback((error: unknown) => {
    const normalizedMessage = extractDischargeErrorMessage(
      error as never,
      'Unable to save discharge record right now.'
    );
    const apiFieldErrors = extractFormErrors(error as never);
    setFormError(normalizedMessage);
    setFieldErrors(apiFieldErrors);
  }, []);

  const createMutation = useCreateDischarge({
    onSuccess: () => {
      refreshDischarge();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.();
    },
    onError: handleMutationError,
  });

  const updateMutation = useUpdateDischarge({
    onSuccess: () => {
      refreshDischarge();
      setMode('idle');
      setFieldErrors({});
      setFormError(null);
      onSaved?.();
    },
    onError: handleMutationError,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = dischargeQuery.isLoading && !!activeVisitUuid;

  const handleFieldChange = useCallback(
    (field: keyof DischargeFormValues, value: unknown) => {
      setFormError(null);
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAddMedication = useCallback((medication: DischargeMedicationFormItem) => {
    setFormData((prev) => ({
      ...prev,
      dischargeMedications: [...prev.dischargeMedications, medication],
    }));
  }, []);

  const handleRemoveMedication = useCallback((tempId: string) => {
    setFormData((prev) => ({
      ...prev,
      dischargeMedications: prev.dischargeMedications.filter((m) => m.tempId !== tempId),
    }));
  }, []);

  const handleCreate = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(EMPTY_DISCHARGE_FORM);
    setMode('create');
  }, []);

  const handleEdit = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(hydratedValues);
    setMode('edit');
  }, [hydratedValues]);

  const handleCancelEdit = useCallback(() => {
    setFormError(null);
    setFieldErrors({});
    setFormData(dischargeData ? hydratedValues : EMPTY_DISCHARGE_FORM);
    setMode('idle');
  }, [dischargeData, hydratedValues]);

  const openPreview = useCallback((action: DischargePreviewAction = 'preview') => {
    setPreviewAction(action);
    setPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewAction('preview');
  }, []);

  const handleCreateSubmit = useCallback(() => {
    if (!activeVisitUuid) {
      setFormError('No active visit selected.');
      return;
    }
    const payload = buildCreateDischargePayload(formData);
    createMutation.mutate({ visitId: activeVisitUuid, data: payload });
  }, [createMutation, formData, activeVisitUuid]);

  const handleUpdateSubmit = useCallback(() => {
    if (!activeVisitUuid) {
      setFormError('No active visit selected.');
      return;
    }
    const payload = buildUpdateDischargePayload(formData);
    updateMutation.mutate({ visitId: activeVisitUuid, data: payload });
  }, [activeVisitUuid, formData, updateMutation]);

  const handleApplyTemplate = useCallback(() => {
    setShowTemplateModal(true);
  }, []);

  const handleApplyTemplateSelection = useCallback(
    (template: ClinicalTemplate) => {
      if (!template) return;
      setFormData((prev) => ({
        ...prev,
        dischargeDiagnosis: template.default_diagnosis || prev.dischargeDiagnosis,
        dischargeInstructions: template.patient_instructions || prev.dischargeInstructions,
        dischargeMedications: [
          ...prev.dischargeMedications,
          ...(template.default_medications || []).map((med, idx) => ({
            tempId: `${Date.now()}-${idx}`,
            name: med.medication_name || '',
            dosage: med.dosage_quantity ? String(med.dosage_quantity) + (med.dosage_unit ? ' ' + med.dosage_unit : '') : '',
            frequency: med.frequency || '',
            route: med.route || 'oral',
            durationDays: med.duration_value || null,
          })),
        ],
      }));
      setShowTemplateModal(false);
      setTemplateSearch('');
    },
    []
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setFormError(null);
      setFieldErrors({});

      if (!formData.dischargeInstructions.trim()) {
        setFieldErrors({ dischargeInstructions: 'Discharge instructions are required' });
        return;
      }

      if (mode === 'edit') {
        handleUpdateSubmit();
      } else {
        handleCreateSubmit();
      }
    },
    [mode, formData, handleCreateSubmit, handleUpdateSubmit]
  );

  return (
    <>
      <div className="space-y-6 px-6 mb-6">
        <DischargeHeader
          theme={theme}
          colors={colors}
          dischargeData={dischargeData}
          onPreview={() => openPreview('preview')}
          onApplyTemplate={handleApplyTemplate}
        />

        {!activeVisitUuid && (
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
                  Select the current patient visit first to manage discharge.
                </p>
              </div>
            </div>
          </div>
        )}

        {!!activeVisitUuid && isLoading && (
          <div className={cn('rounded-2xl border p-6 mb-6', colors.border.primary, colors.bg.card)}>
            <div className="flex items-center gap-3">
              <RefreshCw className={cn('h-5 w-5 animate-spin', colors.text.secondary)} />
              <div>
                <p className={cn('text-sm font-medium', colors.text.primary)}>Loading discharge data</p>
                <p className={cn('text-sm', colors.text.secondary)}>
                  Checking whether this visit has a discharge record.
                </p>
              </div>
            </div>
          </div>
        )}

        {!!activeVisitUuid && dischargeQuery.isError && !isLoading && (
          <div className={cn('rounded-2xl border p-5 mb-6', colors.border.primary, colors.bg.card)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className={cn('rounded-xl p-2.5', isDark ? 'bg-red-900/20' : 'bg-red-50')}>
                  <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-red-300' : 'text-red-700')} />
                </div>
                <div>
                  <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                    Unable to load discharge data
                  </h3>
                  <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                    {extractDischargeErrorMessage(
                      dischargeQuery.error as never,
                      'Something went wrong while loading discharge data.'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dischargeQuery.refetch()}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {!!activeVisitUuid && !isLoading && !dischargeQuery.isError && mode === 'idle' && dischargeData && (
          <DischargeSummaryCard
            theme={theme}
            colors={colors}
            dischargeData={dischargeData}
            onEdit={handleEdit}
          />
        )}

        {!!activeVisitUuid && !isLoading && !dischargeQuery.isError && mode === 'idle' && !dischargeData && (
          <DischargeEmptyState
            theme={theme}
            colors={colors}
            onDischarge={handleCreate}
          />
        )}

        {!!activeVisitUuid && !isLoading && !dischargeQuery.isError && (mode === 'create' || mode === 'edit') && (
          <DischargeEditor
            theme={theme}
            colors={colors}
            mode={mode}
            formData={formData}
            fieldErrors={fieldErrors}
            formError={formError}
            isSubmitting={isSubmitting}
            onFieldChange={handleFieldChange}
            onAddMedication={handleAddMedication}
            onRemoveMedication={handleRemoveMedication}
            onCancel={handleCancelEdit}
            onPreview={() => openPreview('preview')}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <TemplateSelectorModal
        open={showTemplateModal}
        isDark={isDark}
        colors={colors}
        templateSearch={templateSearch}
        onTemplateSearchChange={setTemplateSearch}
        templates={templatesQuery.data?.data ?? []}
        isLoading={templatesQuery.isLoading}
        isNavigatingToTemplateCreate={false}
        onClose={() => { setShowTemplateModal(false); setTemplateSearch(''); }}
        onApplyTemplate={handleApplyTemplateSelection}
        onCreateTemplate={() => {}}
      />

      <DischargePreviewModal
        isOpen={previewOpen}
        onClose={closePreview}
        dischargeData={dischargeData}
        patientName={activePatient?.name || 'Unknown Patient'}
        initialAction={previewAction}
      />
    </>
  );
};

export default DischargeForm;
