/**
 * ============================================================================
 * PATIENT TYPE DEFINITIONS
 * ============================================================================
 *
 * Healthcare-grade patient search and patient creation types with explicit
 * duplicate-handling metadata and strongly typed response guards.
 *
 * @module usePatientTypes
 */

export type Nullable<T> = T | null;

/* -------------------------------------------------------------------------- */
/*                              CORE TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface PatientSearchResult {
  id: number;
  patient_number: string;
  global_user_uuid: string | null;
  name: string | null;
  date_of_birth: string | null; // YYYY-MM-DD
  biological_sex: BiologicalSex | null;
  blood_type: string | null;
  status: PatientStatus;
  requires_isolation: boolean;
  extra: Record<string, unknown> | null;
  created_at: string | null;
}

export interface PatientUserInfo {
  id: number;
  global_user_uuid: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  phone_hash: string | null;
  email_hash: string | null;
}

export interface PatientEntity {
  id: number;
  patient_uuid: string;
  user_id: number;
  date_of_birth: string | null;
  biological_sex: BiologicalSex | null;
  blood_type: string | null;
  status: PatientStatus;
  requires_isolation: boolean;
  created_at: string;
  user?: PatientUserInfo;
}

/* -------------------------------------------------------------------------- */
/*                            ENUMERATIONS                                    */
/* -------------------------------------------------------------------------- */

export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DECEASED = 'deceased',
  MERGED = 'merged',
  TEST_PATIENT = 'test_patient',
  SYSTEM_PATIENT = 'system_patient',
}

export enum BiologicalSex {
  MALE = 'male',
  FEMALE = 'female',
  INTERSEX = 'intersex',
  UNKNOWN = 'unknown',
}

export enum DuplicateAction {
  BLOCK = 'block',
  ALLOW = 'allow',
}

export enum ExistingUserAction {
  USE_EXISTING = 'use_existing',
  BLOCK = 'block',
}

export type ContactMatchField = 'email' | 'phone';

export type PatientConflictCode =
  | 'CONTACT_MATCH'
  | 'DEMOGRAPHIC_DUPLICATE'
  | 'USER_ALREADY_HAS_PATIENT'
  | 'IDENTITY_MISMATCH';

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

export interface PatientSearchRequest {
  q?: string;
  patient_uuid?: string;
  status?: PatientStatus;
  biological_sex?: BiologicalSex;
  date_of_birth_from?: string;
  date_of_birth_to?: string;
  facility_id?: number;
  limit?: number;
  offset?: number;
}

export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth: string;
  biological_sex: BiologicalSex;
  created_from_facility_id?: number;
  action_on_possible_duplicate?: DuplicateAction;
  existing_user_action?: ExistingUserAction;
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

export interface BaseApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiSuccessResponse<T = unknown> extends BaseApiResponse<T> {
  success: true;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse extends BaseApiResponse<[]> {
  success: false;
  errors?: Record<string, string[]>;
  meta?: Record<string, unknown>;
}

export interface PatientSearchResponse extends ApiSuccessResponse<PatientSearchResult[]> {
  meta: {
    total: number;
    criteria: PatientSearchRequest;
  };
}

export interface PatientCreationMetadata {
  status: 'possible_duplicate' | 'existing_user_found' | 'already_has_patient' | 'created';
  created_new_user?: boolean;
  possible_duplicate?: PatientSearchResult | null;
  existing_patient?: PatientSearchResult | null;
  onboarding_link_required?: boolean;
  existing_user_global_user_uuid?: string | null;
  matched_contact_fields?: ContactMatchField[];
  matched_fields?: string[];
  demographic_match?: boolean;
  conflict_code?: PatientConflictCode | null;
}

export interface PatientCreateSuccessResponse extends Omit<ApiSuccessResponse<PatientSearchResult>, 'meta'> {
  success: true;
  meta: PatientCreationMetadata & {
    status: 'created' | 'already_has_patient';
    created_new_user: boolean;
    onboarding_link_required: boolean;
  };
}

export interface PatientCreateConflictResponse extends Omit<ApiErrorResponse, 'meta'> {
  success: false;
  meta: PatientCreationMetadata & {
    status: 'possible_duplicate' | 'existing_user_found';
  };
}

export type PatientCreateResponse =
  | PatientCreateSuccessResponse
  | PatientCreateConflictResponse;

/* -------------------------------------------------------------------------- */
/*                              UI STATE TYPES                                */
/* -------------------------------------------------------------------------- */

export interface MutationCallbacks<TData = unknown, TError = ApiErrorResponse> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: () => void;
}

export interface PatientSearchResultWithSelection extends PatientSearchResult {
  selected?: boolean;
  highlighted?: boolean;
}

export interface PatientSearchState {
  query: string;
  filters: Omit<PatientSearchRequest, 'q' | 'limit' | 'offset'>;
  results: PatientSearchResult[];
  isLoading: boolean;
  error: string | null;
  selectedPatient: PatientSearchResult | null;
}

export interface PatientCreationState {
  formData: Partial<CreatePatientRequest>;
  isLoading: boolean;
  error: string | null;
  conflictData: {
    type: 'possible_duplicate' | 'existing_user_found' | null;
    existingPatient?: PatientSearchResult;
    existingUser?: {
      global_user_uuid: string;
    };
    matchedContactFields?: ContactMatchField[];
    demographicMatch?: boolean;
    conflictCode?: PatientConflictCode | null;
  };
}

/* -------------------------------------------------------------------------- */
/*                           VALIDATION TYPES                                 */
/* -------------------------------------------------------------------------- */

export interface PatientFormValidationErrors {
  first_name?: string[];
  last_name?: string[];
  email?: string[];
  phone?: string[];
  date_of_birth?: string[];
  biological_sex?: string[];
  contact?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: PatientFormValidationErrors;
}

export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validator?: (value: string) => string | null;
}

export interface PatientFormValidationRules {
  first_name: FieldValidationRule;
  last_name: FieldValidationRule;
  email: FieldValidationRule;
  phone: FieldValidationRule;
  date_of_birth: FieldValidationRule;
  biological_sex: FieldValidationRule;
}

/* -------------------------------------------------------------------------- */
/*                             TYPE GUARDS                                    */
/* -------------------------------------------------------------------------- */

export function isApiErrorResponse<T = unknown>(
  response: ApiSuccessResponse<T> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}
export interface PossibleDuplicateConflictResponse
  extends Omit<PatientCreateConflictResponse, 'meta'> {
  success: false;
  meta: PatientCreationMetadata & {
    status: 'possible_duplicate';
  };
}

export interface ExistingUserConflictResponse
  extends Omit<PatientCreateConflictResponse, 'meta'> {
  success: false;
  meta: PatientCreationMetadata & {
    status: 'existing_user_found';
  };
}

export interface NewPatientCreatedResponse
  extends Omit<PatientCreateSuccessResponse, 'meta'> {
  success: true;
  meta: PatientCreationMetadata & {
    status: 'created';
    created_new_user: boolean;
    onboarding_link_required: boolean;
  };
}

export interface ExistingPatientSuccessResponse
  extends Omit<PatientCreateSuccessResponse, 'meta'> {
  success: true;
  meta: PatientCreationMetadata & {
    status: 'already_has_patient';
    created_new_user: boolean;
    onboarding_link_required: boolean;
  };
}


export function isPatientCreateConflictResponse(
  response: PatientCreateResponse
): response is PatientCreateConflictResponse {
  return (
    response.success === false &&
    (response.meta?.status === 'possible_duplicate' ||
      response.meta?.status === 'existing_user_found')
  );
}

export function isPatientCreateSuccessResponse(
  response: PatientCreateResponse
): response is PatientCreateSuccessResponse {
  return (
    response.success === true &&
    (response.meta?.status === 'created' ||
      response.meta?.status === 'already_has_patient')
  );
}

export function isPossibleDuplicateResponse(
  response: PatientCreateResponse
): response is PossibleDuplicateConflictResponse {
  return (
    isPatientCreateConflictResponse(response) &&
    response.meta.status === 'possible_duplicate'
  );
}

export function isExistingUserResponse(
  response: PatientCreateResponse
): response is ExistingUserConflictResponse {
  return (
    isPatientCreateConflictResponse(response) &&
    response.meta.status === 'existing_user_found'
  );
}

export function isNewPatientCreatedResponse(
  response: PatientCreateResponse
): response is NewPatientCreatedResponse {
  return (
    isPatientCreateSuccessResponse(response) &&
    response.meta.status === 'created'
  );
}


/* -------------------------------------------------------------------------- */
/*                         PATIENT UTILITY FUNCTIONS                          */
/* -------------------------------------------------------------------------- */

export function formatPatientName(patient: PatientSearchResult): string {
  if (patient.name && patient.name.trim().length > 0) {
    return patient.name.trim();
  }

  return `Patient ${patient.patient_number}`;
}

export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;

  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age;
  } catch {
    return null;
  }
}

export type StatusColor = 'success' | 'warning' | 'error' | 'info' | 'default';

export function getStatusColor(status: PatientStatus): StatusColor {
  const colorMap: Record<PatientStatus, StatusColor> = {
    [PatientStatus.ACTIVE]: 'success',
    [PatientStatus.INACTIVE]: 'warning',
    [PatientStatus.DECEASED]: 'error',
    [PatientStatus.MERGED]: 'info',
    [PatientStatus.TEST_PATIENT]: 'default',
    [PatientStatus.SYSTEM_PATIENT]: 'default',
  };

  return colorMap[status] || 'default';
}

export function requiresSpecialHandling(patient: PatientSearchResult): boolean {
  return (
    patient.requires_isolation ||
    patient.status === PatientStatus.DECEASED ||
    patient.status === PatientStatus.TEST_PATIENT ||
    patient.status === PatientStatus.SYSTEM_PATIENT
  );
}

export function getStatusDisplayText(status: PatientStatus): string {
  const displayMap: Record<PatientStatus, string> = {
    [PatientStatus.ACTIVE]: 'Active',
    [PatientStatus.INACTIVE]: 'Inactive',
    [PatientStatus.DECEASED]: 'Deceased',
    [PatientStatus.MERGED]: 'Merged',
    [PatientStatus.TEST_PATIENT]: 'Test Patient',
    [PatientStatus.SYSTEM_PATIENT]: 'System Patient',
  };

  return displayMap[status] || status;
}

export function getBiologicalSexDisplayText(sex: BiologicalSex): string {
  const displayMap: Record<BiologicalSex, string> = {
    [BiologicalSex.MALE]: 'Male',
    [BiologicalSex.FEMALE]: 'Female',
    [BiologicalSex.INTERSEX]: 'Intersex',
    [BiologicalSex.UNKNOWN]: 'Unknown',
  };

  return displayMap[sex] || sex;
}

export function getPatientInitials(patient: PatientSearchResult): string {
  if (!patient.name?.trim()) {
    return '??';
  }

  const nameParts = patient.name.trim().split(/\s+/);
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
}

export function validatePatientFormData(
  data: Partial<CreatePatientRequest>
): ValidationResult {
  const errors: PatientFormValidationErrors = {};

  if (!data.first_name?.trim()) {
    errors.first_name = ['First name is required'];
  }

  if (!data.last_name?.trim()) {
    errors.last_name = ['Last name is required'];
  }

  if (!data.date_of_birth?.trim()) {
    errors.date_of_birth = ['Date of birth is required'];
  } else {
    const dob = new Date(data.date_of_birth);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      errors.date_of_birth = ['Invalid date of birth'];
    }
  }

  if (!data.biological_sex) {
    errors.biological_sex = ['Biological sex is required'];
  }

  if (!data.email?.trim() && !data.phone?.trim()) {
    errors.contact = ['Email or phone is required'];
  }

  if (data.email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = ['Invalid email format'];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function hasKey<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  return obj?.[key];
}

export function extractPatientCreationMeta(
  response: PatientCreateResponse
): PatientCreationMetadata | undefined {
  return 'meta' in response ? (response.meta as PatientCreationMetadata) : undefined;
}

/* -------------------------------------------------------------------------- */
/*                          SEARCH/STATE HELPERS                              */
/* -------------------------------------------------------------------------- */

export type SearchCriteriaModifier =
  | Partial<PatientSearchRequest>
  | ((current: PatientSearchRequest) => PatientSearchRequest);

export const DEFAULT_SEARCH_CRITERIA: PatientSearchRequest = {
  q: '',
  limit: 15,
  status: PatientStatus.ACTIVE,
};

export type PatientSelectionCallback = (patient: PatientSearchResult) => void;

export type PatientFilterChangeCallback = (
  filters: Omit<PatientSearchRequest, 'q' | 'limit' | 'offset'>
) => void;