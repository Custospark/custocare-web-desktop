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
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { getActiveFacilityId ,getUserId} from '../../../../../app/store/utils/contextSelectors';
import { selectActiveVisitPatientId, selectActiveVisitId } from '../../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../../app/store/rootReducer';
import {
  AllergyCheckStatus,
  PrescriptionFormat,
  PrescriptionStatus,
  PrescriberType,
  type CreatePrescriptionRequest,
  type Prescription,
  type UpdatePrescriptionRequest,
} from '../../../api/prescription/PrescriptionTypes';
import {
  prescriptionKeys,
  useCreatePrescription,
  useGetPatientPrescriptions,
  useUpdatePrescription,
} from '../../../api/prescription/PrescriptionQueries';
import {
  prescriptionItemKeys,
  useCreatePrescriptionItem,
  useDeletePrescriptionItem,
  useGetPrescriptionItems,
  useUpdatePrescriptionItem,
} from '../../../api/prescription-items/PrescriptionItemsQueries';
import type {
  CreatePrescriptionItemRequest,
  PrescriptionItem,
} from '../../../api/prescription-items/PrescriptionItemsTypes';
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
import { useGetAllergies } from '../../../api/allergies/AllergyQueries';
import { useGetFacilityTemplates } from '../../../api/clinical-templates/ClinicalTemplateQueries';
import type { ClinicalTemplate } from '../../../api/clinical-templates/ClinicalTemplateTypes';
import { templateToPrescriptionItem } from '../../../api/clinical-templates/ClinicalTemplateTypes';
import { FOCUS_MODE_ROUTES } from '../../../../administration/onboarding/routes/focusModeRouteConstants';

import PrescriptionHeader from './prescription-form-components/PrescriptionHeader';
import PrescriptionAllergyBanner from './prescription-form-components/PrescriptionAllergyBanner';
import PrescriptionDetailsCard from './prescription-form-components/PrescriptionDetailsCard';
import PrescriptionMedicationsCard from './prescription-form-components/PrescriptionMedicationsTable';
import MedicationEditorModal from './prescription-form-components/MedicationEditorModal';
import TemplateSelectorModal from './prescription-form-components/TemplateSelectorModal';
import type {
  AllergyLike,
  MedicationFormData,
  PrescriptionFormData,
} from './prescription-form-components/prescriptionForm.types';
import {
  EMPTY_MEDICATION,
  EMPTY_PRESCRIPTION,
  buildLocalPrescriptionItem,
  toMedicationFormData,
  toPrescriptionFormData,
  toPrescriptionItemRequest,
} from './prescription-form-components/prescriptionForm.types';

interface PrescriptionFormProps {
  theme?: 'light' | 'dark';
  existingPrescription?: Prescription | null;
  onCancel?: () => void;
  onSuccess?: (prescriptionId: number) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export const PrescriptionForm: React.FC<PrescriptionFormProps> = ({
  theme = 'light',
  existingPrescription,
  onCancel,
  onSuccess,
}) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const patientId = useSelector((state: RootState) => selectActiveVisitPatientId(state));
  const visitId = useSelector((state: RootState) => selectActiveVisitId(state));
  const userId = useSelector((state: RootState) => getUserId(state));


  const patientNumericId = patientId ? Number(patientId) : 0;

  const patientPrescriptionsQuery = useGetPatientPrescriptions(
    patientNumericId,
    [],
    {
      enabled: !!patientNumericId && !existingPrescription,
    }
  );

  const resolvedExistingPrescription = useMemo<Prescription | null>(() => {
    if (existingPrescription) return existingPrescription;

    const prescriptions = patientPrescriptionsQuery.data?.data || [];
    if (!prescriptions.length) return null;

    const sorted = [...prescriptions].sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    });

    return sorted[0] ?? null;
  }, [existingPrescription, patientPrescriptionsQuery.data]);

  const [createdPrescriptionId, setCreatedPrescriptionId] = useState<number | null>(null);

  const currentPrescription = createdPrescriptionId
    ? null
    : resolvedExistingPrescription;

  const effectivePrescriptionId = createdPrescriptionId || currentPrescription?.id || null;

  const [formData, setFormData] = useState<PrescriptionFormData>(EMPTY_PRESCRIPTION);
  const [medications, setMedications] = useState<PrescriptionItem[]>([]);
  const [editingMedication, setEditingMedication] = useState<PrescriptionItem | null>(null);
  const [medicationForm, setMedicationForm] = useState<MedicationFormData>(EMPTY_MEDICATION);

  const [isDetailsEditorOpen, setIsDetailsEditorOpen] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [isNavigatingToTemplateCreate, setIsNavigatingToTemplateCreate] = useState(false);
  const [allergyAlertVisible, setAllergyAlertVisible] = useState<{
    medicationName: string;
    allergen: string;
    severity: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allergiesQuery = useGetAllergies(patientId ?? '', {}, { enabled: !!patientId });

  const templatesQuery = useGetFacilityTemplates(
    { facility_id: facilityId || 0, include_system: true },
    { enabled: !!facilityId && showTemplateSelector }
  );

  const itemsQuery = useGetPrescriptionItems(effectivePrescriptionId ?? 0, {
    enabled: !!effectivePrescriptionId && !isSubmitting,
  });

  const createPrescription = useCreatePrescription();
  const updatePrescription = useUpdatePrescription();
  const createItem = useCreatePrescriptionItem(effectivePrescriptionId ?? 0);
  const updateItem = useUpdatePrescriptionItem();
  const deleteItem = useDeletePrescriptionItem();

  const isMutating =
    createPrescription.isPending ||
    updatePrescription.isPending ||
    createItem.isPending ||
    updateItem.isPending ||
    deleteItem.isPending;

  const colors = useMemo(
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

  useEffect(() => {
    setFormData(toPrescriptionFormData(currentPrescription));
  }, [currentPrescription]);

  useEffect(() => {
    if (itemsQuery.data?.data && effectivePrescriptionId) {
      setMedications(itemsQuery.data.data);
    } else if (!effectivePrescriptionId) {
      setMedications((prev) => prev);
    }
  }, [itemsQuery.data, effectivePrescriptionId]);

  const refreshItems = useCallback(async () => {
    if (!effectivePrescriptionId) return;

    await queryClient.invalidateQueries({
      queryKey: prescriptionItemKeys.list(effectivePrescriptionId),
    });
    await queryClient.refetchQueries({
      queryKey: prescriptionItemKeys.list(effectivePrescriptionId),
    });
  }, [effectivePrescriptionId, queryClient]);

  const normalizeAllergyResponse = useCallback((response: unknown): AllergyLike[] => {
    const payload = response as
      | {
          data?: { data?: AllergyLike[] } | AllergyLike[];
          meta?: unknown;
        }
      | undefined;

    if (payload?.data && typeof payload.data === 'object' && 'data' in payload.data) {
      const nested = payload.data as { data?: AllergyLike[] };
      if (Array.isArray(nested.data)) return nested.data;
    }

    if (payload?.data && Array.isArray(payload.data)) {
      return payload.data;
    }

    if (Array.isArray(payload)) return payload;
    return [];
  }, []);

  const patientAllergies = useMemo(
    () => normalizeAllergyResponse(allergiesQuery.data),
    [allergiesQuery.data, normalizeAllergyResponse]
  );

  const checkAllergy = useCallback(
    (medicationName: string): { isAllergic: boolean; allergen: string; severity: string } | null => {
      if (!patientAllergies.length) return null;

      const lowerMedName = medicationName.toLowerCase();

      const matchedAllergy = patientAllergies.find(
        (a) =>
          a.allergen.toLowerCase().includes(lowerMedName) ||
          lowerMedName.includes(a.allergen.toLowerCase())
      );

      if (!matchedAllergy) return null;

      return {
        isAllergic: true,
        allergen: matchedAllergy.allergen,
        severity: matchedAllergy.severity,
      };
    },
    [patientAllergies]
  );

  const debouncedMedName = useDebounce(medicationForm.medication_name, 300);

  useEffect(() => {
    if (!debouncedMedName) {
      setAllergyAlertVisible(null);
      return;
    }

    const allergyCheck = checkAllergy(debouncedMedName);

    if (allergyCheck) {
      setAllergyAlertVisible({
        medicationName: debouncedMedName,
        allergen: allergyCheck.allergen,
        severity: allergyCheck.severity,
      });
    } else {
      setAllergyAlertVisible(null);
    }
  }, [debouncedMedName, checkAllergy]);

  const filteredTemplates = useMemo(() => {
    const templates = templatesQuery.data?.data || [];
    const search = templateSearch.trim().toLowerCase();

    return templates.filter(
      (template) =>
        template.is_active &&
        (!search ||
          template.name.toLowerCase().includes(search) ||
          template.description?.toLowerCase().includes(search))
    );
  }, [templateSearch, templatesQuery.data]);

  const handleFormChange = useCallback(
    (
      field: keyof PrescriptionFormData,
      value: string | PrescriptionFormData['prescription_type'] | PrescriptionFormData['priority']
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

  const resetMedicationEditor = useCallback(() => {
    setMedicationForm(EMPTY_MEDICATION);
    setEditingMedication(null);
    setAllergyAlertVisible(null);
    setShowMedicationModal(false);
  }, []);

  const openAddMedicationModal = useCallback(() => {
    setMedicationForm(EMPTY_MEDICATION);
    setEditingMedication(null);
    setAllergyAlertVisible(null);
    setShowMedicationModal(true);
  }, []);

  const editMedicationHandler = useCallback((item: PrescriptionItem) => {
    setMedicationForm(toMedicationFormData(item));
    setEditingMedication(item);
    setShowMedicationModal(true);
  }, []);

  const addOrUpdateMedication = useCallback(async () => {
    if (!medicationForm.medication_name.trim()) {
      showToast('error', 'Medication name is required', 3000);
      return;
    }

    if (medicationForm.dosage_quantity <= 0) {
      showToast('error', 'Dosage quantity must be greater than 0', 3000);
      return;
    }

    if (medicationForm.duration_value <= 0) {
      showToast('error', 'Duration must be greater than 0', 3000);
      return;
    }

    if (medicationForm.as_needed && !medicationForm.as_needed_reason.trim()) {
      showToast('error', 'PRN reason is required when medication is marked as needed', 3000);
      return;
    }

    const allergyCheck = checkAllergy(medicationForm.medication_name);
    if (allergyCheck) {
      const confirmed = await confirm({
        title: 'Allergy Warning',
        message: `This patient has a documented ${allergyCheck.severity} allergy to "${allergyCheck.allergen}". Are you sure you want to prescribe "${medicationForm.medication_name}"?`,
        confirmText: 'Prescribe Anyway',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!confirmed) return;
    }

    const itemData: CreatePrescriptionItemRequest = toPrescriptionItemRequest(medicationForm);

    try {
      if (editingMedication && effectivePrescriptionId) {
        await updateItem.mutateAsync({
          id: editingMedication.id,
          data: {
            id: editingMedication.id,
            ...itemData,
          },
        });

        await refreshItems();
      } else if (editingMedication && !effectivePrescriptionId) {
        const localUpdated = buildLocalPrescriptionItem(itemData, editingMedication.id);
        setMedications((prev) => prev.map((m) => (m.id === editingMedication.id ? localUpdated : m)));
        showToast('success', 'Medication updated', 3000);
      } else if (effectivePrescriptionId) {
        await createItem.mutateAsync(itemData);
        await refreshItems();
      } else {
        const tempItem = buildLocalPrescriptionItem(itemData, Date.now());
        setMedications((prev) => [...prev, tempItem]);
        showToast('success', 'Medication added. It will be saved when you submit the prescription.', 3000);
      }

      resetMedicationEditor();
    } catch (error) {
      console.error('Failed to save medication:', error);
      showToast('error', 'Failed to save medication', 5000);
    }
  }, [
    medicationForm,
    checkAllergy,
    confirm,
    theme,
    editingMedication,
    effectivePrescriptionId,
    updateItem,
    refreshItems,
    createItem,
    resetMedicationEditor,
    showToast,
  ]);

  const deleteMedicationHandler = useCallback(
    async (item: PrescriptionItem) => {
      const confirmed = await confirm({
        title: 'Remove Medication',
        message: `Are you sure you want to remove "${item.medication_name}" from this prescription?`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        variant: 'danger',
        theme,
      });

      if (!confirmed) return;

      try {
        if (effectivePrescriptionId && item.id > 0) {
          await deleteItem.mutateAsync({
            id: item.id,
            prescriptionId: effectivePrescriptionId,
          });
          await refreshItems();
        } else {
          setMedications((prev) => prev.filter((m) => m.id !== item.id));
          showToast('success', 'Medication removed', 3000);
        }
      } catch (error) {
        console.error('Failed to delete medication:', error);
        showToast('error', 'Failed to remove medication', 5000);
      }
    },
    [confirm, theme, effectivePrescriptionId, deleteItem, refreshItems, showToast]
  );

  const applyTemplate = useCallback(
    async (template: ClinicalTemplate) => {
      setShowTemplateSelector(false);

      try {
        setFormData((prev) => ({
          ...prev,
          diagnosis: template.default_diagnosis || prev.diagnosis,
          clinical_notes: template.default_notes || prev.clinical_notes,
          patient_education_notes: template.patient_instructions || prev.patient_education_notes,
        }));

        if (!template.default_medications?.length) {
          showToast('success', `Template "${template.name}" applied`, 3000);
          return;
        }

        if (effectivePrescriptionId) {
          for (const med of template.default_medications) {
            const itemData = templateToPrescriptionItem(med);
            await createItem.mutateAsync(itemData);
          }

          await refreshItems();
        } else {
          const newMeds = template.default_medications.map((med, idx) =>
            buildLocalPrescriptionItem(templateToPrescriptionItem(med), Date.now() + idx)
          );
          setMedications((prev) => [...prev, ...newMeds]);
        }

        showToast(
          'success',
          `Template "${template.name}" applied with ${template.default_medications.length} medication(s)`,
          5000
        );
      } catch (error) {
        console.error('Failed to apply template:', error);
        showToast('error', 'Failed to apply template', 5000);
      }
    },
    [effectivePrescriptionId, createItem, refreshItems, showToast]
  );

  const handleNavigateToCreateTemplate = useCallback(() => {
    setIsNavigatingToTemplateCreate(true);
    window.setTimeout(() => {
      navigate(FOCUS_MODE_ROUTES.CLINICAL_TEMPLATE_FOCUS);
    }, 150);
  }, [navigate]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!facilityId || !patientId) {
        showToast('error', 'Missing facility or patient information', 5000);
        return;
      }

      if (!userId) {
        showToast('error', 'Missing prescriber information', 5000);
        return;
      }

      if (!formData.prescription_type) {
        showToast('error', 'Prescription type is required', 5000);
        return;
      }

      if (!formData.priority) {
        showToast('error', 'Prescription priority is required', 5000);
        return;
      }

      if (medications.length === 0) {
        showToast('error', 'Please add at least one medication', 5000);
        return;
      }

      setIsSubmitting(true);

      try {
        if (currentPrescription?.id) {
          const updateData: UpdatePrescriptionRequest = {
            visit_id: visitId || null,
            status: PrescriptionStatus.DRAFT,
            diagnosis: formData.diagnosis || null,
            clinical_notes: formData.clinical_notes || null,
            special_instructions: formData.special_instructions || null,
            patient_education_notes: formData.patient_education_notes || null,
            follow_up_instructions: formData.follow_up_instructions || null,
            follow_up_date: formData.follow_up_date || null,
            allergy_check: patientAllergies.length
              ? AllergyCheckStatus.CHECKED_NO_CONFLICTS
              : AllergyCheckStatus.NO_KNOWN_ALLERGIES,
          };

          const result = await updatePrescription.mutateAsync({
            id: currentPrescription.id,
            data: updateData,
          });

          if (result.success) {
            showToast('success', 'Prescription updated successfully', 5000);
            onSuccess?.(result.data.id);
          }
        } else {
          const prescriptionData: CreatePrescriptionRequest = {
            facility_id: facilityId,
            patient_id: Number(patientId),
            visit_id: visitId || null,
            prescription_date: new Date().toISOString(),
            prescribed_by: userId || 0,
            prescriber_type: PrescriberType.MEDICAL_DOCTOR,
            prescription_format: PrescriptionFormat.ELECTRONIC,
            status: PrescriptionStatus.DRAFT,
            prescription_type: formData.prescription_type,
            priority: formData.priority,
            valid_until: formData.valid_until || null,
            diagnosis: formData.diagnosis || null,
            clinical_notes: formData.clinical_notes || null,
            special_instructions: formData.special_instructions || null,
            patient_education_notes: formData.patient_education_notes || null,
            follow_up_instructions: formData.follow_up_instructions || null,
            follow_up_date: formData.follow_up_date || null,
            allergy_check: patientAllergies.length
              ? AllergyCheckStatus.CHECKED_NO_CONFLICTS
              : AllergyCheckStatus.NO_KNOWN_ALLERGIES,
            items: medications.map((m) => ({
              medication_name: m.medication_name,
              brand_name: m.brand_name,
              strength: m.strength,
              dosage_form: m.dosage_form,
              dosage_quantity: m.dosage_quantity,
              dosage_unit: m.dosage_unit,
              frequency: m.frequency,
              duration_value: m.duration_value,
              duration_unit: m.duration_unit,
              route: m.route,
              instructions: m.instructions,
              as_needed: m.as_needed,
              as_needed_reason: m.as_needed_reason,
              administration_instructions: m.administration_instructions,
              refills: m.refills,
              substitution: m.substitution,
            })),
          };

          const result = await createPrescription.mutateAsync(prescriptionData);

          if (result.success && result.data?.id) {
            setCreatedPrescriptionId(result.data.id);

            await queryClient.invalidateQueries({
              queryKey: prescriptionKeys.patient(Number(patientId)),
            });
            await queryClient.invalidateQueries({
              queryKey: prescriptionKeys.detail(result.data.id),
            });

            showToast('success', 'Prescription created successfully', 5000);
            onSuccess?.(result.data.id);
          }
        }

        setIsDetailsEditorOpen(false);
      } catch (error) {
        console.error('Failed to save prescription:', error);
        showToast('error', 'Failed to save prescription', 5000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      facilityId,
      patientId,
      userId,
      formData,
      medications,
      currentPrescription,
      visitId,
      patientAllergies.length,
      updatePrescription,
      onSuccess,
      createPrescription,
      queryClient,
      showToast,
    ]
  );

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
            Open this form from an active visit to create or edit a prescription.
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
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>
            No facility selected
          </h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Please select a facility before creating or editing a prescription.
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

  const isLoadingInitial =
    patientPrescriptionsQuery.isLoading ||
    allergiesQuery.isLoading ||
    (!!effectivePrescriptionId && itemsQuery.isLoading);

  if (isLoadingInitial) {
    return (
      <div className="p-6">
        <LoadingSkeleton
          variant="dashboard"
          theme={isDark ? 'dark' : 'light'}
          message="Loading prescription data..."
        />
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
      <PrescriptionHeader
        isDark={isDark}
        colors={colors}
        prescription={currentPrescription}
        onOpenTemplateSelector={() => setShowTemplateSelector(true)}
        onAddMedication={openAddMedicationModal}
      />

      <PrescriptionAllergyBanner
        allergies={patientAllergies}
        isDark={isDark}
        colors={colors}
      />

      <form onSubmit={handleSubmit}>
    <div className="space-y-6">
      <PrescriptionDetailsCard
        isDark={isDark}
        colors={colors}
        prescription={currentPrescription}
        formData={formData}
        isEditorOpen={isDetailsEditorOpen}
        onOpenEditor={() => setIsDetailsEditorOpen(true)}
        onCloseEditor={() => setIsDetailsEditorOpen(false)}
        onChange={handleFormChange}
      />

      <PrescriptionMedicationsCard
        isDark={isDark}
        colors={colors}
        prescription={currentPrescription}
        formData={formData}
        medications={medications}
        onAddMedication={openAddMedicationModal}
        onEditMedication={editMedicationHandler}
        onDeleteMedication={deleteMedicationHandler}
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
      disabled={isMutating || isSubmitting || medications.length === 0}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
        isMutating || isSubmitting || medications.length === 0
          ? 'cursor-not-allowed bg-gray-400'
          : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
      )}
    >
      {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {currentPrescription ? 'Save Prescription Updates' : 'Create Prescription'}
    </button>
  </div>
</form>

      <MedicationEditorModal
        open={showMedicationModal}
        isDark={isDark}
        colors={colors}
        editingMedication={editingMedication}
        medicationForm={medicationForm}
        allergyAlertVisible={allergyAlertVisible}
        isMutating={isMutating}
        onClose={resetMedicationEditor}
        onChange={handleMedicationChange}
        onSubmit={addOrUpdateMedication}
      />

      <TemplateSelectorModal
        open={showTemplateSelector}
        isDark={isDark}
        colors={colors}
        templateSearch={templateSearch}
        onTemplateSearchChange={setTemplateSearch}
        templates={filteredTemplates}
        isLoading={templatesQuery.isLoading}
        isNavigatingToTemplateCreate={isNavigatingToTemplateCreate}
        onClose={() => {
          setShowTemplateSelector(false);
          setIsNavigatingToTemplateCreate(false);
        }}
        onApplyTemplate={applyTemplate}
        onCreateTemplate={handleNavigateToCreateTemplate}
      />
    </motion.div>
  );
};

export default PrescriptionForm;
