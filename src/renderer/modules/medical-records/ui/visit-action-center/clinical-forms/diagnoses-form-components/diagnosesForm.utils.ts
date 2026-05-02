/**
 * diagnosesForm.utils.ts
 * ============================================================================
 * DIAGNOSES FORM UTILITIES
 * ============================================================================
 * 
 * This file contains utility functions for the diagnoses form.
 * All mappings align with the backend DiagnosisResponse structure.
 * 
 * BACKEND MAPPING:
 * - diagnosisCode        → diagnosis_code
 * - diagnosisDescription → diagnosis_description
 * - diagnosisType        → diagnosis_type
 * - certainty            → certainty
 * - clinicalStatus       → clinical_status
 * - clinicalNotes        → clinical_notes
 * - onsetDate            → onset_date
 * - abatementDate        → abatement_date
 * - diagnosticCriteriaMet → diagnostic_criteria_met
 * - supportingEvidence   → supporting_evidence
 * 
 * DYNAMIC CUSTOM FIELDS:
 * - User-addable fields with any label, type, and value
 * - Serialized to JSON for backend storage
 * - Deserialized from backend JSON for display
 * 
 * @module diagnosesForm.utils
 */

import {
  type DiagnosisResponse,
  type CreateDiagnosisRequest,
  type UpdateDiagnosisRequest,
  type DiagnosisValidationErrorResponse,
  type SupportingEvidence,
  DiagnosisType,
  DiagnosisCertainty,
  DiagnosisClinicalStatus,
} from '../../../../api/diagnosis/diagnosisTypes';
import type {
  DiagnosesFormValues,
  DiagnosesThemeTokens,
  DynamicCustomField,
  DynamicCustomFields,
  CustomFieldValueType,
} from './diagnosesForm.types';

/* -------------------------------------------------------------------------- */
/*                              FORM CONSTANTS                                */
/* -------------------------------------------------------------------------- */

/**
 * Empty form values for creating new diagnosis
 */
export const EMPTY_DIAGNOSES_FORM: DiagnosesFormValues = {
  diagnosisCode: '',
  diagnosisDescription: '',
  diagnosisType: DiagnosisType.PRIMARY,
  certainty: DiagnosisCertainty.CONFIRMED,
  clinicalStatus: DiagnosisClinicalStatus.ACTIVE,
  clinicalNotes: null,
  onsetDate: null,
  abatementDate: null,
  diagnosticCriteriaMet: null,
  supportingEvidence: null,
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
export const getDiagnosesTheme = (theme: 'light' | 'dark'): DiagnosesThemeTokens => {
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
/*                        DIAGNOSIS EXTRACTION HELPERS                        */
/* -------------------------------------------------------------------------- */

/**
 * Pick the primary (most recent) diagnosis from a list
 */
export const pickPrimaryDiagnosis = (
  diagnosesList: DiagnosisResponse[] | undefined | null
): DiagnosisResponse | null => {
  if (!diagnosesList?.length) return null;

  const sorted = [...diagnosesList].sort((a, b) => {
    const aDate = new Date(a.created_at || 0).getTime();
    const bDate = new Date(b.created_at || 0).getTime();
    return bDate - aDate;
  });

  return sorted[0] ?? null;
};

/**
 * Get diagnosis ID from a diagnosis object
 */
export const getDiagnosisId = (diagnosis: DiagnosisResponse | null | undefined): number | null => {
  if (!diagnosis) return null;
  return diagnosis.id;
};

/**
 * Format diagnosis date for display
 */
export const formatDiagnosisDate = (value: string | null | undefined): string => {
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
 * Format diagnosis datetime for display
 */
export const formatDiagnosisDateTime = (value: string | null | undefined): string => {
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
 * Get diagnosis metadata for display
 */
export const getDiagnosisMeta = (diagnosis: DiagnosisResponse | null | undefined) => ({
  id: diagnosis?.id || null,
  createdAt: diagnosis?.created_at || null,
  updatedAt: diagnosis?.updated_at || null,
  verifiedAt: diagnosis?.verified_at || null,
  patientId: diagnosis?.patient_id || null,
  patientName: diagnosis?.patient?.full_name || null,
  visitId: diagnosis?.visit_id || null,
  staffId: diagnosis?.staff_id || null,
  staffName: diagnosis?.staff?.full_name || null,
  verifierName: diagnosis?.verifier?.full_name || null,
  verificationStatus: diagnosis?.verification_status || null,
  disputeReason: diagnosis?.dispute_reason || null,
});

/* -------------------------------------------------------------------------- */
/*                    FORM VALUE EXTRACTION FROM BACKEND                      */
/* -------------------------------------------------------------------------- */

/**
 * Extract form values from backend diagnosis response
 */
export const extractDiagnosesFormValues = (
  diagnosis: DiagnosisResponse | null | undefined
): DiagnosesFormValues => {
  if (!diagnosis) {
    return { ...EMPTY_DIAGNOSES_FORM, dynamicCustomFields: [] };
  }

  return {
    diagnosisCode: diagnosis.diagnosis_code,
    diagnosisDescription: diagnosis.diagnosis_description,
    diagnosisType: diagnosis.diagnosis_type,
    certainty: diagnosis.certainty,
    clinicalStatus: diagnosis.clinical_status,
    clinicalNotes: diagnosis.clinical_notes,
    onsetDate: diagnosis.onset_date,
    abatementDate: diagnosis.abatement_date,
    diagnosticCriteriaMet: diagnosis.diagnostic_criteria_met,
    supportingEvidence: diagnosis.supporting_evidence,
    dynamicCustomFields: deserializeCustomFields(diagnosis.custom_fields as Record<string, unknown> | null),
  };
};

/* -------------------------------------------------------------------------- */
/*                          PAYLOAD BUILDERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Build create payload from form values
 */
export const buildCreateDiagnosisPayload = (
  values: DiagnosesFormValues
): Partial<CreateDiagnosisRequest> => {
  const customFields = serializeCustomFields(values.dynamicCustomFields);
  
  return {
    diagnosis_code: values.diagnosisCode,
    diagnosis_description: values.diagnosisDescription,
    diagnosis_type: values.diagnosisType,
    certainty: values.certainty,
    clinical_status: values.clinicalStatus,
    clinical_notes: values.clinicalNotes,
    onset_date: values.onsetDate,
    abatement_date: values.abatementDate,
    diagnostic_criteria_met: values.diagnosticCriteriaMet,
    supporting_evidence: values.supportingEvidence,
    custom_fields: Object.keys(customFields).length > 0 ? customFields : null,
  };
};

/**
 * Build update payload from form values
 */
export const buildUpdateDiagnosisPayload = (
  values: DiagnosesFormValues
): Partial<UpdateDiagnosisRequest> => {
  const customFields = serializeCustomFields(values.dynamicCustomFields);
  
  return {
    diagnosis_code: values.diagnosisCode,
    diagnosis_description: values.diagnosisDescription,
    diagnosis_type: values.diagnosisType,
    certainty: values.certainty,
    clinical_status: values.clinicalStatus,
    clinical_notes: values.clinicalNotes,
    onset_date: values.onsetDate,
    abatement_date: values.abatementDate,
    diagnostic_criteria_met: values.diagnosticCriteriaMet,
    supporting_evidence: values.supportingEvidence,
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
  errors: DiagnosisValidationErrorResponse['errors'] | null
): Partial<Record<keyof DiagnosesFormValues, string>> => {
  if (!errors) return {};

  return {
    diagnosisCode: errors.diagnosis_code?.[0],
    diagnosisDescription: errors.diagnosis_description?.[0],
    diagnosisType: errors.diagnosis_type?.[0],
    certainty: errors.certainty?.[0],
    clinicalStatus: errors.clinical_status?.[0],
    clinicalNotes: errors.clinical_notes?.[0],
    onsetDate: errors.onset_date?.[0],
    abatementDate: errors.abatement_date?.[0],
    diagnosticCriteriaMet: errors.diagnostic_criteria_met?.[0],
  };
};

/* -------------------------------------------------------------------------- */
/*                          FORMATTING HELPERS                                */
/* -------------------------------------------------------------------------- */

/**
 * Get formatted certainty badge color
 */
export const getCertaintyBadgeColor = (certainty: string): string => {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-800',
    probable: 'bg-blue-100 text-blue-800',
    possible: 'bg-yellow-100 text-yellow-800',
    suspected: 'bg-orange-100 text-orange-800',
    rule_out: 'bg-red-100 text-red-800',
    uncertain: 'bg-gray-100 text-gray-800',
  };
  return colors[certainty] || 'bg-gray-100 text-gray-800';
};

/**
 * Get formatted clinical status badge color
 */
export const getClinicalStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800',
    inactive: 'bg-gray-100 text-gray-800',
    resolved: 'bg-green-100 text-green-800',
    remission: 'bg-teal-100 text-teal-800',
    chronic: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Format supporting evidence for display
 */
export const formatSupportingEvidence = (evidence: SupportingEvidence | null): string => {
  if (!evidence) return 'No supporting evidence documented.';
  
  const parts: string[] = [];
  if (evidence.labs?.length) parts.push(`Labs: ${evidence.labs.join(', ')}`);
  if (evidence.imaging?.length) parts.push(`Imaging: ${evidence.imaging.join(', ')}`);
  if (evidence.clinical_findings?.length) parts.push(`Clinical Findings: ${evidence.clinical_findings.join(', ')}`);
  
  return parts.length ? parts.join('; ') : 'No supporting evidence documented.';
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT DEFAULTS                                 */
/* -------------------------------------------------------------------------- */

export default {
  EMPTY_DIAGNOSES_FORM,
  createEmptyCustomField,
  addCustomField,
  updateCustomField,
  removeCustomField,
  serializeCustomFields,
  deserializeCustomFields,
  getDiagnosesTheme,
  pickPrimaryDiagnosis,
  getDiagnosisId,
  formatDiagnosisDate,
  formatDiagnosisDateTime,
  getDiagnosisMeta,
  extractDiagnosesFormValues,
  buildCreateDiagnosisPayload,
  buildUpdateDiagnosisPayload,
  mapApiFieldErrorsToFormErrors,
  getCertaintyBadgeColor,
  getClinicalStatusBadgeColor,
  formatSupportingEvidence,
};