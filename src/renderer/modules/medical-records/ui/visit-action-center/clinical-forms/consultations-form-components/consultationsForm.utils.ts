/**
 * consultationsForm.utils.ts
 * ============================================================================
 * CONSULTATIONS FORM UTILITIES
 * ============================================================================
 * 
 * This file contains utility functions for the consultations form.
 * All mappings align with the backend ConsultationResponse structure.
 * 
 * BACKEND MAPPING:
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
 * - attachedDocuments     → attached_documents
 * 
 * DYNAMIC CUSTOM FIELDS:
 * - User-addable fields with any label, type, and value
 * - Serialized to JSON for backend storage
 * - Deserialized from backend JSON for display
 * 
 * @module consultationsForm.utils
 */

import type {
  ConsultationResponse,
  CreateConsultationRequest,
  UpdateConsultationRequest,
  ConsultationValidationErrorResponse,
  RecommendedOrders,
} from '../../../../api/consultations/consultationTypes';
import {
  DEFAULT_CONSULTATION_TYPE,
  DEFAULT_CONSULTATION_PRIORITY,
  DEFAULT_DURATION_MINUTES,
  ConsultationStatus,
} from '../../../../api/consultations/consultationTypes';
import type {
  ConsultationsFormValues,
  ConsultationsThemeTokens,
  DynamicCustomField,
  DynamicCustomFields,
  CustomFieldValueType,
} from './consultationsForm.types';

/* -------------------------------------------------------------------------- */
/*                              FORM CONSTANTS                                */
/* -------------------------------------------------------------------------- */

/**
 * Empty form values for creating a new consultation
 */
export const EMPTY_CONSULTATIONS_FORM: ConsultationsFormValues = {
  specialtyRequired: '',
  clinicalQuestion: '',
  backgroundInformation: null,
  consultationType: DEFAULT_CONSULTATION_TYPE,
  priority: DEFAULT_CONSULTATION_PRIORITY,
  scheduledFor: null,
  request_status:ConsultationStatus.PENDING,
  location: null,
  durationMinutes: DEFAULT_DURATION_MINUTES,
  requiresFollowup: false,
  followupBy: null,
  followupInstructions: null,
  findings: null,
  recommendations: null,
  recommendedOrders: null,
  consultantNotes: null,
  attachedDocuments: null,
  dynamicCustomFields: [],
};

/* -------------------------------------------------------------------------- */
/*                    DYNAMIC CUSTOM FIELDS HELPERS                           */
/* -------------------------------------------------------------------------- */

/**
 * Generate a unique ID for custom fields
 */
const generateFieldId = (): string => {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
};

/**
 * Create a new empty custom field
 */
export const createEmptyCustomField = (): DynamicCustomField => ({
  id: generateFieldId(),
  label: '',
  type: 'text',
  value: null,
});

/**
 * Add a new custom field
 */
export const addCustomField = (
  fields: DynamicCustomFields,
  fieldType: CustomFieldValueType = 'text'
): DynamicCustomFields => {
  return [...fields, { ...createEmptyCustomField(), type: fieldType }];
};

/**
 * Update a custom field at specific index
 */
export const updateCustomField = (
  fields: DynamicCustomFields,
  index: number,
  updates: Partial<DynamicCustomField>
): DynamicCustomFields => {
  const updated = [...fields];
  updated[index] = { ...updated[index], ...updates };
  return updated;
};

/**
 * Remove a custom field at specific index
 */
export const removeCustomField = (
  fields: DynamicCustomFields,
  index: number
): DynamicCustomFields => {
  return fields.filter((_, i) => i !== index);
};

/**
 * Serialize dynamic custom fields to backend JSON format
 */
export const serializeCustomFields = (fields: DynamicCustomFields): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  
  fields.forEach((field) => {
    if (field.label.trim()) {
      const valueObj: Record<string, unknown> = {
        value: field.value,
        type: field.type,
      };
      result[field.label.trim()] = valueObj;
    }
  });
  
  return result;
};

/**
 * Deserialize backend custom fields JSON to dynamic custom fields array
 */
export const deserializeCustomFields = (
  customFields: Record<string, unknown> | null | undefined
): DynamicCustomFields => {
  if (!customFields || typeof customFields !== 'object') {
    return [];
  }

  const fields: DynamicCustomFields = [];

  Object.entries(customFields).forEach(([label, valueData]) => {
    let value: string | null = null;
    let type: CustomFieldValueType = 'text';

    if (valueData && typeof valueData === 'object') {
      const obj = valueData as Record<string, unknown>;
      value = (obj.value as string) ?? null;
      type = (obj.type as CustomFieldValueType) || 'text';
    } else {
      value = valueData as string;
    }

    fields.push({
      id: generateFieldId(),
      label,
      type,
      value,
    });
  });

  return fields;
};

/* -------------------------------------------------------------------------- */
/*                              THEME FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Get theme tokens for light/dark mode
 */
export const getConsultationsTheme = (theme: 'light' | 'dark'): ConsultationsThemeTokens => {
  const isDark = theme === 'dark';

  return {
    bg: {
      page: isDark ? 'bg-slate-950' : 'bg-slate-50',
      card: isDark ? 'bg-slate-900' : 'bg-white',
      subtle: isDark ? 'bg-slate-800/70' : 'bg-slate-50',
      hover: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
      input: isDark ? 'bg-slate-950/60' : 'bg-white',
    },
    text: {
      primary: isDark ? 'text-slate-100' : 'text-slate-900',
      secondary: isDark ? 'text-slate-300' : 'text-slate-600',
      tertiary: isDark ? 'text-slate-400' : 'text-slate-500',
      brand: isDark ? 'text-blue-300' : 'text-blue-700',
    },
    border: {
      primary: isDark ? 'border-slate-800' : 'border-slate-200',
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
/*                      CONSULTATION EXTRACTION HELPERS                       */
/* -------------------------------------------------------------------------- */

/**
 * Pick the primary (most recent) consultation from a list
 */
export const pickPrimaryConsultation = (
  consultationsList: ConsultationResponse[] | undefined | null
): ConsultationResponse | null => {
  if (!consultationsList?.length) return null;

  const sorted = [...consultationsList].sort((a, b) => {
    const aDate = new Date(a.requested_at || a.created_at || 0).getTime();
    const bDate = new Date(b.requested_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });

  return sorted[0] ?? null;
};

/**
 * Get consultation ID from a consultation object
 */
export const getConsultationId = (consultation: ConsultationResponse | null | undefined): number | null => {
  if (!consultation) return null;
  return consultation.id;
};

/**
 * Format consultation date for display
 */
export const formatConsultationDate = (value: string | null | undefined): string => {
  if (!value) return 'Not set';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
};

/**
 * Format consultation datetime for display
 */
export const formatConsultationDateTime = (value: string | null | undefined): string => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Get consultation metadata for display
 */
export const getConsultationMeta = (consultation: ConsultationResponse | null | undefined) => ({
  id: consultation?.id || null,
  requestedAt: consultation?.requested_at || null,
  respondedAt: consultation?.responded_at || null,
  completedAt: consultation?.completed_at || null,
  scheduledFor: consultation?.scheduled_for || null,
  createdAt: consultation?.created_at || null,
  updatedAt: consultation?.updated_at || null,
  patientId: consultation?.patient_id || null,
  patientName: consultation?.patient?.full_name || null,
  visitId: consultation?.visit_id || null,
  requestingStaffId: consultation?.requesting_staff_id || null,
  requestingStaffName: consultation?.requesting_staff?.full_name || null,
  consultantStaffId: consultation?.consultant_staff_id || null,
  consultantStaffName: consultation?.consultant_staff?.full_name || null,
});

/* -------------------------------------------------------------------------- */
/*                    FORM VALUE EXTRACTION FROM BACKEND                      */
/* -------------------------------------------------------------------------- */

/**
 * Extract form values from backend consultation response
 */
export const extractConsultationsFormValues = (
  consultation: ConsultationResponse | null | undefined
): ConsultationsFormValues => {
  if (!consultation) {
    return { ...EMPTY_CONSULTATIONS_FORM, dynamicCustomFields: [] };
  }

  return {
    specialtyRequired: consultation.specialty_required,
    clinicalQuestion: consultation.clinical_question,
    backgroundInformation: consultation.background_information,
    consultationType: consultation.consultation_type,
    priority: consultation.priority,
    scheduledFor: consultation.scheduled_for,
    location: consultation.location,
    durationMinutes: consultation.duration_minutes,
    requiresFollowup: consultation.requires_followup,
    followupBy: consultation.followup_by,
    followupInstructions: consultation.followup_instructions,
    findings: consultation.findings,
    recommendations: consultation.recommendations,
    recommendedOrders: consultation.recommended_orders,
    consultantNotes: consultation.consultant_notes,
    attachedDocuments: consultation.attached_documents,
    dynamicCustomFields: deserializeCustomFields(consultation.custom_fields as Record<string, unknown> | null),
  };
};

/* -------------------------------------------------------------------------- */
/*                          PAYLOAD BUILDERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Build create payload from form values
 */
export const buildCreateConsultationPayload = (
  values: ConsultationsFormValues
): Partial<CreateConsultationRequest> => {
  const customFields = serializeCustomFields(values.dynamicCustomFields);
  
  return {
    specialty_required: values.specialtyRequired,
    clinical_question: values.clinicalQuestion,
    background_information: values.backgroundInformation,
    consultation_type: values.consultationType,
    priority: values.priority,
    scheduled_for: values.scheduledFor,
    location: values.location,
    duration_minutes: values.durationMinutes,
    requires_followup: values.requiresFollowup,
    followup_by: values.followupBy,
    followup_instructions: values.followupInstructions,
    attached_documents: values.attachedDocuments,
    custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
  };
};

/**
 * Build update payload from form values
 */
export const buildUpdateConsultationPayload = (
  values: ConsultationsFormValues
): Partial<UpdateConsultationRequest> => {
  const customFields = serializeCustomFields(values.dynamicCustomFields);
  
  return {
    specialty_required: values.specialtyRequired,
    clinical_question: values.clinicalQuestion,
    background_information: values.backgroundInformation,
    consultation_type: values.consultationType,
    priority: values.priority,
    scheduled_for: values.scheduledFor,
    location: values.location,
    duration_minutes: values.durationMinutes,
    requires_followup: values.requiresFollowup,
    followup_by: values.followupBy,
    followup_instructions: values.followupInstructions,
    attached_documents: values.attachedDocuments,
    custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
  };
};

/* -------------------------------------------------------------------------- */
/*                          ERROR MAPPING                                     */
/* -------------------------------------------------------------------------- */

/**
 * Map API field errors to form field errors
 */
export const mapApiFieldErrorsToFormErrors = (
  errors: ConsultationValidationErrorResponse['errors'] | null
): Partial<Record<keyof ConsultationsFormValues, string>> => {
  if (!errors) return {};

  return {
    specialtyRequired: errors.specialty_required?.[0],
    clinicalQuestion: errors.clinical_question?.[0],
    backgroundInformation: errors.background_information?.[0],
    consultationType: errors.consultation_type?.[0],
    priority: errors.priority?.[0],
    scheduledFor: errors.scheduled_for?.[0],
    location: errors.location?.[0],
    durationMinutes: errors.duration_minutes?.[0],
    requiresFollowup: errors.requires_followup?.[0],
    followupBy: errors.followup_by?.[0],
    followupInstructions: errors.followup_instructions?.[0],
    attachedDocuments: errors.attached_documents?.[0],
  };
};

/* -------------------------------------------------------------------------- */
/*                          FORMATTING HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Format recommended orders for display
 */
export const formatRecommendedOrders = (orders: RecommendedOrders | null): string => {
  if (!orders) return 'No recommended orders.';
  
  const parts: string[] = [];
  if (orders.labs?.length) parts.push(`Labs: ${orders.labs.join(', ')}`);
  if (orders.imaging?.length) parts.push(`Imaging: ${orders.imaging.join(', ')}`);
  if (orders.medications?.length) parts.push(`Medications: ${orders.medications.join(', ')}`);
  if (orders.procedures?.length) parts.push(`Procedures: ${orders.procedures.join(', ')}`);
  
  return parts.length ? parts.join('; ') : 'No recommended orders.';
};

/**
 * Get response time in hours
 */
export const getResponseTime = (consultation: ConsultationResponse | null): number | null => {
  if (!consultation?.responded_at || !consultation?.requested_at) return null;
  const requested = new Date(consultation.requested_at).getTime();
  const responded = new Date(consultation.responded_at).getTime();
  return Math.round((responded - requested) / (1000 * 60 * 60) * 10) / 10;
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT DEFAULTS                                 */
/* -------------------------------------------------------------------------- */

export default {
  EMPTY_CONSULTATIONS_FORM,
  createEmptyCustomField,
  addCustomField,
  updateCustomField,
  removeCustomField,
  serializeCustomFields,
  deserializeCustomFields,
  getConsultationsTheme,
  pickPrimaryConsultation,
  getConsultationId,
  formatConsultationDate,
  formatConsultationDateTime,
  getConsultationMeta,
  extractConsultationsFormValues,
  buildCreateConsultationPayload,
  buildUpdateConsultationPayload,
  mapApiFieldErrorsToFormErrors,
  formatRecommendedOrders,
  getResponseTime,
};