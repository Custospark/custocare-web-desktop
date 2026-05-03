/**
 * allergiesForm.utils.ts
 * ============================================================================
 * ALLERGIES FORM UTILITIES
 * ============================================================================
 * 
 * This file contains utility functions for the allergies form.
 * All mappings align with the backend Allergy structure.
 * 
 * BACKEND MAPPING:
 * - allergen        → allergen
 * - reaction        → reaction
 * - severity        → severity
 * - clinicalNotes   → clinical_notes
 * - diagnosedAt     → diagnosed_at
 * - isActive        → is_active
 * 
 * @module allergiesForm.utils
 */

import type {
  Allergy,
  CreateAllergyRequest,
  UpdateAllergyRequest,
} from'../../../../api/allergies/AllergyTypes';
import { AllergySeverity as AllergySeverityEnum } from '../../../../api/allergies/AllergyTypes';
import type {
  AllergiesFormValues,
  AllergiesThemeTokens,
  NormalizedAllergiesPayload,
} from './allergiesForm.types';
import { cn } from '../../../../../../shared/utils/classNameUtils';

/* -------------------------------------------------------------------------- */
/*                              FORM CONSTANTS                                */
/* -------------------------------------------------------------------------- */

/**
 * Empty form values for creating a new allergy
 */
export const EMPTY_ALLERGIES_FORM: AllergiesFormValues = {
  allergen: '',
  reaction: '',
  severity: AllergySeverityEnum.MILD,
  clinicalNotes: '',
  diagnosedAt: '',
  isActive: true,
};

/* -------------------------------------------------------------------------- */
/*                              THEME FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Get theme tokens for light/dark mode
 */
export const getAllergiesTheme = (theme: 'light' | 'dark'): AllergiesThemeTokens => {
  const isDark = theme === 'dark';

  return {
    bg: {
      page: isDark ? 'bg-slate-950' : 'bg-slate-50',
      card: isDark ? 'bg-slate-900' : 'bg-white',
      subtle: isDark ? 'bg-slate-800/70' : 'bg-slate-50',
      hover: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
      input: isDark ? 'bg-slate-950/60' : 'bg-white',
      muted: isDark ? 'bg-slate-800' : 'bg-slate-100',
    },
    text: {
      primary: isDark ? 'text-slate-100' : 'text-slate-900',
      secondary: isDark ? 'text-slate-300' : 'text-slate-600',
      tertiary: isDark ? 'text-slate-400' : 'text-slate-500',
      brand: isDark ? 'text-blue-300' : 'text-blue-700',
    },
    border: {
      primary: isDark ? 'border-slate-800' : 'border-slate-200',
      subtle: isDark ? 'border-slate-800' : 'border-slate-100',
      focus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
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

/* -------------------------------------------------------------------------- */
/*                          ALLERGY NORMALIZATION                             */
/* -------------------------------------------------------------------------- */

/**
 * Normalize allergy response from API
 * Handles different response structures from the backend
 */
export const normalizeAllergyResponse = (response: unknown): NormalizedAllergiesPayload => {
  const payload = response as
    | {
        data?: {
          data?: Allergy[];
          meta?: {
            total?: number;
            active_count?: number;
            severe_count?: number;
          };
        };
        meta?: {
          total?: number;
          active_count?: number;
          severe_count?: number;
        };
      }
    | undefined;

  const nestedItems = payload?.data?.data;
  const flatItems = Array.isArray((payload as { data?: unknown[] } | undefined)?.data)
    ? ((payload as { data?: Allergy[] }).data ?? [])
    : [];

  const allergies = Array.isArray(nestedItems) ? nestedItems : flatItems;

  const nestedMeta = payload?.data?.meta;
  const flatMeta = payload?.meta;

  return {
    allergies,
    meta: {
      total: Number(nestedMeta?.total ?? flatMeta?.total ?? allergies.length ?? 0),
      active_count: Number(
        nestedMeta?.active_count ??
          flatMeta?.active_count ??
          allergies.filter((item) => item.is_active).length
      ),
      severe_count: Number(
        nestedMeta?.severe_count ??
          flatMeta?.severe_count ??
          allergies.filter(
            (item) => item.is_severe || item.severity === AllergySeverityEnum.SEVERE
          ).length
      ),
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                          FORMATTING HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Convert date to input value format (YYYY-MM-DD)
 */
export const toDateInputValue = (value?: string | null): string => {
  if (!value) return '';
  try {
    return new Date(value).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Format date for display
 */
export const formatDate = (value?: string | null): string => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Format datetime for display
 */
export const formatDateTime = (value?: string | null): string => {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

/**
 * Get severity badge classes
 */
export const getSeverityBadgeClasses = (severity: string, isDark: boolean): string => {
  const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';

  switch (severity) {
    case AllergySeverityEnum.SEVERE:
      return cn(
        base,
        isDark
          ? 'bg-red-900/30 text-red-300'
          : 'bg-red-100 text-red-700'
      );
    case AllergySeverityEnum.MODERATE:
      return cn(
        base,
        isDark
          ? 'bg-yellow-900/30 text-yellow-300'
          : 'bg-yellow-100 text-yellow-700'
      );
    default:
      return cn(
        base,
        isDark
          ? 'bg-blue-900/30 text-blue-300'
          : 'bg-blue-100 text-blue-700'
      );
  }
};

/**
 * Get severity color for UI
 */
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case AllergySeverityEnum.SEVERE:
      return 'text-red-600 bg-red-100';
    case AllergySeverityEnum.MODERATE:
      return 'text-yellow-600 bg-yellow-100';
    default:
      return 'text-blue-600 bg-blue-100';
  }
};

/**
 * Get severity label
 */
export const getSeverityLabel = (severity: string): string => {
  switch (severity) {
    case AllergySeverityEnum.SEVERE:
      return 'Severe';
    case AllergySeverityEnum.MODERATE:
      return 'Moderate';
    default:
      return 'Mild';
  }
};

/* -------------------------------------------------------------------------- */
/*                    FORM VALUE EXTRACTION FROM BACKEND                      */
/* -------------------------------------------------------------------------- */

/**
 * Extract form values from backend allergy response
 */
export const extractAllergiesFormValues = (
  allergy: Allergy | null | undefined
): AllergiesFormValues => {
  if (!allergy) {
    return { ...EMPTY_ALLERGIES_FORM };
  }

  return {
    allergen: allergy.allergen,
    reaction: allergy.reaction || '',
    severity: allergy.severity,
    clinicalNotes: allergy.clinical_notes || '',
    diagnosedAt: toDateInputValue(allergy.diagnosed_at),
    isActive: allergy.is_active,
  };
};

/* -------------------------------------------------------------------------- */
/*                          PAYLOAD BUILDERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Build create payload from form values
 */
export const buildCreateAllergyPayload = (
  values: AllergiesFormValues,
  visitId: number | null
): CreateAllergyRequest => ({
  allergen: values.allergen.trim(),
  reaction: values.reaction.trim() || null,
  severity: values.severity,
  clinical_notes: values.clinicalNotes.trim() || null,
  diagnosed_at: values.diagnosedAt ? new Date(values.diagnosedAt).toISOString() : null,
  is_active: values.isActive,
  visit_id: visitId,
});

/**
 * Build update payload from form values
 */
export const buildUpdateAllergyPayload = (
  values: AllergiesFormValues
): UpdateAllergyRequest => ({
  allergen: values.allergen.trim(),
  reaction: values.reaction.trim() || null,
  severity: values.severity,
  clinical_notes: values.clinicalNotes.trim() || null,
  diagnosed_at: values.diagnosedAt ? new Date(values.diagnosedAt).toISOString() : null,
  is_active: values.isActive,
});

/* -------------------------------------------------------------------------- */
/*                          ERROR MAPPING                                     */
/* -------------------------------------------------------------------------- */

/**
 * Map API field errors to form field errors
 */
export const mapApiFieldErrorsToFormErrors = (
  errors: Record<string, string[]> | null | undefined
): Partial<Record<keyof AllergiesFormValues, string>> => {
  if (!errors) return {};

  return {
    allergen: errors.allergen?.[0],
    reaction: errors.reaction?.[0],
    severity: errors.severity?.[0],
    clinicalNotes: errors.clinical_notes?.[0],
    diagnosedAt: errors.diagnosed_at?.[0],
    isActive: errors.is_active?.[0],
  };
};

/* -------------------------------------------------------------------------- */
/*                          STATISTICS HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Get allergy statistics from list
 */
export const getAllergyStatistics = (allergies: Allergy[]) => ({
  total: allergies.length,
  active: allergies.filter(a => a.is_active).length,
  severe: allergies.filter(a => a.severity === AllergySeverityEnum.SEVERE).length,
  moderate: allergies.filter(a => a.severity === AllergySeverityEnum.MODERATE).length,
  mild: allergies.filter(a => a.severity === AllergySeverityEnum.MILD).length,
});

/**
 * Check if user can delete allergy (must be the recorder)
 */
export const canDeleteAllergy = (allergy: Allergy, currentUserId?: number | string): boolean => {
  if (!currentUserId) return false;
  const allergyCreatorId = allergy.recorded_by?.id?.toString();
  return currentUserId.toString() === allergyCreatorId;
};

/* -------------------------------------------------------------------------- */
/*                          DOCUMENT FILENAME                                 */
/* -------------------------------------------------------------------------- */

/**
 * Build filename for allergy report
 */
export const buildAllergyFileName = (patientName: string): string => {
  const safePatientName = patientName
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  
  const todayDate = new Date().toISOString().split('T')[0];
  
  return `${safePatientName}_allergies_${todayDate}`;
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT DEFAULTS                                 */
/* -------------------------------------------------------------------------- */

export default {
  EMPTY_ALLERGIES_FORM,
  getAllergiesTheme,
  normalizeAllergyResponse,
  toDateInputValue,
  formatDate,
  formatDateTime,
  getSeverityBadgeClasses,
  getSeverityColor,
  getSeverityLabel,
  extractAllergiesFormValues,
  buildCreateAllergyPayload,
  buildUpdateAllergyPayload,
  mapApiFieldErrorsToFormErrors,
  getAllergyStatistics,
  canDeleteAllergy,
  buildAllergyFileName,
};