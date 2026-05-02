/**
 * vitalsForm.types.ts
 * ============================================================================
 * VITALS FORM TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for the vitals form UI.
 * These types map directly to the backend VitalResponse structure.
 * 
 * MAPPING TO BACKEND (VitalResponse):
 * - temperature           → temperature (with unit)
 * - heartRate             → heart_rate
 * - respiratoryRate       → respiratory_rate
 * - systolicBp            → systolic_bp
 * - diastolicBp           → diastolic_bp
 * - bpPosition            → bp_position
 * - bpLocation            → bp_location
 * - oxygenSaturation      → oxygen_saturation
 * - oxygenFlowRate        → oxygen_flow_rate
 * - oxygenDeliveryDevice  → oxygen_delivery_device
 * - height                → height (with unit)
 * - weight                → weight (with unit)
 * - painScore             → pain_score
 * - painScaleType         → pain_scale_type
 * - painLocation          → pain_location
 * - headCircumference     → head_circumference
 * - length                → length
 * - consciousnessLevel    → consciousness_level
 * - generalAppearance     → general_appearance
 * - measurementMethod     → measurement_method
 * - deviceId              → device_id
 * 
 * DYNAMIC CUSTOM FIELDS:
 * - Clinicians can add unlimited custom fields on the fly
 * - Each field has: label, type, value, optional unit
 * - Stored as JSON in backend custom_fields column
 * 
 * @module vitalsForm.types
 */

import type { LucideIcon } from 'lucide-react';
import type {
  VitalResponse,
  BpPosition,
  ConsciousnessLevel,
  PainScaleType,
  FlagStatus,
} from  '../../../../api/vitals/vitalTypes';

/* -------------------------------------------------------------------------- */
/*                              RE-EXPORT TYPES                               */
/* -------------------------------------------------------------------------- */

// Re-export backend types for use in components
export type { VitalResponse, BpPosition, ConsciousnessLevel, PainScaleType, FlagStatus };

// Type alias for vital list items (same as response)
export type VitalListItem = VitalResponse;

/* -------------------------------------------------------------------------- */
/*                         DYNAMIC CUSTOM FIELDS                              */
/* -------------------------------------------------------------------------- */

/**
 * Type of custom field value - user can choose when adding a field
 */
export type CustomFieldValueType = 'text' | 'number' | 'textarea' | 'date';

/**
 * Dynamic custom field entered by clinician on the fly
 * User can add unlimited fields with any label and value
 */
export interface DynamicCustomField {
  /** Unique ID for React key (generated via crypto.randomUUID()) */
  id: string;
  /** Field label (user-defined, e.g., "Blood Glucose") */
  label: string;
  /** Field type (user-selected from dropdown) */
  type: CustomFieldValueType;
  /** Current value entered by clinician */
  value: string | number | null;
  /** Optional unit (e.g., "mg/dL", "L/min") */
  unit?: string;
}

/**
 * Collection of dynamic custom fields
 */
export type DynamicCustomFields = DynamicCustomField[];

/* -------------------------------------------------------------------------- */
/*                              FORM VALUES                                   */
/* -------------------------------------------------------------------------- */

/**
 * Vitals form values
 * These map directly to backend vital sign fields
 */
export interface VitalsFormValues {
  // Core Vital Signs
  /** Body temperature */
  temperature: number | null;
  /** Temperature unit: celsius or fahrenheit */
  temperatureUnit: 'celsius' | 'fahrenheit';
  /** Heart rate in beats per minute */
  heartRate: number | null;
  /** Respiratory rate in breaths per minute */
  respiratoryRate: number | null;
  /** Systolic blood pressure in mmHg */
  systolicBp: number | null;
  /** Diastolic blood pressure in mmHg */
  diastolicBp: number | null;
  /** Position when BP was measured */
  bpPosition: BpPosition | null;
  /** Location where BP was measured (left_arm, right_arm, etc.) */
  bpLocation: string | null;
  
  // Advanced Vitals
  /** Oxygen saturation percentage (SpO2) */
  oxygenSaturation: number | null;
  /** Oxygen flow rate in L/min */
  oxygenFlowRate: number | null;
  /** Oxygen delivery device (nasal_cannula, mask, etc.) */
  oxygenDeliveryDevice: string | null;
  /** Height measurement */
  height: number | null;
  /** Height unit: cm or inches */
  heightUnit: 'cm' | 'inches';
  /** Weight measurement */
  weight: number | null;
  /** Weight unit: kg or lbs */
  weightUnit: 'kg' | 'lbs';
  /** Calculated BMI (auto-calculated from height/weight) */
  bmi: number | null;
  /** Pain score (0-10) */
  painScore: number | null;
  /** Type of pain scale used */
  painScaleType: PainScaleType;
  /** Location of pain */
  painLocation: string | null;
  
  // Pediatric Vitals
  /** Head circumference in cm (pediatric) */
  headCircumference: number | null;
  /** Length in cm (pediatric) */
  length: number | null;
  
  // Measurement Context
  /** When vitals were measured */
  measuredAt: string | null;
  /** Equipment or method used */
  measurementMethod: string | null;
  /** ID of monitoring device if applicable */
  deviceId: string | null;
  /** Consciousness level (AVPU scale) */
  consciousnessLevel: ConsciousnessLevel | null;
  /** General observation notes */
  generalAppearance: string | null;
  
  // Dynamic Custom Fields (User-Addable)
  /** User-defined custom fields - clinicians can add unlimited */
  dynamicCustomFields: DynamicCustomFields;
}

/**
 * Form data alias for consistency
 */
export type VitalsFormData = VitalsFormValues;

/* -------------------------------------------------------------------------- */
/*                              UI STATE TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Current mode of the vitals form
 * - idle: Viewing existing vitals or empty state
 * - create: Creating new vitals
 * - edit: Editing existing vitals
 */
export type VitalsMode = 'idle' | 'create' | 'edit';

/**
 * Preview action types for the modal
 * - preview: Just show the preview
 * - print: Show preview and trigger print dialog
 * - download: Show preview and trigger PDF download
 */
export type VitalsPreviewAction = 'preview' | 'print' | 'download';

/* -------------------------------------------------------------------------- */
/*                              THEME TOKENS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Theme color tokens for consistent styling across components
 * Supports light and dark modes
 */
export interface VitalsThemeTokens {
  bg: {
    page: string;
    card: string;
    subtle: string;
    hover: string;
    input: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    brand: string;
  };
  border: {
    primary: string;
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

/* -------------------------------------------------------------------------- */
/*                           SECTION DEFINITIONS                              */
/* -------------------------------------------------------------------------- */

/**
 * Section definition for grouping vitals form fields
 */
export interface VitalsSectionDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  fields: VitalsFieldDefinition[];
  gridCols?: 1 | 2 | 3 | 4;
}

/**
 * Field definition for vitals form fields
 */
export interface VitalsFieldDefinition {
  key: keyof VitalsFormValues;
  label: string;
  type: 'number' | 'text' | 'select' | 'textarea' | 'unit-toggle';
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  unitOptions?: Array<{ value: 'celsius' | 'fahrenheit' | 'cm' | 'inches' | 'kg' | 'lbs'; label: string }>;
  unitField?: keyof VitalsFormValues;
  previewFallback: string;
  colSpan?: number;
}

/* -------------------------------------------------------------------------- */
/*                              COMPONENT PROPS                               */
/* -------------------------------------------------------------------------- */

export interface VitalsFieldProps {
  field: VitalsFieldDefinition;
  value: number | string | null;
  unitValue?: 'celsius' | 'fahrenheit' | 'cm' | 'inches' | 'kg' | 'lbs';
  error?: string;
  isDark: boolean;
  colors: VitalsThemeTokens;
  autoFocus?: boolean;
  onChange: (key: keyof VitalsFormValues, value: number | string | null) => void;
  onUnitChange?: (key: keyof VitalsFormValues, value: string) => void;
}

export interface VitalsHeaderProps {
  isDark: boolean;
  colors: VitalsThemeTokens;
  hasActiveVisit: boolean;
  hasExistingVitals: boolean;
  vitalsCount: number;
  isFetching: boolean;
  onRefresh?: () => void;
}

export interface VitalsEmptyStateProps {
  isDark: boolean;
  colors: VitalsThemeTokens;
  patientId?: number | null;
  onCreate: () => void;
}

export interface VitalsEditorProps {
  isDark: boolean;
  colors: VitalsThemeTokens;
  mode: VitalsMode;
  formData: VitalsFormValues;
  fieldErrors: Partial<Record<keyof VitalsFormValues, string>>;
  formError: string | null;
  isSubmitting: boolean;
  customFields: DynamicCustomFields;
  onChange: (field: keyof VitalsFormValues, value: number | string | null) => void;
  onUnitChange: (field: keyof VitalsFormValues, value: string) => void;
  onCustomFieldsChange: (fields: DynamicCustomFields) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export interface VitalsSummaryCardProps {
  isDark: boolean;
  colors: VitalsThemeTokens;
  vitals: VitalResponse;
  customFields: DynamicCustomFields;
  onEdit: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

export interface VitalsPreviewDocumentProps {
  vitals: VitalResponse | null;
  values: VitalsFormValues;
}

export interface VitalsPreviewModalProps {
  open: boolean;
  onClose: () => void;
  vitals: VitalResponse | null;
  values: VitalsFormValues;
  initialAction?: VitalsPreviewAction;
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export interface MutationCallbacks<TData, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export type FormFieldErrors = Partial<Record<keyof VitalsFormValues, string>>;
