/**
 * allergiesForm.types.ts
 * ============================================================================
 * ALLERGIES FORM TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for the allergies form UI.
 * These types map directly to the backend AllergyResponse structure.
 * 
 * MAPPING TO BACKEND (Allergy):
 * - allergen        → allergen
 * - reaction        → reaction
 * - severity        → severity
 * - clinicalNotes   → clinical_notes
 * - diagnosedAt     → diagnosed_at
 * - isActive        → is_active
 * 
 * @module allergiesForm.types
 */

import type { LucideIcon } from 'lucide-react';
import type {
  Allergy,
  AllergySeverity,
  UserReference,
  VisitReference,
} from '../../../../api/allergies/AllergyTypes';

/* -------------------------------------------------------------------------- */
/*                              RE-EXPORT TYPES                               */
/* -------------------------------------------------------------------------- */

// Re-export backend types for use in components
export type { Allergy, AllergySeverity, UserReference, VisitReference };

// Type alias for allergy list items (same as response)
export type AllergyListItem = Allergy;

/* -------------------------------------------------------------------------- */
/*                              FORM VALUES                                   */
/* -------------------------------------------------------------------------- */

/**
 * Allergies form values
 * These map directly to backend allergy fields
 */
export interface AllergiesFormValues {
  /** Allergen name (e.g., Penicillin, Peanuts, Latex) */
  allergen: string;
  /** Reaction description (signs and symptoms) */
  reaction: string;
  /** Severity level (mild, moderate, severe) */
  severity: AllergySeverity;
  /** Additional clinical notes */
  clinicalNotes: string;
  /** Diagnosis date */
  diagnosedAt: string;
  /** Whether the allergy is active */
  isActive: boolean;
}

/**
 * Form data alias for consistency
 */
export type AllergiesFormData = AllergiesFormValues;

/* -------------------------------------------------------------------------- */
/*                              UI STATE TYPES                                */
/* -------------------------------------------------------------------------- */

/**
 * Current mode of the allergies form
 * - idle: Viewing existing allergies or empty state
 * - create: Creating a new allergy
 * - edit: Editing an existing allergy
 */
export type AllergiesMode = 'idle' | 'create' | 'edit';

/**
 * Preview action types for the modal
 * - preview: Just show the preview
 * - print: Show preview and trigger print dialog
 * - download: Show preview and trigger PDF download
 */
export type AllergiesPreviewAction = 'preview' | 'print' | 'download';

/* -------------------------------------------------------------------------- */
/*                              THEME TOKENS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Theme color tokens for consistent styling across components
 * Supports light and dark modes
 */
export interface AllergiesThemeTokens {
  bg: {
    page: string;
    card: string;
    subtle: string;
    hover: string;
    input: string;
    muted: string;
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

/* -------------------------------------------------------------------------- */
/*                              COMPONENT PROPS                               */
/* -------------------------------------------------------------------------- */

export interface AllergiesFieldProps {
  label: string;
  description?: string;
  placeholder: string;
  value: string;
  type?: 'text' | 'textarea' | 'select' | 'date';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  error?: string;
  icon: LucideIcon;
  isDark: boolean;
  colors: AllergiesThemeTokens;
  autoFocus?: boolean;
  rows?: number;
  onChange: (value: string) => void;
}

export interface AllergiesHeaderProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  hasActiveVisit: boolean;
  hasExistingAllergies: boolean;
  allergiesCount: number;
  activeCount: number;
  severeCount: number;
  isFetching: boolean;
  onRefresh?: () => void;
  onPreview?: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export interface AllergiesEmptyStateProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  patientId?: number | null;
  onCreate: () => void;
}

export interface AllergiesEditorProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  mode: AllergiesMode;
  formData: AllergiesFormValues;
  fieldErrors: Partial<Record<keyof AllergiesFormValues, string>>;
  formError: string | null;
  isSubmitting: boolean;
  editingAllergyId?: number | null;
  onChange: (field: keyof AllergiesFormValues, value: string | boolean) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export interface AllergiesListProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  allergies: Allergy[];
  editingAllergyId: number | null;
  isMutating: boolean;
  onEdit: (allergy: Allergy) => void;
  onDelete: (allergy: Allergy) => void;
  canDelete: (allergy: Allergy) => boolean;
}

export interface AllergiesSummaryCardProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  allergy: Allergy;
  isEditing: boolean;
  isMutating: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export interface AllergiesPreviewDocumentProps {
  allergies: Allergy[];
  patientName: string;
  patientNumber: string;
  generatedAt?: string;
}

export interface AllergiesPreviewModalProps {
  open: boolean;
  onClose: () => void;
  allergies: Allergy[];
  patientName: string;
  patientNumber: string;
  initialAction?: AllergiesPreviewAction;
}

export interface AllergiesFocusProps {
  theme?: 'light' | 'dark';
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export interface MutationCallbacks<TData, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

export type FormFieldErrors = Partial<Record<keyof AllergiesFormValues, string>>;

export interface NormalizedAllergiesPayload {
  allergies: Allergy[];
  meta: {
    total: number;
    active_count: number;
    severe_count: number;
  };
}
