// ClinicalTemplateForm.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  RefreshCw,
  FolderOpen,
  FileText,
  Activity,
  CheckCircle2,
  Tag,
  Eye,
  Building2,
} from 'lucide-react';
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
  getCategoryBadgeColor,
  getVisibilityBadgeColor,
} from '../../../api/clinical-templates/ClinicalTemplateQueries';
import {
  DosageForm,
  DosageUnit,
  DurationUnit,
  Frequency,
  Route,
  AdministrationInstructions,
  Refills,
  Substitution,
} from '../../../api/prescription-items/PrescriptionItemsTypes';

interface ClinicalTemplateFormProps {
  theme?: 'light' | 'dark';
  templateToEdit?: ClinicalTemplate | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

interface MedicationFormData {
  medication_name: string;
  brand_name: string;
  strength: string;
  dosage_form: DosageForm;
  dosage_quantity: number;
  dosage_unit: DosageUnit;
  frequency: Frequency;
  duration_value: number;
  duration_unit: DurationUnit;
  route: Route;
  instructions: string;
  as_needed: boolean;
  as_needed_reason: string;
  administration_instructions: AdministrationInstructions;
  refills: Refills;
  substitution: Substitution;
}

const EMPTY_MEDICATION: MedicationFormData = {
  medication_name: '',
  brand_name: '',
  strength: '',
  dosage_form: DosageForm.TABLET,
  dosage_quantity: 1,
  dosage_unit: DosageUnit.TABLETS,
  frequency: Frequency.ONCE_DAILY,
  duration_value: 7,
  duration_unit: DurationUnit.DAYS,
  route: Route.ORAL,
  instructions: '',
  as_needed: false,
  as_needed_reason: '',
  administration_instructions: AdministrationInstructions.NONE,
  refills: Refills.ZERO,
  substitution: Substitution.GENERIC_ALLOWED,
};

const EMPTY_FORM = {
  name: '',
  description: '',
  category: TemplateCategory.GENERAL_PRACTICE,
  visibility: TemplateVisibility.FACILITY_ONLY,
  default_diagnosis: '',
  default_notes: '',
  patient_instructions: '',
  default_medications: [] as TemplateMedicationItem[],
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

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [medications, setMedications] = useState<TemplateMedicationItem[]>([]);
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<number | null>(null);
  const [medicationForm, setMedicationForm] = useState<MedicationFormData>(EMPTY_MEDICATION);
  const [showMedicationModal, setShowMedicationModal] = useState(false);

  const isEditing = !!templateToEdit;

  const templatesQuery = useGetFacilityTemplates(
    { facility_id: facilityId || 0, include_system: true },
    { enabled: !!facilityId }
  );

  const createMutation = useCreateTemplate({
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['clinicalTemplates'] });
      onSuccess?.();
    },
  });

  const updateMutation = useUpdateTemplate({
    onSuccess: () => {
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['clinicalTemplates'] });
      onSuccess?.();
    },
  });

  const deleteMutation = useDeleteTemplate({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicalTemplates'] });
    },
  });

  const toggleStatusMutation = useToggleTemplateStatus();

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleStatusMutation.isPending;

  const colors = {
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
  };

  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setMedications([]);
    setEditingMedicationIndex(null);
    setMedicationForm(EMPTY_MEDICATION);
    setShowMedicationModal(false);
  }, []);

  useEffect(() => {
    if (templateToEdit) {
      setFormData({
        name: templateToEdit.name,
        description: templateToEdit.description || '',
        category: templateToEdit.category,
        visibility: templateToEdit.visibility,
        default_diagnosis: templateToEdit.default_diagnosis || '',
        default_notes: templateToEdit.default_notes || '',
        patient_instructions: templateToEdit.patient_instructions || '',
        default_medications: templateToEdit.default_medications || [],
      });
      setMedications(templateToEdit.default_medications || []);
    }
  }, [templateToEdit]);

  const handleFormChange = (
    field: keyof typeof formData,
    value: string | TemplateCategory | TemplateVisibility
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMedicationChange = (
    field: keyof MedicationFormData,
    value: string | number | boolean | DosageForm | DosageUnit | Frequency | DurationUnit | Route | AdministrationInstructions | Refills | Substitution
  ) => {
    setMedicationForm((prev) => ({ ...prev, [field]: value }));
  };

  const addOrUpdateMedication = () => {
    if (!medicationForm.medication_name.trim()) return;

    const newMedication: TemplateMedicationItem = {
      medication_name: medicationForm.medication_name.trim(),
      brand_name: medicationForm.brand_name || null,
      strength: medicationForm.strength || null,
      dosage_form: medicationForm.dosage_form as DosageForm,
      dosage_quantity: medicationForm.dosage_quantity,
      dosage_unit: medicationForm.dosage_unit,
      frequency: medicationForm.frequency,
      duration_value: medicationForm.duration_value,
    duration_unit: medicationForm.duration_unit || DurationUnit.DAYS,  // ✅ Fallback default
      route: medicationForm.route,
      instructions: medicationForm.instructions || null,
      as_needed: medicationForm.as_needed,
      as_needed_reason: medicationForm.as_needed_reason || null,
      administration_instructions: medicationForm.administration_instructions,
      refills: medicationForm.refills,
      substitution: medicationForm.substitution,
    };

    if (editingMedicationIndex !== null) {
      const updated = [...medications];
      updated[editingMedicationIndex] = newMedication;
      setMedications(updated);
    } else {
      setMedications([...medications, newMedication]);
    }

    setMedicationForm(EMPTY_MEDICATION);
    setEditingMedicationIndex(null);
    setShowMedicationModal(false);
  };

  const editMedication = (index: number) => {
    const med = medications[index];
    setMedicationForm({
      medication_name: med.medication_name,
      brand_name: med.brand_name || '',
      strength: med.strength || '',
      dosage_form: med.dosage_form as DosageForm,
      dosage_quantity: med.dosage_quantity,
      dosage_unit: med.dosage_unit as DosageUnit,
      frequency: med.frequency as Frequency,
      duration_value: med.duration_value,
      duration_unit: med.duration_unit as DurationUnit,
      route: med.route as Route,
      instructions: med.instructions || '',
      as_needed: med.as_needed || false,
      as_needed_reason: med.as_needed_reason || '',
      administration_instructions: med.administration_instructions as AdministrationInstructions,
      refills: med.refills as Refills,
      substitution: med.substitution as Substitution,
    });
    setEditingMedicationIndex(index);
    setShowMedicationModal(true);
  };

  const deleteMedication = async (index: number) => {
    const confirmed = await confirm({
      title: 'Remove Medication',
      message: `Are you sure you want to remove "${medications[index].medication_name}" from this template?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });
    if (confirmed) {
      const updated = medications.filter((_, i) => i !== index);
      setMedications(updated);
      if (editingMedicationIndex === index) {
        setMedicationForm(EMPTY_MEDICATION);
        setEditingMedicationIndex(null);
        setShowMedicationModal(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    if (isEditing && templateToEdit) {
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
      updateMutation.mutate({ id: templateToEdit.id, data: updatePayload });
    } else {
      createMutation.mutate(payload as CreateTemplateRequest);
    }
  };

  const handleDeleteTemplate = async (template: ClinicalTemplate) => {
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
  };

  const handleToggleStatus = async (template: ClinicalTemplate) => {
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
  };

  if (!facilityId) {
    return (
      <div className="p-6">
        <div className={cn('rounded-xl border p-6 text-center', colors.border.primary, colors.bg.card)}>
          <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', colors.bg.muted)}>
            <Building2 className={cn('h-6 w-6', colors.text.secondary)} />
          </div>
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>No Facility Selected</h2>
          <p className={cn('text-sm', colors.text.secondary)}>Please select a facility to manage clinical templates.</p>
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

  if (templatesQuery.isLoading && !isEditing) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={isDark ? 'dark' : 'light'} message="Loading templates..." />
      </div>
    );
  }

  const templates = templatesQuery.data?.data || [];

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('rounded-xl p-2.5', isDark ? 'bg-blue-900/20' : 'bg-blue-50')}>
            <FolderOpen className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-600')} />
          </div>
          <div>
            <h2 className={cn('text-lg font-semibold', colors.text.primary)}>Clinical Templates</h2>
            <p className={cn('text-sm', colors.text.secondary)}>Create and manage reusable prescription templates</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={cn('rounded-lg border px-3 py-2 text-sm', colors.border.primary, colors.bg.subtle)}>
            <span className={cn('font-semibold', colors.text.primary)}>Total:</span>{' '}
            <span className={colors.text.secondary}>{templates.length}</span>
          </div>
          <div className={cn('rounded-lg border px-3 py-2 text-sm', colors.border.primary, colors.bg.subtle)}>
            <span className={cn('font-semibold', colors.text.primary)}>Active:</span>{' '}
            <span className={colors.text.secondary}>{templates.filter((t) => t.is_active).length}</span>
          </div>
          <button
            type="button"
            onClick={() => templatesQuery.refetch()}
            disabled={templatesQuery.isFetching}
            className={cn('inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all', colors.border.primary, colors.text.secondary, templatesQuery.isFetching ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')}
          >
            <RefreshCw className={cn('h-4 w-4', templatesQuery.isFetching && 'animate-spin')} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Form Column */}
        <div className="xl:col-span-2">
          <div className={cn('rounded-2xl border p-5', colors.border.primary, colors.bg.card)}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className={cn('text-base font-semibold', colors.text.primary)}>{isEditing ? 'Edit Template' : 'Create New Template'}</h3>
                <p className={cn('text-sm', colors.text.secondary)}>Fill in template details and medications</p>
              </div>
              {isEditing && (
                <button type="button" onClick={resetForm} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}>
                  <X className="h-4 w-4" /> Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <Tag className="h-4 w-4" /> Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g., Hypertension Protocol, Diabetes Management"
                  className={cn('w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all', colors.bg.input, colors.text.primary, colors.border.primary, colors.border.focus)}
                  autoFocus
                />
              </div>

              <div>
                <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <FileText className="h-4 w-4" /> Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Brief description of when to use this template..."
                  rows={2}
                  className={cn('w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all', colors.bg.input, colors.text.primary, colors.border.primary, colors.border.focus)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                    <FolderOpen className="h-4 w-4" /> Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value as TemplateCategory)}
                    className={cn('w-full cursor-pointer rounded-lg border p-3 text-sm outline-none transition-all', colors.bg.input, colors.text.primary, colors.border.primary, colors.border.focus)}
                  >
                    {Object.values(TemplateCategory).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                    <Eye className="h-4 w-4" /> Visibility
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => handleFormChange('visibility', e.target.value as TemplateVisibility)}
                    className={cn('w-full cursor-pointer rounded-lg border p-3 text-sm outline-none transition-all', colors.bg.input, colors.text.primary, colors.border.primary, colors.border.focus)}
                  >
                    {Object.values(TemplateVisibility).map((vis) => (
                      <option key={vis} value={vis}>{vis}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <FileText className="h-4 w-4" /> Default Diagnosis
                </label>
                <textarea
                  value={formData.default_diagnosis}
                  onChange={(e) => handleFormChange('default_diagnosis', e.target.value)}
                  placeholder="e.g., Essential Hypertension, Type 2 Diabetes Mellitus"
                  rows={2}
                  className={cn('w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all', colors.bg.input, colors.text.primary, colors.border.primary, colors.border.focus)}
                />
              </div>

              <div>
                <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <FileText className="h-4 w-4" /> Default Clinical Notes
                </label>
                <textarea
                  value={formData.default_notes}
                  onChange={(e) => handleFormChange('default_notes', e.target.value)}
                  placeholder="Standard notes that will be added to the prescription..."
                  rows={3}
                  className={cn('w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all', colors.bg.input, colors.text.primary, colors.border.primary, colors.border.focus)}
                />
              </div>

              <div>
                <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <FileText className="h-4 w-4" /> Patient Instructions
                </label>
                <textarea
                  value={formData.patient_instructions}
                  onChange={(e) => handleFormChange('patient_instructions', e.target.value)}
                  placeholder="Instructions to be printed on prescription for the patient..."
                  rows={2}
                  className={cn('w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all', colors.bg.input, colors.text.primary, colors.border.primary, colors.border.focus)}
                />
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className={cn('flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                    <Activity className="h-4 w-4" /> Medications
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMedicationIndex(null);
                      setMedicationForm(EMPTY_MEDICATION);
                      setShowMedicationModal(true);
                    }}
                    className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all', colors.bg.hover, colors.text.brand)}
                  >
                    <Plus className="h-4 w-4" /> Add Medication
                  </button>
                </div>

                {medications.length === 0 ? (
                  <div className={cn('rounded-xl border border-dashed p-6 text-center', colors.border.primary, colors.bg.subtle)}>
                    <Activity className={cn('mx-auto mb-2 h-8 w-8', colors.text.tertiary)} />
                    <p className={cn('text-sm', colors.text.secondary)}>No medications added. Click "Add Medication" to include drugs in this template.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medications.map((med, idx) => (
                      <div key={idx} className={cn('rounded-lg border p-3', colors.border.primary, colors.bg.subtle)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={cn('font-medium', colors.text.primary)}>{med.medication_name}</span>
                              {med.strength && <span className={cn('text-xs', colors.text.tertiary)}>{med.strength}</span>}
                              {med.brand_name && <span className={cn('text-xs', colors.text.tertiary)}>({med.brand_name})</span>}
                            </div>
                            <p className={cn('text-xs', colors.text.secondary)}>
                              {med.dosage_quantity} {med.dosage_unit} • {med.frequency} • {med.duration_value} {med.duration_unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => editMedication(idx)} className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}>
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => deleteMedication(idx)} className={cn('rounded p-1 transition-colors', colors.bg.hover, 'text-red-500')}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {onCancel && (
                  <button type="button" onClick={onCancel} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}>
                    <X className="h-4 w-4" /> Close
                  </button>
                )}
                <button type="button" onClick={resetForm} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}>
                  <RefreshCw className="h-4 w-4" /> Reset
                </button>
                <button
                  type="submit"
                  disabled={!formData.name.trim() || isMutating}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                    !formData.name.trim() || isMutating ? 'cursor-not-allowed bg-gray-400' : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
                  )}
                >
                  <Save className="h-4 w-4" /> {isEditing ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="xl:col-span-3">
          <div className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
            <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b p-5', colors.border.primary)}>
              <div>
                <h3 className={cn('text-base font-semibold', colors.text.primary)}>Saved Templates</h3>
                <p className={cn('text-sm', colors.text.secondary)}>Edit, activate/deactivate, or delete existing templates</p>
              </div>
            </div>

            {(templatesQuery.isFetching || isMutating) && (
              <div className="px-5 pt-4">
                <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} message="Refreshing..." />
              </div>
            )}

            <div className="p-5">
              {templates.length === 0 ? (
                <div className={cn('rounded-xl border border-dashed p-8 text-center', colors.border.primary, colors.bg.subtle)}>
                  <CheckCircle2 className={cn('mx-auto mb-3 h-10 w-10', isDark ? 'text-green-400' : 'text-green-600')} />
                  <h4 className={cn('mb-1 text-base font-semibold', colors.text.primary)}>No templates yet</h4>
                  <p className={cn('text-sm', colors.text.secondary)}>Create your first clinical template using the form.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className={cn('rounded-xl border transition-all duration-200', colors.border.primary, colors.bg.subtle)}>
                      <div className="p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h4 className={cn('text-base font-semibold', colors.text.primary)}>{template.name}</h4>
                              <span className={getCategoryBadgeColor(template.category)}>{template.category}</span>
                              <span className={getVisibilityBadgeColor(template.visibility)}>{template.visibility}</span>
                              <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium', template.is_active ? (isDark ? 'border-green-800/50 bg-green-900/20 text-green-300' : 'border-green-200 bg-green-100 text-green-700') : (isDark ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-gray-100 text-gray-600'))}>
                                <Activity className="h-3 w-3" /> {template.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {template.description && <p className={cn('text-sm mb-2', colors.text.secondary)}>{template.description}</p>}
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                              <span className={colors.text.tertiary}>Usage: {template.usage_count} times</span>
                              <span className={colors.text.tertiary}>Medications: {template.default_medications?.length || 0}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(template)}
                              className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}
                            >
                              <RefreshCw className="h-4 w-4" /> {template.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                resetForm();
                                setFormData({
                                  name: template.name,
                                  description: template.description || '',
                                  category: template.category,
                                  visibility: template.visibility,
                                  default_diagnosis: template.default_diagnosis || '',
                                  default_notes: template.default_notes || '',
                                  patient_instructions: template.patient_instructions || '',
                                  default_medications: template.default_medications || [],
                                });
                                setMedications(template.default_medications || []);
                              }}
                              className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all', isDark ? 'bg-amber-900/20 text-amber-300 hover:bg-amber-900/30' : 'bg-amber-50 text-amber-700 hover:bg-amber-100')}
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(template)}
                              disabled={deleteMutation.isPending}
                              className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all', deleteMutation.isPending ? 'cursor-not-allowed bg-gray-400 text-white' : (isDark ? 'cursor-pointer bg-red-900/20 text-red-300 hover:bg-red-900/30' : 'cursor-pointer bg-red-50 text-red-700 hover:bg-red-100'))}
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Medication Modal */}
      {showMedicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={cn('w-full max-w-2xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}>
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                {editingMedicationIndex !== null ? 'Edit Medication' : 'Add Medication'}
              </h3>
              <button onClick={() => setShowMedicationModal(false)} className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Medication Name <span className="text-red-500">*</span></label>
                    <input type="text" value={medicationForm.medication_name} onChange={(e) => handleMedicationChange('medication_name', e.target.value)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} placeholder="e.g., Amlodipine" />
                  </div>
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Brand Name</label>
                    <input type="text" value={medicationForm.brand_name} onChange={(e) => handleMedicationChange('brand_name', e.target.value)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} placeholder="e.g., Norvasc" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Strength</label>
                    <input type="text" value={medicationForm.strength} onChange={(e) => handleMedicationChange('strength', e.target.value)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} placeholder="e.g., 10mg" />
                  </div>
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Dosage Form</label>
                    <select value={medicationForm.dosage_form} onChange={(e) => handleMedicationChange('dosage_form', e.target.value as DosageForm)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                      {Object.values(DosageForm).map((form) => (<option key={form} value={form}>{form}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Dosage Quantity</label>
                    <input type="number" step="0.5" value={medicationForm.dosage_quantity} onChange={(e) => handleMedicationChange('dosage_quantity', parseFloat(e.target.value))} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
                  </div>
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Dosage Unit</label>
                    <select value={medicationForm.dosage_unit} onChange={(e) => handleMedicationChange('dosage_unit', e.target.value as DosageUnit)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                      {Object.values(DosageUnit).map((unit) => (<option key={unit} value={unit}>{unit}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Route</label>
                    <select value={medicationForm.route} onChange={(e) => handleMedicationChange('route', e.target.value as Route)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                      {Object.values(Route).map((route) => (<option key={route} value={route}>{route}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Frequency</label>
                    <select value={medicationForm.frequency} onChange={(e) => handleMedicationChange('frequency', e.target.value as Frequency)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                      {Object.values(Frequency).map((freq) => (<option key={freq} value={freq}>{freq}</option>))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Duration</label>
                      <input type="number" value={medicationForm.duration_value} onChange={(e) => handleMedicationChange('duration_value', parseInt(e.target.value))} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
                    </div>
                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Unit</label>
                      <select value={medicationForm.duration_unit} onChange={(e) => handleMedicationChange('duration_unit', e.target.value as DurationUnit)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                        {Object.values(DurationUnit).map((unit) => (<option key={unit} value={unit}>{unit}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Special Instructions</label>
                  <textarea value={medicationForm.instructions} onChange={(e) => handleMedicationChange('instructions', e.target.value)} rows={2} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} placeholder="e.g., Take with food" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={medicationForm.as_needed} onChange={(e) => handleMedicationChange('as_needed', e.target.checked)} className="rounded" />
                    <span className={cn('text-sm', colors.text.primary)}>As Needed (PRN)</span>
                  </label>
                  {medicationForm.as_needed && (
                    <input type="text" value={medicationForm.as_needed_reason} onChange={(e) => handleMedicationChange('as_needed_reason', e.target.value)} placeholder="Reason (e.g., pain, fever)" className={cn('flex-1 rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Administration Instructions</label>
                    <select value={medicationForm.administration_instructions} onChange={(e) => handleMedicationChange('administration_instructions', e.target.value as AdministrationInstructions)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                      {Object.values(AdministrationInstructions).map((inst) => (<option key={inst} value={inst}>{inst}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Refills</label>
                    <select value={medicationForm.refills} onChange={(e) => handleMedicationChange('refills', e.target.value as Refills)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                      {Object.values(Refills).map((ref) => (<option key={ref} value={ref}>{ref}</option>))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Substitution Policy</label>
                  <select value={medicationForm.substitution} onChange={(e) => handleMedicationChange('substitution', e.target.value as Substitution)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                    {Object.values(Substitution).map((sub) => (<option key={sub} value={sub}>{sub}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className={cn('flex justify-end gap-3 border-t p-5', colors.border.primary)}>
              <button onClick={() => setShowMedicationModal(false)} className={cn('rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}>Cancel</button>
              <button onClick={addOrUpdateMedication} disabled={!medicationForm.medication_name.trim()} className={cn('rounded-lg px-4 py-2 text-sm font-medium text-white transition-all', !medicationForm.medication_name.trim() ? 'cursor-not-allowed bg-gray-400' : 'cursor-pointer bg-blue-600 hover:bg-blue-700')}>
                {editingMedicationIndex !== null ? 'Update Medication' : 'Add Medication'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ClinicalTemplateForm;