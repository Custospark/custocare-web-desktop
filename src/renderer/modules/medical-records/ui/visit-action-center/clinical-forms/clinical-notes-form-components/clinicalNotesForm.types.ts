/**
 * clinicalNotesForm.types.ts
 * ============================================================================
 * CLINICAL NOTES FORM TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for the clinical notes form UI.
 * These types map directly to the backend ClinicalNoteResponse structure.
 * 
 * MAPPING TO BACKEND (ClinicalNoteResponse):
 * - chiefComplaint        → subjective (Patient's main concern)
 * - historyOfPresentIllness → review_of_systems (HPI / system review)
 * - pastMedicalHistory    → past_medical_history
 * - observations          → objective (Physical exam findings)
 * - clinicalNotes         → assessment + plan (Clinical impression & treatment plan)
 * 
 * @module clinicalNotesForm.types
 */

import type { LucideIcon } from 'lucide-react';
import type { ClinicalNoteResponse } from '../../../../api/clinical-notes/clinicalNoteTypes';

/* -------------------------------------------------------------------------- */
/*                              RE-EXPORT TYPES                               */
/* -------------------------------------------------------------------------- */

// Re-export backend type for use in components
export type { ClinicalNoteResponse };

// Type alias for note list items (same as response)
export type ClinicalNoteListItem = ClinicalNoteResponse;

/* -------------------------------------------------------------------------- */
/*                              FORM VALUES                                   */
/* -------------------------------------------------------------------------- */

/**
 * Clinical notes form values
 * These map directly to backend SOAP note fields
 */
export interface ClinicalNotesFormValues {
  /** Maps to backend: subjective - Patient's chief complaint / reason for visit */
  chiefComplaint: string;
  
  /** Maps to backend: review_of_systems - HPI, symptom progression, associated symptoms */
  historyOfPresentIllness: string;
  
  /** Maps to backend: past_medical_history - PMH, surgeries, allergies, medications */
  pastMedicalHistory: string;
  
  /** Maps to backend: objective - Physical exam findings, vital signs, observations */
  observations: string;
  
  /** Maps to backend: assessment + plan - Clinical impression, diagnosis, treatment plan */
  clinicalNotes: string;
}

/**
 * Form data alias for consistency
 */
export type ClinicalNotesFormData = ClinicalNotesFormValues;

/* -------------------------------------------------------------------------- */
/*                              UI STATE TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Current mode of the clinical notes form
 * - idle: Viewing existing note or empty state
 * - create: Creating a new note
 * - edit: Editing an existing note
 */
export type ClinicalNotesMode = 'idle' | 'create' | 'edit';

/**
 * Preview action types for the modal
 * - preview: Just show the preview
 * - print: Show preview and trigger print dialog
 * - download: Show preview and trigger PDF download
 */
export type ClinicalNotesPreviewAction = 'preview' | 'print' | 'download';

/* -------------------------------------------------------------------------- */
/*                              THEME TOKENS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Theme color tokens for consistent styling across components
 * Supports light and dark modes
 */
export interface ClinicalNotesThemeTokens {
  bg: {
    page: string;      // Page background
    card: string;      // Card background
    subtle: string;    // Subtle background (hover states)
    hover: string;     // Hover state background
    input: string;     // Input field background
  };
  text: {
    primary: string;   // Primary text color
    secondary: string; // Secondary text color
    tertiary: string;  // Tertiary text color (muted)
    brand: string;     // Brand/accent text color
  };
  border: {
    primary: string;   // Primary border color
    focus: string;     // Focus ring/border color
  };
  state: {
    success: string;       // Success text color
    successSoft: string;   // Success background (soft)
    warning: string;       // Warning text color
    warningSoft: string;   // Warning background (soft)
    info: string;          // Info text color
    infoSoft: string;      // Info background (soft)
    danger: string;        // Danger text color
    dangerSoft: string;    // Danger background (soft)
  };
}

/* -------------------------------------------------------------------------- */
/*                              SECTION DEFINITION                            */
/* -------------------------------------------------------------------------- */

/**
 * Section definition for the clinical notes form
 * Defines each field's display properties and mapping to backend
 */
export interface ClinicalNotesSectionDefinition {
  /** Form field key (matches ClinicalNotesFormValues) */
  key: keyof ClinicalNotesFormValues;
  
  /** Display label for the section */
  label: string;
  
  /** Helper text description */
  description: string;
  
  /** Placeholder text for textarea */
  placeholder: string;
  
  /** Number of rows for textarea */
  rows: number;
  
  /** Whether the field is required */
  required?: boolean;
  
  /** Fallback text when field is empty in preview */
  previewFallback: string;
  
  /** Icon component for the section */
  icon: LucideIcon;
  
  /** Optional: Backend field mapping (for documentation) */
  backendField?: string;
}

/* -------------------------------------------------------------------------- */
/*                              COMPONENT PROPS                               */
/* -------------------------------------------------------------------------- */

// Forward declarations for component props used across files
// These are documented in their respective component files

export interface ClinicalNotesFieldProps {
  label: string;
  description?: string;
  placeholder: string;
  value: string;
  rows?: number;
  required?: boolean;
  error?: string;
  icon: LucideIcon;
  isDark: boolean;
  colors: ClinicalNotesThemeTokens;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

export interface ClinicalNotesHeaderProps {
  isDark: boolean;
  colors: ClinicalNotesThemeTokens;
  hasActiveVisit: boolean;
  hasExistingNote: boolean;
  noteCount: number;
  isFetching: boolean;
  onBack?: () => void;
}

export interface ClinicalNotesEmptyStateProps {
  isDark: boolean;
  colors: ClinicalNotesThemeTokens;
  patientId?: number | null;
  onCreate: () => void;
}

export interface ClinicalNotesEditorProps {
  isDark: boolean;
  colors: ClinicalNotesThemeTokens;
  mode: ClinicalNotesMode;
  formData: ClinicalNotesFormValues;
  fieldErrors: Partial<Record<keyof ClinicalNotesFormValues, string>>;
  formError: string | null;
  isSubmitting: boolean;
  onChange: (field: keyof ClinicalNotesFormValues, value: string) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export interface ClinicalNotesSummaryCardProps {
  isDark: boolean;
  colors: ClinicalNotesThemeTokens;
  note: ClinicalNoteResponse;
  values: ClinicalNotesFormValues;
  noteTitle: string;
  onEdit: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onDownload: () => void;
}

export interface ClinicalNotesPreviewDocumentProps {
  note: ClinicalNoteResponse | null;
  values: ClinicalNotesFormValues;
  noteTitle: string;
}

export interface ClinicalNotesPreviewModalProps {
  open: boolean;
  onClose: () => void;
  note: ClinicalNoteResponse | null;
  values: ClinicalNotesFormValues;
  noteTitle: string;
  initialAction?: ClinicalNotesPreviewAction;
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Mutation callbacks for React Query mutations
 */
export interface MutationCallbacks<TData, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Field errors mapping for form validation
 */
export type FormFieldErrors = Partial<Record<keyof ClinicalNotesFormValues, string>>;
