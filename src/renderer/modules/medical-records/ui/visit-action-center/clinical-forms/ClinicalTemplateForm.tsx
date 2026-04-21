import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';
import type { RootState } from '../../../../../app/store/rootReducer';
import {
  TemplateCategory,
  TemplateVisibility,
  type ClinicalTemplate,
  type CreateTemplateRequest,
  type TemplateMedicationItem,
  type UpdateTemplateRequest,
} from '../../../api/clinical-templates/ClinicalTemplateTypes';
import {
  useCreateTemplate,
  useDeleteTemplate,
  useGetFacilityTemplates,
  useToggleTemplateStatus,
  useUpdateTemplate,
} from '../../../api/clinical-templates/ClinicalTemplateQueries';
import {
  AdministrationInstructions,
  DosageForm,
  DosageUnit,
  DurationUnit,
  Frequency,
  Refills,
  Route,
  Substitution,
} from '../../../api/prescription-items/PrescriptionItemsTypes';

import ClinicalTemplatesHeader from './clinical-template-components/ClinicalTemplatesHeader';
import ClinicalTemplateEditorPanel from './clinical-template-components/ClinicalTemplateEditorPanel';
import ClinicalTemplateMedicationModal, {
  type MedicationFormData,
} from './clinical-template-components/ClinicalTemplateMedicationModal';
import { defaultMedicationFormData } from './clinical-template-components/clinicalTemplateUtils';
import ClinicalTemplatesList from './clinical-template-components/ClinicalTemplatesList';

interface ClinicalTemplateFormProps {
  theme?: 'light' | 'dark';
  templateToEdit?: ClinicalTemplate | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: TemplateCategory;
  visibility: TemplateVisibility;
  default_diagnosis: string;
  default_notes: string;
  patient_instructions: string;
}

const EMPTY_FORM: TemplateFormData = {
  name: '',
  description: '',
  category: TemplateCategory.GENERAL_PRACTICE,
  visibility: TemplateVisibility.FACILITY_ONLY,
  default_diagnosis: '',
  default_notes: '',
  patient_instructions: '',
};

export const ClinicalTemplateForm: React.FC<ClinicalTemplateFormProps> = ({
  theme = 'light',
  templateToEdit,
  onCancel,
  onSuccess,
}) => {
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));

  const [formData, setFormData] = useState<TemplateFormData>(EMPTY_FORM);
  const [medications, setMedications] = useState<TemplateMedicationItem[]>([]);
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null);
  const [medicationForm, setMedicationForm] =
    useState<MedicationFormData>(defaultMedicationFormData);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [activeTemplateToEdit, setActiveTemplateToEdit] = useState<ClinicalTemplate | null>(null);

  const isEditing = !!activeTemplateToEdit;

  const templatesQuery = useGetFacilityTemplates(
    { facility_id: facilityId || 0, include_system: true },
    { enabled: !!facilityId }
  );

  const colors = useMemo(
    () => ({
      bg: {
        card: isDark ? 'bg-gray-900' : 'bg-white',
        input: isDark ? 'bg-gray-800' : 'bg-gray-50',
        subtle: isDark ? 'bg-gray-800/60' : 'bg-gray-50',
        hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
        muted: isDark ? 'bg-gray-800' : 'bg-gray-100',
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

  const resetMedicationState = useCallback(() => {
    setEditingMedicationIndex(null);
    setMedicationForm(defaultMedicationFormData);
    setShowMedicationModal(false);
  }, []);

  const resetEditorForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setMedications([]);
    setActiveTemplateToEdit(null);
    resetMedicationState();
  }, [resetMedicationState]);

  const populateEditorFromTemplate = useCallback(
    (template: ClinicalTemplate) => {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        visibility: template.visibility,
        default_diagnosis: template.default_diagnosis || '',
        default_notes: template.default_notes || '',
        patient_instructions: template.patient_instructions || '',
      });
      setMedications(template.default_medications || []);
      setActiveTemplateToEdit(template);
      resetMedicationState();
    },
    [resetMedicationState]
  );

  const closeTemplateForm = useCallback(() => {
    resetEditorForm();
    setShowTemplateForm(false);
    onCancel?.();
  }, [onCancel, resetEditorForm]);

  useEffect(() => {
    if (templateToEdit) {
      populateEditorFromTemplate(templateToEdit);
      setShowTemplateForm(true);
    }
  }, [templateToEdit, populateEditorFromTemplate]);

  const createMutation = useCreateTemplate({
    onSuccess: () => {
      resetEditorForm();
      setShowTemplateForm(false);
      queryClient.invalidateQueries({ queryKey: ['clinicalTemplates'] });
      onSuccess?.();
    },
  });

  const updateMutation = useUpdateTemplate({
    onSuccess: () => {
      resetEditorForm();
      setShowTemplateForm(false);
      queryClient.invalidateQueries({ queryKey: ['clinicalTemplates'] });
      onSuccess?.();
    },
  });

  const deleteMutation = useDeleteTemplate({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicalTemplates'] });
    },
  });

  
  const handleDeleteMedication = useCallback(
    async (index: number) => {
      const medication = medications[index];
      if (!medication) return;

      const confirmed = await confirm({
        title: 'Remove Medication',
        message: `Are you sure you want to remove "${medication.medication_name}" from this template?`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!confirmed) return;

      setMedications((prev) => prev.filter((_, i) => i !== index));

      if (editingMedicationIndex === index) {
        resetMedicationState();
      }
    },
    [confirm, editingMedicationIndex, medications, resetMedicationState, theme]
  );


  const toggleStatusMutation = useToggleTemplateStatus({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicalTemplates'] });
    },
  });

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleStatusMutation.isPending;

  const handleFormChange = useCallback(
    (
      field: keyof TemplateFormData,
      value: string | TemplateCategory | TemplateVisibility
    ) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleMedicationChange = useCallback(
    (
      field: keyof MedicationFormData,
      value:
        | string
        | number
        | boolean
        | DosageForm
        | DosageUnit
        | Frequency
        | DurationUnit
        | Route
        | AdministrationInstructions
        | Refills
        | Substitution
    ) => {
      setMedicationForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAddTemplateClick = useCallback(() => {
    resetEditorForm();
    setShowTemplateForm(true);
  }, [resetEditorForm]);

  const handleOpenMedicationModal = useCallback(() => {
    setEditingMedicationIndex(null);
    setMedicationForm(defaultMedicationFormData);
    setShowMedicationModal(true);
  }, []);

 const addOrUpdateMedication = useCallback(() => {
  // Validation
  if (!medicationForm.medication_name.trim()) {
    // Show error: Medication name is required
    return;
  }
  
  if (medicationForm.dosage_quantity <= 0) {
    // Show error: Dosage quantity must be greater than 0
    return;
  }
  
  if (medicationForm.duration_value <= 0) {
    // Show error: Duration must be greater than 0
    return;
  }
  
  if (medicationForm.as_needed && !medicationForm.as_needed_reason?.trim()) {
    // Show error: Reason is required for PRN medications
    return;
  }

  // Create medication item - no 'as' casts needed since types already match
  const newMedication: TemplateMedicationItem = {
    medication_name: medicationForm.medication_name.trim(),
    brand_name: medicationForm.brand_name || null,
    strength: medicationForm.strength || null,
    dosage_form: medicationForm.dosage_form || DosageForm.TABLET,
    dosage_quantity: medicationForm.dosage_quantity || 1,
    dosage_unit: medicationForm.dosage_unit || DosageUnit.TABLETS,
    frequency: medicationForm.frequency || Frequency.ONCE_DAILY,
    duration_value: medicationForm.duration_value || 1,
    duration_unit: medicationForm.duration_unit || DurationUnit.DAYS,
    route: medicationForm.route || Route.ORAL,
    instructions: medicationForm.instructions || null,
    as_needed: medicationForm.as_needed || false,
    as_needed_reason: medicationForm.as_needed_reason || null,
    administration_instructions: medicationForm.administration_instructions || AdministrationInstructions.NONE,
    refills: medicationForm.refills || Refills.ZERO,
    substitution: medicationForm.substitution || Substitution.GENERIC_ALLOWED,
  };

  if (editingMedicationIndex !== null) {
    setMedications((prev) =>
      prev.map((item, index) => (index === editingMedicationIndex ? newMedication : item))
    );
  } else {
    setMedications((prev) => [...prev, newMedication]);
  }

  resetMedicationState();
}, [editingMedicationIndex, medicationForm, resetMedicationState]);

const handleEditMedication = useCallback(
  (index: number) => {
    const med = medications[index];
    if (!med) return;

    // No 'as' casts needed - the medication already has the correct types
    setMedicationForm({
      medication_name: med.medication_name,
      brand_name: med.brand_name || '',
      strength: med.strength || '',
      dosage_form: med.dosage_form as DosageForm, // Safe cast - stored as string but matches enum
      dosage_quantity: med.dosage_quantity,
      dosage_unit: med.dosage_unit as DosageUnit, // Safe cast - stored as string but matches enum
      frequency: med.frequency as Frequency, // Safe cast - stored as string but matches enum
      duration_value: med.duration_value,
      duration_unit: med.duration_unit as DurationUnit, // Safe cast - stored as string but matches enum
      route: med.route as Route, // Safe cast - stored as string but matches enum
      instructions: med.instructions || '',
      as_needed: med.as_needed || false,
      as_needed_reason: med.as_needed_reason || '',
      administration_instructions: med.administration_instructions as AdministrationInstructions, // Safe cast
      refills: med.refills as Refills, // Safe cast
      substitution: med.substitution as Substitution, // Safe cast
    });

    setEditingMedicationIndex(index);
    setShowMedicationModal(true);
  },
  [medications]
);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!facilityId) return;
      if (!formData.name.trim()) return;

      const payload = {
        facility_id: facilityId,
        name: formData.name.trim(),
        description: formData.description || null,
        category: formData.category,
        default_diagnosis: formData.default_diagnosis || null,
        default_notes: formData.default_notes || null,
        patient_instructions: formData.patient_instructions || null,
        default_medications: medications,
        visibility: formData.visibility,
      };

      if (isEditing && activeTemplateToEdit) {
        const updatePayload: UpdateTemplateRequest = {
          name: payload.name,
          description: payload.description,
          category: payload.category,
          default_diagnosis: payload.default_diagnosis,
          default_notes: payload.default_notes,
          patient_instructions: payload.patient_instructions,
          default_medications: payload.default_medications,
          visibility: payload.visibility,
        };

        updateMutation.mutate({
          id: activeTemplateToEdit.id,
          data: updatePayload,
        });

        return;
      }

      createMutation.mutate(payload as CreateTemplateRequest);
    },
    [
      activeTemplateToEdit,
      createMutation,
      facilityId,
      formData,
      isEditing,
      medications,
      updateMutation,
    ]
  );

  const handleEditTemplate = useCallback(
    (template: ClinicalTemplate) => {
      populateEditorFromTemplate(template);
      setShowTemplateForm(true);
    },
    [populateEditorFromTemplate]
  );

  const handleDeleteTemplate = useCallback(
    async (template: ClinicalTemplate) => {
      const confirmed = await confirm({
        title: 'Delete Template',
        message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (confirmed && facilityId) {
        deleteMutation.mutate({ id: template.id, facilityId });
      }
    },
    [confirm, deleteMutation, facilityId, theme]
  );

  const handleToggleStatus = useCallback(
    async (template: ClinicalTemplate) => {
      const newStatus = !template.is_active;

      const confirmed = await confirm({
        title: newStatus ? 'Activate Template' : 'Deactivate Template',
        message: newStatus
          ? `Are you sure you want to activate "${template.name}"? It will become available for use.`
          : `Are you sure you want to deactivate "${template.name}"? It will no longer appear in selection lists.`,
        confirmText: newStatus ? 'Activate' : 'Deactivate',
        cancelText: 'Cancel',
        variant: newStatus ? 'info' : 'warning',
        theme,
      });

      if (confirmed && facilityId) {
        toggleStatusMutation.mutate({ id: template.id, facilityId });
      }
    },
    [confirm, facilityId, theme, toggleStatusMutation]
  );

  if (!facilityId) {
    return (
      <div className="p-6">
        <div
          className={cn(
            'rounded-xl border p-6 text-center',
            colors.border.primary,
            colors.bg.card
          )}
        >
          <div
            className={cn(
              'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full',
              colors.bg.muted
            )}
          >
            <Building2 className={cn('h-6 w-6', colors.text.secondary)} />
          </div>

          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>
            No Facility Selected
          </h2>

          <p className={cn('text-sm', colors.text.secondary)}>
            Please select a facility to manage clinical templates.
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
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (templatesQuery.isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton
          variant="dashboard"
          theme={isDark ? 'dark' : 'light'}
          message="Loading templates..."
        />
      </div>
    );
  }

  const templates = templatesQuery.data?.data || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className="p-6"
    >
      <ClinicalTemplatesHeader
        isDark={isDark}
        colors={colors}
        totalTemplates={templates.length}
        activeTemplates={templates.filter((template) => template.is_active).length}
        isRefreshing={templatesQuery.isFetching}
        onRefresh={() => templatesQuery.refetch()}
        onAddTemplate={handleAddTemplateClick}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {showTemplateForm && (
          <div className="xl:col-span-2">
            <ClinicalTemplateEditorPanel
              isDark={isDark}
              colors={colors}
              isEditing={isEditing}
              formData={formData}
              medications={medications}
              isMutating={isMutating}
              onFormChange={handleFormChange}
              onOpenMedicationModal={handleOpenMedicationModal}
              onEditMedication={handleEditMedication}
              onDeleteMedication={handleDeleteMedication}
              onReset={resetEditorForm}
              onClose={closeTemplateForm}
              onSubmit={handleSubmit}
            />
          </div>
        )}

        <div className={showTemplateForm ? 'xl:col-span-3' : 'xl:col-span-5'}>
          <ClinicalTemplatesList
            isDark={isDark}
            colors={colors}
            templates={templates}
            isFetching={templatesQuery.isFetching}
            isMutating={isMutating}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>

      <ClinicalTemplateMedicationModal
        isOpen={showMedicationModal}
        isDark={isDark}
        colors={colors}
        medicationForm={medicationForm}
        editingMedicationIndex={editingMedicationIndex}
        isMutating={isMutating}
        onClose={() => setShowMedicationModal(false)}
        onChange={handleMedicationChange}
        onSubmit={addOrUpdateMedication}
      />
    </motion.div>
  );
};

export default ClinicalTemplateForm;
