/**
 * diagnosesForm.types.ts
 * ============================================================================
 * DIAGNOSES FORM TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for the diagnoses form UI.
 * These types map directly to the backend DiagnosisResponse structure.
 * 
 * MAPPING TO BACKEND (DiagnosisResponse):
 * - diagnosisCode        → diagnosis_code
 * - diagnosisDescription → diagnosis_description
 * - diagnosisType        → diagnosis_type
 * - certainty            → certainty
 * - clinicalStatus       → clinical_status
 * - clinicalNotes        → clinical_notes
 * - onsetDate            → onset_date
 * - abatementDate        → abatement_date
 * - diagnosticCriteriaMet → diagnostic_criteria_met
 * - supportingEvidence   → supporting_evidence (labs, imaging, clinical_findings)
 * 
 * WORKFLOW STATUS:
 * - verificationStatus   → draft, verified, disputed, invalidated
 * 
 * @module diagnosesForm.types
 */

import type { LucideIcon } from 'lucide-react';
import type {
  DiagnosisResponse,
  DiagnosisType,
  DiagnosisCertainty,
  DiagnosisClinicalStatus,
  DiagnosisVerificationStatus,
  SupportingEvidence,
} from '../../../../api/diagnosis/diagnosisTypes';

/* -------------------------------------------------------------------------- */
/*                              RE-EXPORT TYPES                               */
/* -------------------------------------------------------------------------- */

// Re-export backend types for use in components
export type {
  DiagnosisResponse,
  DiagnosisType,
  DiagnosisCertainty,
  DiagnosisClinicalStatus,
  DiagnosisVerificationStatus,
  SupportingEvidence,
};

// Type alias for diagnosis list items (same as response)
export type DiagnosisListItem = DiagnosisResponse;

/* -------------------------------------------------------------------------- */
/*                         DYNAMIC CUSTOM FIELDS                              */
/* -------------------------------------------------------------------------- */

/**
 * Type of custom field value - user can choose when adding a field
 */
export type CustomFieldValueType = 'text' | 'textarea' | 'date';

/**
 * Dynamic custom field entered by clinician on the fly
 * For facility-specific diagnosis fields
 */
export interface DynamicCustomField {
  /** Unique ID for React key (generated via crypto.randomUUID()) */
  id: string;
  /** Field label (user-defined, e.g., "Treatment Response") */
  label: string;
  /** Field type (user-selected from dropdown) */
  type: CustomFieldValueType;
  /** Current value entered by clinician */
  value: string | null;
}

/**
 * Collection of dynamic custom fields
 */
export type DynamicCustomFields = DynamicCustomField[];

/* -------------------------------------------------------------------------- */
/*                              FORM VALUES                                   */
/* -------------------------------------------------------------------------- */

/**
 * Diagnoses form values
 * These map directly to backend diagnosis fields
 */
export interface DiagnosesFormValues {
  // Core Diagnosis Data
  /** ICD-10/11 diagnosis code */
  diagnosisCode: string;
  /** Human-readable diagnosis description */
  diagnosisDescription: string;
  /** Type of diagnosis (primary, secondary, differential, etc.) */
  diagnosisType: DiagnosisType;
  /** Certainty level of the diagnosis */
  certainty: DiagnosisCertainty;
  /** Current clinical status of the diagnosis */
  clinicalStatus: DiagnosisClinicalStatus;
  /**VerificationStatus */
  verificationStatus?: DiagnosisVerificationStatus;
  /** Additional clinical notes specific to this diagnosis */
  clinicalNotes: string | null;
  /** Date of symptom/disease onset */
  onsetDate: string | null;
  /** Date when condition resolved */
  abatementDate: string | null;
  
  // Supporting Evidence
  /** Specific criteria used to establish diagnosis */
  diagnosticCriteriaMet: string | null;
  /** Supporting evidence (labs, imaging, clinical findings) */
  supportingEvidence: SupportingEvidence | null;
  
  // Custom Fields (Facility-specific)
  /** User-defined custom fields - clinicians can add unlimited */
  dynamicCustomFields: DynamicCustomFields;
}

/**
 * Form data alias for consistency
 */
export type DiagnosesFormData = DiagnosesFormValues;

/* -------------------------------------------------------------------------- */
/*                              UI STATE TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Current mode of the diagnoses form
 * - idle: Viewing existing diagnoses or empty state
 * - create: Creating a new diagnosis
 * - edit: Editing an existing diagnosis
 */
export type DiagnosesMode = 'idle' | 'create' | 'edit';

/**
 * Preview action types for the modal
 * - preview: Just show the preview
 * - print: Show preview and trigger print dialog
 * - download: Show preview and trigger PDF download
 */
export type DiagnosesPreviewAction = 'preview' | 'print' | 'download';

/* -------------------------------------------------------------------------- */
/*                              THEME TOKENS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Theme color tokens for consistent styling across components
 * Supports light and dark modes
 */
export interface DiagnosesThemeTokens {
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
 * Section definition for grouping diagnoses form fields
 */
export interface DiagnosesSectionDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  fields: DiagnosesFieldDefinition[];
  gridCols?: 1 | 2 | 3 | 4;
}

/**
 * Field definition for diagnoses form fields
 */
export interface DiagnosesFieldDefinition {
  key: keyof DiagnosesFormValues;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date';
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  previewFallback: string;
  colSpan?: number;
}

/* -------------------------------------------------------------------------- */
/*                              COMPONENT PROPS                               */
/* -------------------------------------------------------------------------- */

export interface DiagnosesFieldProps {
  field: DiagnosesFieldDefinition;
  value: string | null;
  error?: string;
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  autoFocus?: boolean;
  onChange: (key: keyof DiagnosesFormValues, value: string | null) => void;
}

export interface DiagnosesHeaderProps {
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  hasActiveVisit: boolean;
  hasExistingDiagnoses: boolean;
  diagnosesCount: number;
  isFetching: boolean;
  onRefresh?: () => void;
}

export interface DiagnosesEmptyStateProps {
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  patientId?: number | null;
  onCreate: () => void;
}

export interface DiagnosesEditorProps {
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  mode: DiagnosesMode;
  formData: DiagnosesFormValues;
  customFields: DynamicCustomFields;
  fieldErrors: Partial<Record<keyof DiagnosesFormValues, string>>;
  formError: string | null;
  isSubmitting: boolean;
  isVerifying?: boolean;
  isDisputing?: boolean;
  isResolving?: boolean;
  isReactivating?: boolean;
  onChange: (field: keyof DiagnosesFormValues, value: string | null) => void;
  onCustomFieldsChange: (fields: DynamicCustomFields) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onVerify?: () => void;
  onDispute?: () => void;
  onResolve?: () => void;
  onReactivate?: () => void;
}

export interface DiagnosesSummaryCardProps {
  isDark: boolean;
  colors: DiagnosesThemeTokens;
  diagnosis: DiagnosisResponse;
  customFields: DynamicCustomFields;
  onEdit: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onVerify?: () => void;
  onDispute?: () => void;
  onResolve?: () => void;
  onReactivate?: () => void;
  onRestore?: () => void;
}

export interface DiagnosesPreviewDocumentProps {
  diagnosis: DiagnosisResponse | null;
  values: DiagnosesFormValues;
}

export interface DiagnosesPreviewModalProps {
  open: boolean;
  onClose: () => void;
  diagnosis: DiagnosisResponse | null;
  values: DiagnosesFormValues;
  initialAction?: DiagnosesPreviewAction;
}

export interface DiagnosesFocusProps {
  theme?: 'light' | 'dark';
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export interface MutationCallbacks<TData, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export type FormFieldErrors = Partial<Record<keyof DiagnosesFormValues, string>>;
