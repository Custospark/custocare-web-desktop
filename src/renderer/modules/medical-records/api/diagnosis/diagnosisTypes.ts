/**
 * diagnosisTypes.ts
 * ============================================================================
 * DIAGNOSIS TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for diagnosis operations.
 * Exactly matches the response structure from DiagnosisController.
 * 
 * @module diagnosisTypes
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Diagnosis type enum - matches database diagnosis_type column
 */
export enum DiagnosisType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DIFFERENTIAL = 'differential',
  ADMITTING = 'admitting',
  DISCHARGE = 'discharge',
  PROVISIONAL = 'provisional',
}

/**
 * Certainty level enum - matches database certainty column
 */
export enum DiagnosisCertainty {
  CONFIRMED = 'confirmed',
  PROBABLE = 'probable',
  POSSIBLE = 'possible',
  RULE_OUT = 'rule_out',
  SUSPECTED = 'suspected',
  UNCERTAIN = 'uncertain',
}

/**
 * Clinical status enum - matches database clinical_status column
 */
export enum DiagnosisClinicalStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  RESOLVED = 'resolved',
  REMISSION = 'remission',
  CHRONIC = 'chronic',
}

/**
 * Verification status enum - matches database verification_status column
 */
export enum DiagnosisVerificationStatus {
  DRAFT = 'draft',
  VERIFIED = 'verified',
  DISPUTED = 'disputed',
  INVALIDATED = 'invalidated',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

export interface DiagnosisFacility {
  id: number;
  name: string;
  code: string;
}

export interface DiagnosisVisit {
  id: number;
  visit_date_time: string | null;
}

export interface DiagnosisPatient {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

export interface DiagnosisStaff {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

export interface DiagnosisVerifier {
  id: number;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
}

export interface SupportingEvidence {
  labs?: string[];
  imaging?: string[];
  clinical_findings?: string[];
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST INTERFACES                                */
/* -------------------------------------------------------------------------- */

export interface CreateDiagnosisRequest {
  facility_id: number;
  visit_id: number;
  patient_id: number;
  staff_id?: number;
  diagnosis_code: string;
  diagnosis_description: string;
  diagnosis_type?: DiagnosisType;
  certainty?: DiagnosisCertainty;
  clinical_status?: DiagnosisClinicalStatus;
  clinical_notes?: string | null;
  onset_date?: string | null;
  abatement_date?: string | null;
  supporting_evidence?: SupportingEvidence | null;
  diagnostic_criteria_met?: string | null;
  custom_fields?: Record<string, unknown> | null;
  coding_metadata?: Record<string, unknown> | null;
}

export interface UpdateDiagnosisRequest {
  diagnosis_code?: string;
  diagnosis_description?: string;
  diagnosis_type?: DiagnosisType;
  certainty?: DiagnosisCertainty;
  clinical_status?: DiagnosisClinicalStatus;
  clinical_notes?: string | null;
  onset_date?: string | null;
  abatement_date?: string | null;
  supporting_evidence?: SupportingEvidence | null;
  diagnostic_criteria_met?: string | null;
  custom_fields?: Record<string, unknown> | null;
  coding_metadata?: Record<string, unknown> | null;
}

export interface DiagnosisFilters {
  facility_id?: number;
  patient_id?: number;
  visit_id?: number;
  diagnosis_type?: DiagnosisType;
  clinical_status?: DiagnosisClinicalStatus;
  certainty?: DiagnosisCertainty;
  verification_status?: DiagnosisVerificationStatus;
  diagnosis_code?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
  per_page?: number;
}

/* -------------------------------------------------------------------------- */
/*                          RESPONSE INTERFACES                               */
/* -------------------------------------------------------------------------- */

export interface DiagnosisResponse {
  id: number;
  facility_id: number;
  visit_id: number;
  patient_id: number;
  staff_id: number;
  
  // Diagnosis Data
  diagnosis_code: string;
  diagnosis_description: string;
  diagnosis_type: DiagnosisType;
  diagnosis_type_text: string;
  certainty: DiagnosisCertainty;
  certainty_text: string;
  clinical_status: DiagnosisClinicalStatus;
  clinical_status_text: string;
  clinical_notes: string | null;
  onset_date: string | null;
  abatement_date: string | null;
  
  // Supporting Evidence
  supporting_evidence: SupportingEvidence | null;
  diagnostic_criteria_met: string | null;
  
  // Custom Fields
  custom_fields: Record<string, unknown> | null;
  coding_metadata: Record<string, unknown> | null;
  
  // Workflow
  verification_status: DiagnosisVerificationStatus;
  verified_at: string | null;
  verified_by: number | null;
  dispute_reason: string | null;
  
  // Status Flags
  is_primary: boolean;
  is_secondary: boolean;
  is_active: boolean;
  is_resolved: boolean;
  is_verified: boolean;
  is_disputed: boolean;
  is_confirmed: boolean;
  
  // Timestamps
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
  
  // Relationships
  facility?: DiagnosisFacility;
  visit?: DiagnosisVisit;
  patient?: DiagnosisPatient;
  staff?: DiagnosisStaff;
  verifier?: DiagnosisVerifier;
}

export interface PaginatedDiagnosesResponse {
  data: DiagnosisResponse[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface DiagnosisSingleSuccessResponse {
  success: true;
  message: string;
  data: DiagnosisResponse;
  errors: null;
}

export interface DiagnosisListSuccessResponse {
  success: true;
  message: string;
  data: DiagnosisResponse[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
  };
}

export interface DiagnosisStatisticsResponse {
  success: true;
  message: string;
  data: {
    count_by_type: {
      primary: number;
      secondary: number;
      differential: number;
      admitting: number;
      discharge: number;
      provisional: number;
      total: number;
    };
    active_count: number;
    active_diagnoses: Array<{
      id: number;
      code: string;
      description: string;
      type: string;
      certainty: string;
    }>;
  };
  errors: null;
}

export interface MostCommonDiagnosesResponse {
  success: true;
  message: string;
  data: Array<{
    diagnosis_code: string;
    diagnosis_description: string;
    occurrence_count: number;
  }>;
  errors: null;
}

export interface IcdCodeSuggestion {
  code: string;
  description: string;
}

export interface IcdCodeSuggestionsResponse {
  success: true;
  message: string;
  data: IcdCodeSuggestion[];
  errors: null;
}

export interface DiagnosisDeleteSuccessResponse {
  success: true;
  message: string;
  data: null;
  errors: null;
}

export interface DiagnosisValidationErrorResponse {
  success: false;
  message: string;
  data: null;
  errors: Record<string, string[]>;
}

export interface DiagnosisNotFoundResponse {
  success: false;
  message: string;
  errors: {
    diagnosis: string[];
  };
  data: null;
}

export interface DiagnosisSystemErrorResponse {
  success: false;
  message: string;
  errors: {
    system: string[];
  };
  data: null;
}

/* -------------------------------------------------------------------------- */
/*                              TYPE GUARDS                                   */
/* -------------------------------------------------------------------------- */

export function isDiagnosisType(value: string): value is DiagnosisType {
  return Object.values(DiagnosisType).includes(value as DiagnosisType);
}

export function isDiagnosisCertainty(value: string): value is DiagnosisCertainty {
  return Object.values(DiagnosisCertainty).includes(value as DiagnosisCertainty);
}

export function isDiagnosisClinicalStatus(value: string): value is DiagnosisClinicalStatus {
  return Object.values(DiagnosisClinicalStatus).includes(value as DiagnosisClinicalStatus);
}

export function isDiagnosisVerificationStatus(value: string): value is DiagnosisVerificationStatus {
  return Object.values(DiagnosisVerificationStatus).includes(value as DiagnosisVerificationStatus);
}

export function isDiagnosisSuccessResponse(
  response: DiagnosisSingleSuccessResponse | DiagnosisValidationErrorResponse | DiagnosisNotFoundResponse | DiagnosisSystemErrorResponse
): response is DiagnosisSingleSuccessResponse {
  return response.success === true;
}

/* -------------------------------------------------------------------------- */
/*                              DISPLAY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

export const DIAGNOSIS_TYPE_LABELS: Record<DiagnosisType, string> = {
  [DiagnosisType.PRIMARY]: 'Primary Diagnosis',
  [DiagnosisType.SECONDARY]: 'Secondary Diagnosis',
  [DiagnosisType.DIFFERENTIAL]: 'Differential Diagnosis',
  [DiagnosisType.ADMITTING]: 'Admitting Diagnosis',
  [DiagnosisType.DISCHARGE]: 'Discharge Diagnosis',
  [DiagnosisType.PROVISIONAL]: 'Provisional Diagnosis',
};

export const DIAGNOSIS_CERTAINTY_LABELS: Record<DiagnosisCertainty, string> = {
  [DiagnosisCertainty.CONFIRMED]: 'Confirmed',
  [DiagnosisCertainty.PROBABLE]: 'Probable',
  [DiagnosisCertainty.POSSIBLE]: 'Possible',
  [DiagnosisCertainty.RULE_OUT]: 'Rule Out',
  [DiagnosisCertainty.SUSPECTED]: 'Suspected',
  [DiagnosisCertainty.UNCERTAIN]: 'Uncertain',
};

export const DIAGNOSIS_CLINICAL_STATUS_LABELS: Record<DiagnosisClinicalStatus, string> = {
  [DiagnosisClinicalStatus.ACTIVE]: 'Active',
  [DiagnosisClinicalStatus.INACTIVE]: 'Inactive',
  [DiagnosisClinicalStatus.RESOLVED]: 'Resolved',
  [DiagnosisClinicalStatus.REMISSION]: 'Remission',
  [DiagnosisClinicalStatus.CHRONIC]: 'Chronic',
};

export const DIAGNOSIS_VERIFICATION_STATUS_LABELS: Record<DiagnosisVerificationStatus, string> = {
  [DiagnosisVerificationStatus.DRAFT]: 'Draft',
  [DiagnosisVerificationStatus.VERIFIED]: 'Verified',
  [DiagnosisVerificationStatus.DISPUTED]: 'Disputed',
  [DiagnosisVerificationStatus.INVALIDATED]: 'Invalidated',
};

export const DIAGNOSIS_STATUS_COLORS: Record<DiagnosisVerificationStatus, { bg: string; text: string; dot: string }> = {
  [DiagnosisVerificationStatus.DRAFT]: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
  [DiagnosisVerificationStatus.VERIFIED]: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  [DiagnosisVerificationStatus.DISPUTED]: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  [DiagnosisVerificationStatus.INVALIDATED]: { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' },
};

export const DIAGNOSIS_CLINICAL_STATUS_COLORS: Record<DiagnosisClinicalStatus, { bg: string; text: string; dot: string }> = {
  [DiagnosisClinicalStatus.ACTIVE]: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  [DiagnosisClinicalStatus.INACTIVE]: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  [DiagnosisClinicalStatus.RESOLVED]: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  [DiagnosisClinicalStatus.REMISSION]: { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  [DiagnosisClinicalStatus.CHRONIC]: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
};

export function getDiagnosisTypeDisplayName(type: DiagnosisType): string {
  return DIAGNOSIS_TYPE_LABELS[type];
}

export function getDiagnosisCertaintyDisplayName(certainty: DiagnosisCertainty): string {
  return DIAGNOSIS_CERTAINTY_LABELS[certainty];
}

export function getDiagnosisClinicalStatusDisplayName(status: DiagnosisClinicalStatus): string {
  return DIAGNOSIS_CLINICAL_STATUS_LABELS[status];
}

export function getDiagnosisVerificationStatusDisplayName(status: DiagnosisVerificationStatus): string {
  return DIAGNOSIS_VERIFICATION_STATUS_LABELS[status];
}

export function getDiagnosisStatusColor(status: DiagnosisVerificationStatus) {
  return DIAGNOSIS_STATUS_COLORS[status];
}

export function getDiagnosisClinicalStatusColor(status: DiagnosisClinicalStatus) {
  return DIAGNOSIS_CLINICAL_STATUS_COLORS[status];
}

export function getCertaintyOrder(certainty: DiagnosisCertainty): number {
  const order = {
    [DiagnosisCertainty.CONFIRMED]: 1,
    [DiagnosisCertainty.PROBABLE]: 2,
    [DiagnosisCertainty.POSSIBLE]: 3,
    [DiagnosisCertainty.SUSPECTED]: 4,
    [DiagnosisCertainty.RULE_OUT]: 5,
    [DiagnosisCertainty.UNCERTAIN]: 6,
  };
  return order[certainty] ?? 999;
}

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & DEFAULTS                            */
/* -------------------------------------------------------------------------- */

export const DEFAULT_DIAGNOSIS_TYPE = DiagnosisType.PRIMARY;
export const DEFAULT_DIAGNOSIS_CERTAINTY = DiagnosisCertainty.CONFIRMED;
export const DEFAULT_DIAGNOSIS_CLINICAL_STATUS = DiagnosisClinicalStatus.ACTIVE;

export const DIAGNOSIS_TYPE_OPTIONS = Object.values(DiagnosisType).map(type => ({
  value: type,
  label: getDiagnosisTypeDisplayName(type),
}));

export const DIAGNOSIS_CERTAINTY_OPTIONS = Object.values(DiagnosisCertainty).map(certainty => ({
  value: certainty,
  label: getDiagnosisCertaintyDisplayName(certainty),
}));

export const DIAGNOSIS_CLINICAL_STATUS_OPTIONS = Object.values(DiagnosisClinicalStatus).map(status => ({
  value: status,
  label: getDiagnosisClinicalStatusDisplayName(status),
}));

export const DIAGNOSIS_VERIFICATION_STATUS_OPTIONS = Object.values(DiagnosisVerificationStatus).map(status => ({
  value: status,
  label: getDiagnosisVerificationStatusDisplayName(status),
}));

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export type DiagnosisId = number;

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL TYPES                                */
/* -------------------------------------------------------------------------- */

export default {
  // Enums
  DiagnosisType,
  DiagnosisCertainty,
  DiagnosisClinicalStatus,
  DiagnosisVerificationStatus,
  
  // Type Guards
  isDiagnosisType,
  isDiagnosisCertainty,
  isDiagnosisClinicalStatus,
  isDiagnosisVerificationStatus,
  isDiagnosisSuccessResponse,
  
  // Display Functions
  getDiagnosisTypeDisplayName,
  getDiagnosisCertaintyDisplayName,
  getDiagnosisClinicalStatusDisplayName,
  getDiagnosisVerificationStatusDisplayName,
  getDiagnosisStatusColor,
  getDiagnosisClinicalStatusColor,
  getCertaintyOrder,
  
  // Constants
  DEFAULT_DIAGNOSIS_TYPE,
  DEFAULT_DIAGNOSIS_CERTAINTY,
  DEFAULT_DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_TYPE_OPTIONS,
  DIAGNOSIS_CERTAINTY_OPTIONS,
  DIAGNOSIS_CLINICAL_STATUS_OPTIONS,
  DIAGNOSIS_VERIFICATION_STATUS_OPTIONS,
  DIAGNOSIS_TYPE_LABELS,
  DIAGNOSIS_CERTAINTY_LABELS,
  DIAGNOSIS_CLINICAL_STATUS_LABELS,
  DIAGNOSIS_VERIFICATION_STATUS_LABELS,
  DIAGNOSIS_STATUS_COLORS,
  DIAGNOSIS_CLINICAL_STATUS_COLORS,
};