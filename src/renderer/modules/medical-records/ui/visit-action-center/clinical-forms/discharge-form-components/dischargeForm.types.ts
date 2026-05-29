import type {
  DischargeData,
  DischargeDisposition,
} from '../../../../api/discharge/DischargeTypes';

export interface DischargeMedicationFormItem {
  tempId: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  durationDays: number | null;
}

export interface DischargeFormValues {
  dischargedAt: string;
  dischargeDisposition: DischargeDisposition | '';
  dischargeDiagnosis: string;
  dischargeInstructions: string;
  dischargeMedications: DischargeMedicationFormItem[];
  followupScheduledAt: string;
  followupProviderStaffId: number | null;
}

export type DischargeMode = 'idle' | 'create' | 'edit';

export type DischargePreviewAction = 'preview' | 'print' | 'download';

export const EMPTY_MEDICATION_ITEM: DischargeMedicationFormItem = {
  tempId: '',
  name: '',
  dosage: '',
  frequency: '',
  route: 'oral',
  durationDays: null,
};

export const EMPTY_DISCHARGE_FORM: DischargeFormValues = {
  dischargedAt: new Date().toISOString().slice(0, 16),
  dischargeDisposition: '',
  dischargeDiagnosis: '',
  dischargeInstructions: '',
  dischargeMedications: [],
  followupScheduledAt: '',
  followupProviderStaffId: null,
};

export const DISCHARGE_DISPOSITION_OPTIONS = [
  { value: 'home', label: 'Home / Self-Care' },
  { value: 'admitted_to_hospital', label: 'Admitted to Hospital' },
  { value: 'transferred_to_facility', label: 'Transferred to Another Facility' },
  { value: 'left_ama', label: 'Left Against Medical Advice (AMA)' },
  { value: 'left_without_seen', label: 'Left Without Being Seen' },
  { value: 'expired', label: 'Expired' },
  { value: 'hospice', label: 'Hospice Care' },
  { value: 'skilled_nursing_facility', label: 'Skilled Nursing Facility' },
  { value: 'rehabilitation_facility', label: 'Rehabilitation Facility' },
  { value: 'psychiatric_facility', label: 'Psychiatric Facility' },
  { value: 'law_enforcement_custody', label: 'Law Enforcement Custody' },
];

export const MEDICATION_ROUTE_OPTIONS = [
  { value: 'oral', label: 'Oral' },
  { value: 'IV', label: 'Intravenous (IV)' },
  { value: 'IM', label: 'Intramuscular (IM)' },
  { value: 'subcutaneous', label: 'Subcutaneous' },
  { value: 'topical', label: 'Topical' },
  { value: 'inhaled', label: 'Inhaled' },
  { value: 'rectal', label: 'Rectal' },
  { value: 'ophthalmic', label: 'Ophthalmic' },
  { value: 'otic', label: 'Otic' },
  { value: 'buccal', label: 'Buccal' },
];

export interface ColorTokens {
  bg: {
    card: string;
    input: string;
    subtle: string;
    hover: string;
    muted: string;
    modal: string;
    page: string;
    brandSoft: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    brand: string;
  };
  border: {
    primary: string;
    subtle: string;
    focus: string;
  };
  state: {
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    info: string;
    infoSoft: string;
    danger: string;
    dangerSoft: string;
  };
}

export const getColors = (theme: 'light' | 'dark'): ColorTokens => {
  const isDark = theme === 'dark';
  return {
    bg: {
      card: isDark ? 'bg-gray-900' : 'bg-white',
      input: isDark ? 'bg-gray-800' : 'bg-gray-50',
      subtle: isDark ? 'bg-gray-800/60' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
      muted: isDark ? 'bg-gray-800' : 'bg-gray-100',
      modal: isDark ? 'bg-gray-900/95' : 'bg-white/95',
      page: isDark ? 'bg-gray-950' : 'bg-gray-50',
      brandSoft: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
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
    state: {
      success: isDark ? 'text-emerald-300' : 'text-emerald-700',
      successSoft: isDark ? 'bg-emerald-950/40' : 'bg-emerald-50',
      warning: isDark ? 'text-amber-300' : 'text-amber-700',
      warningSoft: isDark ? 'bg-amber-950/40' : 'bg-amber-50',
      info: isDark ? 'text-blue-300' : 'text-blue-700',
      infoSoft: isDark ? 'bg-blue-950/40' : 'bg-blue-50',
      danger: isDark ? 'text-red-300' : 'text-red-700',
      dangerSoft: isDark ? 'bg-red-950/40' : 'bg-red-50',
    },
  };
};

export interface MutationCallbacks<TData, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export type { DischargeData, DischargeDisposition };
