/**
 * ClinicalTemplateTypes.ts
 * ============================================================================
 * CLINICAL TEMPLATE TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for clinical template
 * operations in the healthcare facility management system.
 * 
 * @module clinicalTemplateTypes
 * @description Comprehensive type definitions for clinical templates,
 * including request/response types, enums, and utility functions.
 */

import type  { AdministrationInstructions, CommonSideEffects, CreatePrescriptionItemRequest, DosageForm, DosageUnit, DurationUnit, Frequency, MedicationType, MonitoringRequired, Refills, Route, Substitution } from '../prescription-items/PrescriptionItemsTypes';

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Template category enum.
 * Medical specialties for template organization (UI-friendly).
 */
export enum TemplateCategory {
  GENERAL_PRACTICE = 'General Practice',
  EMERGENCY_MEDICINE = 'Emergency Medicine',
  PEDIATRICS = 'Pediatrics',
  GERIATRICS = 'Geriatrics',
  CARDIOLOGY = 'Cardiology',
  NEUROLOGY = 'Neurology',
  PULMONOLOGY = 'Pulmonology',
  GASTROENTEROLOGY = 'Gastroenterology',
  ENDOCRINOLOGY = 'Endocrinology',
  INFECTIOUS_DISEASES = 'Infectious Diseases',
  PSYCHIATRY = 'Psychiatry',
  OBSTETRICS_GYNECOLOGY = 'Obstetrics & Gynecology',
  ORTHOPEDICS = 'Orthopedics',
  DERMATOLOGY = 'Dermatology',
  OPHTHALMOLOGY = 'Ophthalmology',
  DENTISTRY = 'Dentistry',
  UROLOGY = 'Urology',
  NEPHROLOGY = 'Nephrology',
  ONCOLOGY = 'Oncology',
  RHEUMATOLOGY = 'Rheumatology',
  ALLERGY_IMMUNOLOGY = 'Allergy & Immunology',
  SPORTS_MEDICINE = 'Sports Medicine',
  PAIN_MANAGEMENT = 'Pain Management',
  PALLIATIVE_CARE = 'Palliative Care',
}

/**
 * Template visibility enum.
 * Who can access and use the template.
 */
export enum TemplateVisibility {
  SYSTEM_WIDE = 'System Wide (All Facilities)',
  FACILITY_ONLY = 'This Facility Only',
  DEPARTMENT_ONLY = 'My Department Only',
  PRIVATE = 'Only Me (Private)',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Simplified template medication item.
 * Used in template default_medications JSON structure.
 */
export interface TemplateMedicationItem {
  medication_name: string;
  brand_name?: string | null;
  strength?: string | null;
  dosage_form: string;
  dosage_quantity: number;
  dosage_unit: string;
  frequency: string;
  duration_value: number;
  duration_unit: string;
  route?: string;
  instructions?: string | null;
  as_needed?: boolean;
  as_needed_reason?: string | null;
  administration_instructions?: string;
  refills?: string;
  medication_type?: string | null;
  monitoring_required?: string | null;
  common_side_effects?: string | null;
  substitution?: string;
}

/**
 * Formatted template medication item with computed fields.
 */
export interface FormattedTemplateMedicationItem extends TemplateMedicationItem {
  total_quantity: number;
  patient_instructions: string;
  display_name: string;
}

/* -------------------------------------------------------------------------- */
/*                            CORE TEMPLATE TYPE                              */
/* -------------------------------------------------------------------------- */

/**
 * Complete clinical template entity as returned by the API.
 */
export interface ClinicalTemplate {
  // Primary identifiers
  id: number;
  facility_id: number;

  // Template identity
  name: string;
  slug: string;
  description: string | null;
  category: TemplateCategory;

  // Auto-fill content
  default_diagnosis: string | null;
  default_notes: string | null;
  patient_instructions: string | null;
  default_medications: TemplateMedicationItem[];

  // Usage tracking
  usage_count: number;
  is_active: boolean;
  visibility: TemplateVisibility;

  // Audit
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new clinical template.
 */
export interface CreateTemplateRequest {
  facility_id: number;
  name: string;
  description?: string | null;
  category: TemplateCategory;
  default_diagnosis?: string | null;
  default_notes?: string | null;
  patient_instructions?: string | null;
  default_medications?: TemplateMedicationItem[];
  visibility: TemplateVisibility;
}

/**
 * Request payload for updating an existing clinical template.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateTemplateRequest {
  name?: string;
  description?: string | null;
  category?: TemplateCategory;
  default_diagnosis?: string | null;
  default_notes?: string | null;
  patient_instructions?: string | null;
  default_medications?: TemplateMedicationItem[];
  is_active?: boolean;
  visibility?: TemplateVisibility;
}

/**
 * Query parameters for filtering template list.
 */
export interface TemplateFilters {
  facility_id?: number;
  category?: TemplateCategory;
  is_active?: boolean;
  search?: string;
  per_page?: number;
}

/**
 * Query parameters for facility templates.
 */
export interface FacilityTemplatesParams {
  facility_id: number;
  include_system?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard success response structure.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Standard error response structure.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  errors?: Record<string, string[]>;
}

/**
 * Response for template list endpoint.
 */
export type GetTemplatesResponse = ApiSuccessResponse<ClinicalTemplate[]> & {
  meta: {
    total: number;
    categories: TemplateCategory[];
  };
};

/**
 * Response for facility templates endpoint.
 */
export interface GetFacilityTemplatesResponse extends ApiSuccessResponse<ClinicalTemplate[]> {
  meta: {
    facility_id: number;
    total: number;
  };
}

/**
 * Response for templates by category endpoint.
 */
export interface GetTemplatesByCategoryResponse extends ApiSuccessResponse<ClinicalTemplate[]> {
  meta: {
    category: TemplateCategory;
    total: number;
  };
}

/**
 * Response for search templates endpoint.
 */
export interface SearchTemplatesResponse extends ApiSuccessResponse<ClinicalTemplate[]> {
  meta: {
    keyword: string;
    total: number;
  };
}

/**
 * Response for single template operations (GET, POST, PUT).
 */
export type TemplateResponse = ApiSuccessResponse<ClinicalTemplate>;

/**
 * Response for delete operation.
 */
export type DeleteTemplateResponse = ApiSuccessResponse<null>;

/**
 * Response for toggle status operation.
 */
export type ToggleStatusResponse = ApiSuccessResponse<ClinicalTemplate>;

/**
 * Response for categories endpoint.
 */
export type CategoriesResponse = ApiSuccessResponse<TemplateCategory[]>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to get category display name.
 */
export const getCategoryDisplayName = (category: TemplateCategory): string => {
  return category;
};

/**
 * Helper function to get category color.
 */
export const getCategoryColor = (category: TemplateCategory): string => {
  const colorMap: Record<TemplateCategory, string> = {
    [TemplateCategory.GENERAL_PRACTICE]: 'bg-blue-100 text-blue-800',
    [TemplateCategory.EMERGENCY_MEDICINE]: 'bg-red-100 text-red-800',
    [TemplateCategory.PEDIATRICS]: 'bg-pink-100 text-pink-800',
    [TemplateCategory.GERIATRICS]: 'bg-purple-100 text-purple-800',
    [TemplateCategory.CARDIOLOGY]: 'bg-red-100 text-red-800',
    [TemplateCategory.NEUROLOGY]: 'bg-indigo-100 text-indigo-800',
    [TemplateCategory.PULMONOLOGY]: 'bg-cyan-100 text-cyan-800',
    [TemplateCategory.GASTROENTEROLOGY]: 'bg-emerald-100 text-emerald-800',
    [TemplateCategory.ENDOCRINOLOGY]: 'bg-orange-100 text-orange-800',
    [TemplateCategory.INFECTIOUS_DISEASES]: 'bg-amber-100 text-amber-800',
    [TemplateCategory.PSYCHIATRY]: 'bg-violet-100 text-violet-800',
    [TemplateCategory.OBSTETRICS_GYNECOLOGY]: 'bg-rose-100 text-rose-800',
    [TemplateCategory.ORTHOPEDICS]: 'bg-lime-100 text-lime-800',
    [TemplateCategory.DERMATOLOGY]: 'bg-fuchsia-100 text-fuchsia-800',
    [TemplateCategory.OPHTHALMOLOGY]: 'bg-sky-100 text-sky-800',
    [TemplateCategory.DENTISTRY]: 'bg-teal-100 text-teal-800',
    [TemplateCategory.UROLOGY]: 'bg-blue-100 text-blue-800',
    [TemplateCategory.NEPHROLOGY]: 'bg-indigo-100 text-indigo-800',
    [TemplateCategory.ONCOLOGY]: 'bg-purple-100 text-purple-800',
    [TemplateCategory.RHEUMATOLOGY]: 'bg-pink-100 text-pink-800',
    [TemplateCategory.ALLERGY_IMMUNOLOGY]: 'bg-amber-100 text-amber-800',
    [TemplateCategory.SPORTS_MEDICINE]: 'bg-green-100 text-green-800',
    [TemplateCategory.PAIN_MANAGEMENT]: 'bg-gray-100 text-gray-800',
    [TemplateCategory.PALLIATIVE_CARE]: 'bg-gray-100 text-gray-800',
  };
  return colorMap[category] || 'bg-gray-100 text-gray-800';
};

/**
 * Helper function to get visibility display name.
 */
export const getVisibilityDisplayName = (visibility: TemplateVisibility): string => {
  return visibility;
};

/**
 * Helper function to get visibility badge color.
 */
export const getVisibilityColor = (visibility: TemplateVisibility): string => {
  const colorMap: Record<TemplateVisibility, string> = {
    [TemplateVisibility.SYSTEM_WIDE]: 'bg-purple-100 text-purple-800',
    [TemplateVisibility.FACILITY_ONLY]: 'bg-blue-100 text-blue-800',
    [TemplateVisibility.DEPARTMENT_ONLY]: 'bg-green-100 text-green-800',
    [TemplateVisibility.PRIVATE]: 'bg-gray-100 text-gray-800',
  };
  return colorMap[visibility] || 'bg-gray-100 text-gray-800';
};

/**
 * Helper function to format template medication for display.
 */
export const formatTemplateMedication = (med: TemplateMedicationItem): FormattedTemplateMedicationItem => {
  // Calculate total quantity
  let multiplier = 1;
  if (med.frequency.includes('Once daily')) multiplier = 1;
  else if (med.frequency.includes('Twice daily')) multiplier = 2;
  else if (med.frequency.includes('Three times daily')) multiplier = 3;
  else if (med.frequency.includes('Four times daily')) multiplier = 4;
  else if (med.frequency.includes('Every 4 hours')) multiplier = 6;
  else if (med.frequency.includes('Every 6 hours')) multiplier = 4;
  else if (med.frequency.includes('Every 8 hours')) multiplier = 3;
  else if (med.frequency.includes('Every 12 hours')) multiplier = 2;
  else multiplier = 1;

  let days = med.duration_value;
  if (med.duration_unit === 'Week(s)') days = med.duration_value * 7;
  else if (med.duration_unit === 'Month(s)') days = med.duration_value * 30;
  else if (med.duration_unit === 'Year(s)') days = med.duration_value * 365;

  const totalQuantity = multiplier * days * med.dosage_quantity;

  // Generate patient instructions
  const instructions = `Take ${med.dosage_quantity} ${med.dosage_unit} ${med.route?.toLowerCase() || 'orally'} ${med.frequency.toLowerCase()} for ${med.duration_value} ${med.duration_unit}.${med.instructions ? ' ' + med.instructions : ''}`;

  // Display name
  const displayName = `${med.medication_name}${med.strength ? ' ' + med.strength : ''}${med.brand_name ? ' (' + med.brand_name + ')' : ''}`;

  return {
    ...med,
    total_quantity: totalQuantity,
    patient_instructions: instructions,
    display_name: displayName,
  };
};

/**
 * Helper function to convert template medication to prescription item request.
 */
export const templateToPrescriptionItem = (
  med: TemplateMedicationItem
): CreatePrescriptionItemRequest => {
  return {
    medication_name: med.medication_name,
    brand_name: med.brand_name || null,
    strength: med.strength || null,
    dosage_form: med.dosage_form as DosageForm,
    dosage_quantity: med.dosage_quantity,
    dosage_unit: med.dosage_unit as DosageUnit,
    frequency: med.frequency as Frequency,
    duration_value: med.duration_value,
    duration_unit: med.duration_unit as DurationUnit,
    route: (med.route as Route) || 'By mouth (Oral)',
    instructions: med.instructions || null,
    as_needed: med.as_needed || false,
    as_needed_reason: med.as_needed_reason || null,
    administration_instructions: (med.administration_instructions as AdministrationInstructions) || 'No special instructions',
    refills: (med.refills as Refills) || '0 refills - One time only',
    medication_type: med.medication_type as MedicationType || null,
    monitoring_required: med.monitoring_required as MonitoringRequired || null,
    common_side_effects: med.common_side_effects as CommonSideEffects || null,
    substitution: (med.substitution as Substitution) || 'Generic substitution allowed',
  };
};