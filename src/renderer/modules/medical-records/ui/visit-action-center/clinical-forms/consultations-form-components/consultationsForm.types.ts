/**
 * consultationsForm.types.ts
 * ============================================================================
 * CONSULTATIONS FORM TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for the consultations form UI.
 * These types map directly to the backend ConsultationResponse structure.
 * 
 * MAPPING TO BACKEND (ConsultationResponse):
 * - specialtyRequired     → specialty_required
 * - clinicalQuestion      → clinical_question
 * - backgroundInformation → background_information
 * - consultationType      → consultation_type
 * - priority              → priority
 * - scheduledFor          → scheduled_for
 * - location              → location
 * - durationMinutes       → duration_minutes
 * - requiresFollowup      → requires_followup
 * - followupBy            → followup_by
 * - followupInstructions  → followup_instructions
 * - findings              → findings
 * - recommendations       → recommendations
 * - recommendedOrders     → recommended_orders
 * - consultantNotes       → consultant_notes
 * 
 * WORKFLOW STATUS:
 * - request_status → pending, accepted, declined, completed, cancelled
 * 
 * @module consultationsForm.types
 */

import type { LucideIcon } from 'lucide-react';
import type {
  ConsultationResponse,
  ConsultationType,
  ConsultationPriority,
  ConsultationStatus,
  RecommendedOrders,
} from '../../../../api/consultations/consultationTypes';

/* -------------------------------------------------------------------------- */
/*                              RE-EXPORT TYPES                               */
/* -------------------------------------------------------------------------- */

// Re-export backend types for use in components
export type {
  ConsultationResponse,
  ConsultationType,
  ConsultationPriority,
  ConsultationStatus,
  RecommendedOrders,
};

// Type alias for consultation list items (same as response)
export type ConsultationListItem = ConsultationResponse;

/* -------------------------------------------------------------------------- */
/*                         DYNAMIC CUSTOM FIELDS                              */
/* -------------------------------------------------------------------------- */

/**
 * Type of custom field value - user can choose when adding a field
 */
export type CustomFieldValueType = 'text' | 'textarea' | 'date';

/**
 * Dynamic custom field entered by clinician on the fly
 * For facility-specific consultation fields
 */
export interface DynamicCustomField {
  /** Unique ID for React key (generated via crypto.randomUUID()) */
  id: string;
  /** Field label (user-defined) */
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
 * Consultations form values
 * These map directly to backend consultation fields
 */
export interface ConsultationsFormValues {
  // Request Details
  /** Medical specialty required for consultation */
  specialtyRequired: string;
  /** Clinical question or reason for consultation */
  clinicalQuestion: string;
  /** Background information about the case */
  backgroundInformation: string | null;
  
  // Consultation Type & Priority
  /** Type of consultation (in_person, telemedicine, etc.) */
  consultationType: ConsultationType;
  /** Priority level (routine, urgent, emergent) */
  priority: ConsultationPriority;
  
  // Scheduling
  /** Scheduled date and time for the consultation */
  scheduledFor: string | null;
  /** Location of consultation (room or virtual link) */
  location: string | null;
  /** Expected duration in minutes */
  durationMinutes: number;

  request_status?:ConsultationStatus;
  
  // Follow-up
  /** Whether follow-up consultation is needed */
  requiresFollowup: boolean;
  /** Recommended follow-up date */
  followupBy: string | null;
  /** Specific follow-up instructions */
  followupInstructions: string | null;
  
  // Consultation Response (for consultants)
  /** Consultant's clinical findings */
  findings: string | null;
  /** Consultant's recommendations */
  recommendations: string | null;
  /** Recommended orders (labs, imaging, medications, procedures) */
  recommendedOrders: RecommendedOrders | null;
  /** Additional consultant notes */
  consultantNotes: string | null;
  
  // Attachments
  /** Array of document IDs or file paths */
  attachedDocuments: string[] | null;
  
  // Custom Fields (Facility-specific)
  /** User-defined custom fields */
  dynamicCustomFields: DynamicCustomFields;
}

/**
 * Form data alias for consistency
 */
export type ConsultationsFormData = ConsultationsFormValues;

/* -------------------------------------------------------------------------- */
/*                              UI STATE TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Current mode of the consultations form
 * - idle: Viewing existing consultation or empty state
 * - create: Creating a new consultation request
 * - edit: Editing an existing consultation
 */
export type ConsultationsMode = 'idle' | 'create' | 'edit';

/**
 * Preview action types for the modal
 * - preview: Just show the preview
 * - print: Show preview and trigger print dialog
 * - download: Show preview and trigger PDF download
 */
export type ConsultationsPreviewAction = 'preview' | 'print' | 'download';

/* -------------------------------------------------------------------------- */
/*                              THEME TOKENS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Theme color tokens for consistent styling across components
 * Supports light and dark modes
 */
export interface ConsultationsThemeTokens {
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
 * Section definition for grouping consultations form fields
 */
export interface ConsultationsSectionDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  fields: ConsultationsFieldDefinition[];
  gridCols?: 1 | 2 | 3 | 4;
}

/**
 * Field definition for consultations form fields
 */
export interface ConsultationsFieldDefinition {
  key: keyof ConsultationsFormValues;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'datetime-local' | 'number' | 'checkbox' | 'combobox';
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  previewFallback: string;
  colSpan?: number;
}

/* -------------------------------------------------------------------------- */
/*                              COMPONENT PROPS                               */
/* -------------------------------------------------------------------------- */

export interface ConsultationsFieldProps {
  field: ConsultationsFieldDefinition;
  value: string | number | boolean | string[] | null;
  error?: string;
  isDark: boolean;
  colors: ConsultationsThemeTokens;
  autoFocus?: boolean;
  onChange: (key: keyof ConsultationsFormValues, value: string | number | boolean | string[] | null) => void;
}

export interface ConsultationsHeaderProps {
  isDark: boolean;
  colors: ConsultationsThemeTokens;
  hasActiveVisit: boolean;
  hasExistingConsultation: boolean;
  consultationsCount: number;
  isFetching: boolean;
  onRefresh?: () => void;
}

export interface ConsultationsEmptyStateProps {
  isDark: boolean;
  colors: ConsultationsThemeTokens;
  patientId?: number | null;
  onCreate: () => void;
}

export interface ConsultationsEditorProps {
  isDark: boolean;
  colors: ConsultationsThemeTokens;
  mode: ConsultationsMode;
  formData: ConsultationsFormValues;
  customFields: DynamicCustomFields;
  fieldErrors: Partial<Record<keyof ConsultationsFormValues, string>>;
  formError: string | null;
  isSubmitting: boolean;
  isAccepting?: boolean;
  isDeclining?: boolean;
  isCompleting?: boolean;
  isCancelling?: boolean;
  isScheduling?: boolean;
  onChange: (field: keyof ConsultationsFormValues, value: string | number | boolean | string[] | null) => void;
  onCustomFieldsChange: (fields: DynamicCustomFields) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onComplete?: () => void;
  onCancelRequest?: () => void;
  onSchedule?: () => void;
}

export interface ConsultationsSummaryCardProps {
  isDark: boolean;
  colors: ConsultationsThemeTokens;
  consultation: ConsultationResponse;
  customFields: DynamicCustomFields;
  onEdit: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onComplete?: () => void;
  onCancelRequest?: () => void;
  onSchedule?: () => void;
  onRestore?: () => void;
}

export interface ConsultationsPreviewDocumentProps {
  consultation: ConsultationResponse | null;
  values: ConsultationsFormValues;
}

export interface ConsultationsPreviewModalProps {
  open: boolean;
  onClose: () => void;
  consultation: ConsultationResponse | null;
  values: ConsultationsFormValues;
  initialAction?: ConsultationsPreviewAction;
}

export interface ConsultationsFocusProps {
  theme?: 'light' | 'dark';
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export interface MutationCallbacks<TData, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export type FormFieldErrors = Partial<Record<keyof ConsultationsFormValues, string>>;
