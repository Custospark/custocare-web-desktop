// PrescriptionForm.tsx
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText,
  CalendarDays,
  Clock,
  User,
  Building2,
  Stethoscope,
  Pill,
  Copy,
  FolderOpen,
  Search,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';
import { selectActiveVisitPatientId, selectActiveVisitId } from '../../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../../app/store/rootReducer';
import {
  PrescriptionStatus,
  PrescriptionType,
  PrescriptionPriority,
  AllergyCheckStatus,
  PrescriberType,
  PrescriptionFormat,
  type CreatePrescriptionRequest,
  type Prescription,
  type UpdatePrescriptionRequest,
} from '../../../api/prescription/PrescriptionTypes';
import {
  useCreatePrescription,
  useUpdatePrescription,
  prescriptionKeys,
} from '../../../api/prescription/PrescriptionQueries';
import {
  useGetPrescriptionItems,
  useCreatePrescriptionItem,
  useUpdatePrescriptionItem,
  useDeletePrescriptionItem,
  prescriptionItemKeys,
} from '../../../api/prescription-items/PrescriptionItemsQueries';
import type { PrescriptionItem, CreatePrescriptionItemRequest } from '../../../api/prescription-items/PrescriptionItemsTypes';
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
import { useGetAllergies } from '../../../api/allergies/AllergyQueries';
import { AllergySeverity } from '../../../api/allergies/AllergyTypes';
import { useGetFacilityTemplates } from '../../../api/clinical-templates/ClinicalTemplateQueries';
import type { ClinicalTemplate } from '../../../api/clinical-templates/ClinicalTemplateTypes';
import { getCategoryColor as getCategoryBadgeColor, templateToPrescriptionItem } from '../../../api/clinical-templates/ClinicalTemplateTypes';
import { FOCUS_MODE_ROUTES } from '../../../../administration/onboarding/routes/focusModeRouteConstants';

interface PrescriptionFormProps {
  theme?: 'light' | 'dark';
  existingPrescription?: Prescription | null;
  onCancel?: () => void;
  onSuccess?: (prescriptionId: number) => void;
}

interface PrescriptionFormData {
  prescription_type: PrescriptionType;
  priority: PrescriptionPriority;
  diagnosis: string;
  clinical_notes: string;
  special_instructions: string;
  patient_education_notes: string;
  follow_up_instructions: string;
  follow_up_date: string;
  valid_until: string;
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

const EMPTY_PRESCRIPTION: PrescriptionFormData = {
  prescription_type: PrescriptionType.NEW,
  priority: PrescriptionPriority.ROUTINE,
  diagnosis: '',
  clinical_notes: '',
  special_instructions: '',
  patient_education_notes: '',
  follow_up_instructions: '',
  follow_up_date: '',
  valid_until: '',
};

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

// Debounce helper for allergy checking
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
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
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const patientId = useSelector((state: RootState) => selectActiveVisitPatientId(state));
  const visitId = useSelector((state: RootState) => selectActiveVisitId(state));

  const [formData, setFormData] = useState<PrescriptionFormData>(EMPTY_PRESCRIPTION);
  const [medications, setMedications] = useState<PrescriptionItem[]>([]);
  const [editingMedication, setEditingMedication] = useState<PrescriptionItem | null>(null);
  const [medicationForm, setMedicationForm] = useState<MedicationFormData>(EMPTY_MEDICATION);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [allergyAlertVisible, setAllergyAlertVisible] = useState<{ medicationName: string; allergen: string; severity: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPrescriptionId, setCreatedPrescriptionId] = useState<number | null>(null);

  const isEditing = !!existingPrescription;
  const prescriptionId = existingPrescription?.id || createdPrescriptionId;

  // Queries
  const allergiesQuery = useGetAllergies(patientId ?? '', {}, { enabled: !!patientId });
  const templatesQuery = useGetFacilityTemplates(
    { facility_id: facilityId || 0, include_system: true },
    { enabled: !!facilityId && showTemplateSelector }
  );
  const itemsQuery = useGetPrescriptionItems(prescriptionId ?? 0, { enabled: !!prescriptionId && !isSubmitting });

  // Mutations
  const createPrescription = useCreatePrescription();
  const updatePrescription = useUpdatePrescription();
  const createItem = useCreatePrescriptionItem(prescriptionId ?? 0);
  const updateItem = useUpdatePrescriptionItem();
  const deleteItem = useDeletePrescriptionItem();

  const isMutating =
    createPrescription.isPending ||
    updatePrescription.isPending ||
    createItem.isPending ||
    updateItem.isPending ||
    deleteItem.isPending;

  // Load existing prescription data
  useEffect(() => {
    if (existingPrescription) {
      setFormData({
        prescription_type: existingPrescription.prescription_type,
        priority: existingPrescription.priority,
        diagnosis: existingPrescription.diagnosis || '',
        clinical_notes: existingPrescription.clinical_notes || '',
        special_instructions: existingPrescription.special_instructions || '',
        patient_education_notes: existingPrescription.patient_education_notes || '',
        follow_up_instructions: existingPrescription.follow_up_instructions || '',
        follow_up_date: existingPrescription.follow_up_date?.split('T')[0] || '',
        valid_until: existingPrescription.valid_until?.split('T')[0] || '',
      });
    }
  }, [existingPrescription]);

  // Sync medications from API when prescription exists
  useEffect(() => {
    if (itemsQuery.data?.data && prescriptionId) {
      setMedications(itemsQuery.data.data);
    }
  }, [itemsQuery.data, prescriptionId]);

  // Refresh items after mutations
  const refreshItems = useCallback(async () => {
    if (prescriptionId) {
      await queryClient.invalidateQueries({ queryKey: prescriptionItemKeys.list(prescriptionId) });
      await queryClient.refetchQueries({ queryKey: prescriptionItemKeys.list(prescriptionId) });
    }
  }, [prescriptionId, queryClient]);

  // After create/update prescription, refresh items
  useEffect(() => {
    if (!isSubmitting && prescriptionId) {
      refreshItems();
    }
  }, [isSubmitting, prescriptionId, refreshItems]);

  const colors = {
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
  };

  // Allergy checking with debounce
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
  }, [debouncedMedName]);

  // Add this helper inside the component (before the first useEffect)
const normalizeAllergyResponse = useCallback((response: unknown): Allergy[] => {
  const payload = response as {
    data?: { data?: Allergy[] } | Allergy[];
    meta?: unknown;
  } | undefined;

  if (payload?.data && typeof payload.data === 'object' && 'data' in payload.data) {
    const nested = payload.data as { data?: Allergy[] };
    if (Array.isArray(nested.data)) return nested.data;
  }
  if (payload?.data && Array.isArray(payload.data)) {
    return payload.data;
  }
  if (Array.isArray(payload)) return payload;
  return [];
}, []);

// Then in checkAllergy:
const checkAllergy = useCallback(
  (medicationName: string): { isAllergic: boolean; allergen: string; severity: string } | null => {
    const allergies = normalizeAllergyResponse(allergiesQuery.data);
    if (!allergies.length) return null;
    const lowerMedName = medicationName.toLowerCase();
    const matchedAllergy = allergies.find(
      (a) =>
        a.allergen.toLowerCase().includes(lowerMedName) ||
        lowerMedName.includes(a.allergen.toLowerCase())
    );
    if (matchedAllergy) {
      return {
        isAllergic: true,
        allergen: matchedAllergy.allergen,
        severity: matchedAllergy.severity,
      };
    }
    return null;
  },
  [allergiesQuery.data, normalizeAllergyResponse]
);

// In the allergy banner:
const patientAllergies = normalizeAllergyResponse(allergiesQuery.data);

  const handleFormChange = (field: keyof PrescriptionFormData, value: string | PrescriptionType | PrescriptionPriority) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMedicationChange = (field: keyof MedicationFormData, value: string | number | boolean | DosageForm | DosageUnit | Frequency | DurationUnit | Route | AdministrationInstructions | Refills | Substitution) => {
    setMedicationForm((prev) => ({ ...prev, [field]: value }));
  };

  const addOrUpdateMedication = async () => {
    if (!medicationForm.medication_name.trim()) {
      showToast('error', 'Medication name is required', 3000);
      return;
    }

    // Check allergy again before final add
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

    const itemData: CreatePrescriptionItemRequest = {
      medication_name: medicationForm.medication_name.trim(),
      brand_name: medicationForm.brand_name || null,
      strength: medicationForm.strength || null,
      dosage_form: medicationForm.dosage_form,
      dosage_quantity: medicationForm.dosage_quantity,
      dosage_unit: medicationForm.dosage_unit,
      frequency: medicationForm.frequency,
      duration_value: medicationForm.duration_value,
      duration_unit: medicationForm.duration_unit,
      route: medicationForm.route,
      instructions: medicationForm.instructions || null,
      as_needed: medicationForm.as_needed,
      as_needed_reason: medicationForm.as_needed_reason || null,
      administration_instructions: medicationForm.administration_instructions,
      refills: medicationForm.refills,
      substitution: medicationForm.substitution,
    };

    try {
      if (editingMedication) {
        await updateItem.mutateAsync({
          id: editingMedication.id,
          data: itemData,
        });
        showToast('success', 'Medication updated', 3000);
      } else if (prescriptionId) {
        await createItem.mutateAsync(itemData);
        showToast('success', 'Medication added', 3000);
      } else {
        // New prescription - store locally
        const tempItem: PrescriptionItem = {
          id: Date.now(),
          prescription_id: 0,
          medication_name: itemData.medication_name,
          brand_name: itemData.brand_name || null,
          strength: itemData.strength || null,
          full_name: `${itemData.medication_name}${itemData.strength ? ' ' + itemData.strength : ''}`,
          dosage_form: itemData.dosage_form,
          dosage_quantity: itemData.dosage_quantity,
          dosage_unit: itemData.dosage_unit,
          dosage_text: `${itemData.dosage_quantity} ${itemData.dosage_unit}`,
          frequency: itemData.frequency,
          duration_value: itemData.duration_value,
          duration_unit: itemData.duration_unit,
          duration_text: `${itemData.duration_value} ${itemData.duration_unit}`,
          total_quantity: 0,
          route: itemData.route,
          instructions: itemData.instructions || null,
          patient_instructions: '',
          as_needed: itemData.as_needed || false,
          as_needed_reason: itemData.as_needed_reason || null,
          administration_instructions: itemData.administration_instructions,
          refills: itemData.refills,
          refill_instructions: null,
          refill_instructions_text: '',
          medication_type: null,
          monitoring_required: null,
          common_side_effects: null,
          clinical_reasoning: null,
          substitution: itemData.substitution,
          substitution_instructions: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };
        if (editingMedication) {
          setMedications((prev) => prev.map((m) => (m.id === editingMedication.id ? tempItem : m)));
        } else {
          setMedications((prev) => [...prev, tempItem]);
        }
        showToast('success', 'Medication added (will be saved when you submit)', 3000);
      }

      // Reset form and close modal
      setMedicationForm(EMPTY_MEDICATION);
      setEditingMedication(null);
      setShowMedicationModal(false);
      setAllergyAlertVisible(null);

      // Refresh items if we have a prescription ID
      if (prescriptionId) {
        await refreshItems();
      }
    } catch (error) {
      console.error('Failed to save medication:', error);
      showToast('error', 'Failed to save medication', 5000);
    }
  };

  const editMedicationHandler = (item: PrescriptionItem) => {
    setMedicationForm({
      medication_name: item.medication_name,
      brand_name: item.brand_name || '',
      strength: item.strength || '',
      dosage_form: item.dosage_form,
      dosage_quantity: item.dosage_quantity,
      dosage_unit: item.dosage_unit,
      frequency: item.frequency,
      duration_value: item.duration_value,
      duration_unit: item.duration_unit,
      route: item.route,
      instructions: item.instructions || '',
      as_needed: item.as_needed,
      as_needed_reason: item.as_needed_reason || '',
      administration_instructions: item.administration_instructions,
      refills: item.refills,
      substitution: item.substitution,
    });
    setEditingMedication(item);
    setShowMedicationModal(true);
  };

  const deleteMedicationHandler = async (item: PrescriptionItem) => {
    const confirmed = await confirm({
      title: 'Remove Medication',
      message: `Are you sure you want to remove "${item.medication_name}" from this prescription?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
      theme,
    });
    if (confirmed) {
      try {
        if (item.id > 0 && prescriptionId) {
          await deleteItem.mutateAsync({ id: item.id, prescriptionId });
          showToast('success', 'Medication removed', 3000);
          await refreshItems();
        } else {
          setMedications((prev) => prev.filter((m) => m.id !== item.id));
          showToast('success', 'Medication removed', 3000);
        }
      } catch (error) {
        console.error('Failed to delete medication:', error);
        showToast('error', 'Failed to remove medication', 5000);
      }
    }
  };

  const applyTemplate = async (template: ClinicalTemplate) => {
    setShowTemplateSelector(false);
    try {
      // Apply template data to form
      if (template.default_diagnosis) {
        setFormData((prev) => ({ ...prev, diagnosis: template.default_diagnosis || '' }));
      }
      if (template.default_notes) {
        setFormData((prev) => ({ ...prev, clinical_notes: template.default_notes || '' }));
      }
      if (template.patient_instructions) {
        setFormData((prev) => ({ ...prev, patient_education_notes: template.patient_instructions || '' }));
      }

      // Add medications
      if (template.default_medications?.length) {
        if (prescriptionId) {
          // Existing prescription - add via API
          for (const med of template.default_medications) {
            const itemData = templateToPrescriptionItem(med);
            await createItem.mutateAsync(itemData);
          }
          await refreshItems();
          showToast('success', `Template "${template.name}" applied with ${template.default_medications.length} medication(s)`, 5000);
        } else {
          // New prescription - store locally
          const newMeds = template.default_medications.map((med, idx) => {
            const itemData = templateToPrescriptionItem(med);
            return {
              id: Date.now() + idx,
              prescription_id: 0,
              medication_name: itemData.medication_name,
              brand_name: itemData.brand_name || null,
              strength: itemData.strength || null,
              full_name: `${itemData.medication_name}${itemData.strength ? ' ' + itemData.strength : ''}`,
              dosage_form: itemData.dosage_form,
              dosage_quantity: itemData.dosage_quantity,
              dosage_unit: itemData.dosage_unit,
              dosage_text: `${itemData.dosage_quantity} ${itemData.dosage_unit}`,
              frequency: itemData.frequency,
              duration_value: itemData.duration_value,
              duration_unit: itemData.duration_unit,
              duration_text: `${itemData.duration_value} ${itemData.duration_unit}`,
              total_quantity: 0,
              route: itemData.route,
              instructions: itemData.instructions,
              patient_instructions: '',
              as_needed: itemData.as_needed || false,
              as_needed_reason: itemData.as_needed_reason || null,
              administration_instructions: itemData.administration_instructions,
              refills: itemData.refills,
              refill_instructions: null,
              refill_instructions_text: '',
              medication_type: null,
              monitoring_required: null,
              common_side_effects: null,
              clinical_reasoning: null,
              substitution: itemData.substitution,
              substitution_instructions: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              deleted_at: null,
            } as PrescriptionItem;
          });
          setMedications((prev) => [...prev, ...newMeds]);
          showToast('success', `Template "${template.name}" applied with ${template.default_medications.length} medication(s)`, 5000);
        }
      } else {
        showToast('success', `Template "${template.name}" applied`, 3000);
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      showToast('error', 'Failed to apply template', 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId || !patientId) {
      showToast('error', 'Missing facility or patient information', 5000);
      return;
    }

    const finalMedications = medications;
    if (finalMedications.length === 0) {
      showToast('error', 'Please add at least one medication', 5000);
      return;
    }

    setIsSubmitting(true);

    const prescriptionData: CreatePrescriptionRequest = {
      facility_id: facilityId,
      patient_id: patientId,
      visit_id: visitId || null,
      prescription_date: new Date().toISOString(),
      prescriber_type: PrescriberType.MEDICAL_DOCTOR,
      prescription_format: PrescriptionFormat.ELECTRONIC,
      status: PrescriptionStatus.DRAFT,
      prescription_type: formData.prescription_type,
      priority: formData.priority,
      diagnosis: formData.diagnosis || null,
      clinical_notes: formData.clinical_notes || null,
      special_instructions: formData.special_instructions || null,
      patient_education_notes: formData.patient_education_notes || null,
      follow_up_instructions: formData.follow_up_instructions || null,
      follow_up_date: formData.follow_up_date || null,
      valid_until: formData.valid_until || null,
      allergy_check: AllergyCheckStatus.CHECKED_NO_CONFLICTS,
      items: finalMedications.map((m) => ({
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

    try {
      let result;
      if (isEditing && prescriptionId) {
        const updateData: UpdatePrescriptionRequest = {
          status: PrescriptionStatus.DRAFT,
          diagnosis: prescriptionData.diagnosis,
          clinical_notes: prescriptionData.clinical_notes,
          special_instructions: prescriptionData.special_instructions,
          patient_education_notes: prescriptionData.patient_education_notes,
          follow_up_instructions: prescriptionData.follow_up_instructions,
          follow_up_date: prescriptionData.follow_up_date,
          allergy_check: prescriptionData.allergy_check,
        };
        result = await updatePrescription.mutateAsync({ id: prescriptionId, data: updateData });
        showToast('success', 'Prescription updated successfully', 5000);
      } else {
        result = await createPrescription.mutateAsync(prescriptionData);
        if (result.success && result.data?.id) {
          setCreatedPrescriptionId(result.data.id);
          showToast('success', 'Prescription created successfully', 5000);
          // After creation, refresh items (if any local medications were added, they are already in the API call)
          await queryClient.invalidateQueries({ queryKey: prescriptionKeys.detail(result.data.id) });
        }
      }
      if (result.success) {
        onSuccess?.(result.data.id);
      }
    } catch (error) {
      console.error('Failed to save prescription:', error);
      showToast('error', 'Failed to save prescription', 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to open medication modal
  const openAddMedicationModal = () => {
    setMedicationForm(EMPTY_MEDICATION);
    setEditingMedication(null);
    setAllergyAlertVisible(null);
    setShowMedicationModal(true);
  };

  if (!patientId) {
    return (
      <div className="p-6">
        <div className={cn('rounded-xl border p-6 text-center', colors.border.primary, colors.bg.card)}>
          <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', colors.bg.muted)}>
            <User className={cn('h-6 w-6', colors.text.secondary)} />
          </div>
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>No active patient selected</h2>
          <p className={cn('text-sm', colors.text.secondary)}>Open this form from an active visit to create a prescription.</p>
          {onCancel && (
            <div className="mt-5">
              <button type="button" onClick={onCancel} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}>
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
          <p className={cn('text-sm', colors.text.secondary)}>Please select a facility before creating a prescription.</p>
          {onCancel && (
            <div className="mt-5">
              <button type="button" onClick={onCancel} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}>
                <X className="h-4 w-4" /> Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isLoading = (isEditing && itemsQuery.isLoading) || allergiesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={isDark ? 'dark' : 'light'} message="Loading prescription data..." />
      </div>
    );
  }

  const filteredTemplates = templatesQuery.data?.data?.filter(
    (t) => t.is_active && t.name.toLowerCase().includes(templateSearch.toLowerCase())
  ) || [];

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} className="p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn('rounded-xl p-2.5', isDark ? 'bg-green-900/20' : 'bg-green-50')}>
            <Pill className={cn('h-5 w-5', isDark ? 'text-green-300' : 'text-green-600')} />
          </div>
          <div>
            <h2 className={cn('text-lg font-semibold', colors.text.primary)}>{isEditing ? 'Edit Prescription' : 'New Prescription'}</h2>
            <p className={cn('text-sm', colors.text.secondary)}>Create a medication order for the patient</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTemplateSelector(true)}
            className={cn('inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all', colors.border.primary, colors.bg.hover, colors.text.brand)}
          >
            <FolderOpen className="h-4 w-4" /> Use Template
          </button>
          <button
            type="button"
            onClick={openAddMedicationModal}
            className={cn('inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700')}
          >
            <Plus className="h-4 w-4" /> Add Medication
          </button>
        </div>
      </div>

      {/* Allergy Alert Banner */}
      {allergiesQuery.data?.data && allergiesQuery.data.data.length > 0 && (
        <div className={cn('mb-6 rounded-lg border p-3', isDark ? 'border-yellow-800/50 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50')}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={cn('h-5 w-5 flex-shrink-0', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
            <div>
              <p className={cn('text-sm font-medium', isDark ? 'text-yellow-300' : 'text-yellow-800')}>Patient Allergies</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {allergiesQuery.data.data.map((allergy) => (
                  <span key={allergy.id} className={cn('rounded-full px-2 py-0.5 text-xs', allergy.severity === AllergySeverity.SEVERE ? (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700') : (isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'))}>
                    {allergy.allergen} ({allergy.severity})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Form Column */}
        <div className="xl:col-span-2">
          <div className={cn('rounded-2xl border p-5', colors.border.primary, colors.bg.card)}>
            <h3 className={cn('mb-4 text-base font-semibold', colors.text.primary)}>Prescription Details</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Type</label>
                  <select value={formData.prescription_type} onChange={(e) => handleFormChange('prescription_type', e.target.value as PrescriptionType)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                    {Object.values(PrescriptionType).map((type) => (<option key={type} value={type}>{type}</option>))}
                  </select>
                </div>
                <div>
                  <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Priority</label>
                  <select value={formData.priority} onChange={(e) => handleFormChange('priority', e.target.value as PrescriptionPriority)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}>
                    {Object.values(PrescriptionPriority).map((priority) => (<option key={priority} value={priority}>{priority}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <Stethoscope className="h-4 w-4" /> Diagnosis
                </label>
                <textarea value={formData.diagnosis} onChange={(e) => handleFormChange('diagnosis', e.target.value)} rows={2} placeholder="Primary diagnosis or indication for prescription..." className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
              </div>

              <div>
                <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <FileText className="h-4 w-4" /> Clinical Notes
                </label>
                <textarea value={formData.clinical_notes} onChange={(e) => handleFormChange('clinical_notes', e.target.value)} rows={3} placeholder="Additional clinical notes, treatment plan, etc." className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
              </div>

              <div>
                <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <FileText className="h-4 w-4" /> Special Instructions
                </label>
                <textarea value={formData.special_instructions} onChange={(e) => handleFormChange('special_instructions', e.target.value)} rows={2} placeholder="Special instructions for pharmacist or patient..." className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
              </div>

              <div>
                <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <FileText className="h-4 w-4" /> Patient Education Notes
                </label>
                <textarea value={formData.patient_education_notes} onChange={(e) => handleFormChange('patient_education_notes', e.target.value)} rows={2} placeholder="Information to share with patient about their medication..." className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
              </div>

              <div>
                <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                  <FileText className="h-4 w-4" /> Follow-up Instructions
                </label>
                <textarea value={formData.follow_up_instructions} onChange={(e) => handleFormChange('follow_up_instructions', e.target.value)} rows={2} placeholder="When should the patient follow up?" className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                    <CalendarDays className="h-4 w-4" /> Follow-up Date
                  </label>
                  <input type="date" value={formData.follow_up_date} onChange={(e) => handleFormChange('follow_up_date', e.target.value)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
                </div>
                <div>
                  <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                    <Clock className="h-4 w-4" /> Valid Until
                  </label>
                  <input type="date" value={formData.valid_until} onChange={(e) => handleFormChange('valid_until', e.target.value)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
                {onCancel && (
                  <button type="button" onClick={onCancel} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all', colors.bg.hover, colors.text.secondary)}>
                    <X className="h-4 w-4" /> Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isMutating || isSubmitting || medications.length === 0}
                  className={cn('inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all', (isMutating || isSubmitting || medications.length === 0) ? 'cursor-not-allowed bg-gray-400' : 'cursor-pointer bg-blue-600 hover:bg-blue-700')}
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isEditing ? 'Update Prescription' : 'Save Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Medications Column */}
        <div className="xl:col-span-3">
          <div className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
            <div className={cn('flex items-center justify-between border-b p-4', colors.border.primary)}>
              <div>
                <h3 className={cn('text-base font-semibold', colors.text.primary)}>Medications</h3>
                <p className={cn('text-sm', colors.text.secondary)}>{medications.length} item(s)</p>
              </div>
              <button
                type="button"
                onClick={openAddMedicationModal}
                className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all', colors.bg.hover, colors.text.brand)}
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            <div className="p-4">
              {medications.length === 0 ? (
                <div className={cn('rounded-xl border border-dashed p-8 text-center', colors.border.primary, colors.bg.subtle)}>
                  <Pill className={cn('mx-auto mb-2 h-10 w-10', colors.text.tertiary)} />
                  <p className={cn('text-sm', colors.text.secondary)}>No medications added yet. Click "Add Medication" to start.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {medications.map((med) => (
                    <div key={med.id} className={cn('rounded-lg border p-3', colors.border.primary, colors.bg.subtle)}>
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
                          {med.instructions && <p className={cn('text-xs mt-1', colors.text.tertiary)}>{med.instructions}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => editMedicationHandler(med)} className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => deleteMedicationHandler(med)} className={cn('rounded p-1 transition-colors', colors.bg.hover, 'text-red-500')}>
                            <Trash2 className="h-4 w-4" />
                          </button>
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
      <AnimatePresence>
        {showMedicationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setShowMedicationModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={cn('w-full max-w-2xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}>
              <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
                <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                  {editingMedication ? 'Edit Medication' : 'Add Medication'}
                </h3>
                <button onClick={() => setShowMedicationModal(false)} className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto p-5">
                {allergyAlertVisible && (
                  <div className={cn('mb-4 rounded-lg border p-3', isDark ? 'border-red-800/50 bg-red-900/20' : 'border-red-200 bg-red-50')}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-red-400' : 'text-red-600')} />
                      <p className={cn('text-sm', isDark ? 'text-red-300' : 'text-red-700')}>
                        ⚠️ Allergy Alert: Patient has {allergyAlertVisible.severity} allergy to "{allergyAlertVisible.allergen}"
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Medication Name <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input
                          type="text"
                          value={medicationForm.medication_name}
                          onChange={(e) => handleMedicationChange('medication_name', e.target.value)}
                          className={cn('w-full rounded-lg border p-2 text-sm pr-8', colors.bg.input, colors.text.primary, colors.border.primary)}
                          placeholder="e.g., Amoxicillin"
                          autoFocus
                        />
                        {allergyAlertVisible && <AlertTriangle className="absolute right-2 top-2.5 h-4 w-4 text-red-500" />}
                      </div>
                    </div>
                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Brand Name</label>
                      <input type="text" value={medicationForm.brand_name} onChange={(e) => handleMedicationChange('brand_name', e.target.value)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>Strength</label>
                      <input type="text" value={medicationForm.strength} onChange={(e) => handleMedicationChange('strength', e.target.value)} className={cn('w-full rounded-lg border p-2 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)} placeholder="e.g., 500mg" />
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
                <button onClick={addOrUpdateMedication} disabled={!medicationForm.medication_name.trim() || isMutating} className={cn('rounded-lg px-4 py-2 text-sm font-medium text-white transition-all', !medicationForm.medication_name.trim() || isMutating ? 'cursor-not-allowed bg-gray-400' : 'cursor-pointer bg-blue-600 hover:bg-blue-700')}>
                  {editingMedication ? 'Update Medication' : 'Add Medication'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Template Selector Modal */}
      <AnimatePresence>
        {showTemplateSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setShowTemplateSelector(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={cn('w-full max-w-2xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}>
              <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
                <h3 className={cn('text-lg font-semibold', colors.text.primary)}>Apply Clinical Template</h3>
                <button onClick={() => setShowTemplateSelector(false)} className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates..."
                    className={cn('w-full rounded-lg border py-2 pl-9 pr-3 text-sm', colors.bg.input, colors.text.primary, colors.border.primary)}
                  />
                </div>
                {templatesQuery.isLoading ? (
                  <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} />
                ) : filteredTemplates.length === 0 ? (
                  <div className={cn('rounded-xl border border-dashed p-8 text-center', colors.border.primary, colors.bg.subtle)}>
                    <FolderOpen className={cn('mx-auto mb-2 h-10 w-10', colors.text.tertiary)} />
                    <p className={cn('text-sm', colors.text.secondary)}>No templates found.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplateSelector(false);
                        // Navigate to template creation (using focus mode)
                        window.location.href = FOCUS_MODE_ROUTES.CLINICAL_TEMPLATE_FOCUS;
                      }}
                      className={cn('mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium', colors.bg.hover, colors.text.brand)}
                    >
                      <Plus className="h-4 w-4" /> Create Template
                    </button>
                  </div>
                ) : (
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {filteredTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={cn(
                          'rounded-lg border p-3 cursor-pointer transition-all',
                          colors.border.primary,
                          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                        )}
                        onClick={() => applyTemplate(template)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={cn('font-medium', colors.text.primary)}>{template.name}</p>
                            {template.description && <p className={cn('text-xs', colors.text.secondary)}>{template.description}</p>}
                            <div className="mt-1 flex flex-wrap gap-2">
                              <span className={cn('rounded-full px-2 py-0.5 text-xs', getCategoryBadgeColor(template.category))}>
                                {template.category}
                              </span>
                              <span className={cn('text-xs', colors.text.tertiary)}>{template.default_medications?.length || 0} medication(s)</span>
                            </div>
                          </div>
                          <Copy className={cn('h-4 w-4', colors.text.tertiary)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PrescriptionForm;