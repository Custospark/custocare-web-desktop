/**
 * ============================================================================
 * PATIENT TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for patient management
 * operations in the healthcare facility management system.
 * 
 * @module usePatientTypes
 * @description Comprehensive type definitions for patient search, creation,
 * and management including request/response types, enums, and utility types.
 */

/* -------------------------------------------------------------------------- */
/*                              CORE TYPES                                    */
/* -------------------------------------------------------------------------- */

/**
 * Patient search result from the API (lean payload)
 */
export interface PatientSearchResult {
  id:number;
  patient_number: string; // patient_uuid
  global_user_uuid: string | null;
  name: string | null; // display name
  date_of_birth: string | null; // YYYY-MM-DD
  biological_sex: BiologicalSex | null;
  blood_type: string | null;
  status: PatientStatus;
  requires_isolation: boolean;
  extra: Record<string, unknown> | null;
  created_at: string | null;
}

/**
 * User information associated with a patient
 */
export interface PatientUserInfo {
  id: number;
  global_user_uuid: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  phone_hash: string | null;
  email_hash: string | null;
}

/**
 * Complete patient entity with user relationship
 */
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

/**
 * Patient creation result metadata from createPatientByStaff API
 */
export interface PatientCreationMetadata {
  status: 'possible_duplicate' | 'existing_user_found' | 'already_has_patient' | 'created';
  created_new_user?: boolean;
  possible_duplicate?: PatientSearchResult | null;
  onboarding_link_required?: boolean;
  existing_user_global_user_uuid?: string;
}

/**
 * Patient creation result from createPatientByStaff API
 */
export interface PatientCreationResult {
  status: 'possible_duplicate' | 'existing_user_found' | 'already_has_patient' | 'created';
  patient: PatientSearchResult | null;
  existing_user: {
    global_user_uuid: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
  } | null;
  possible_duplicate: PatientSearchResult | null;
  created_new_user: boolean;
  onboarding_link_required: boolean;
}

/* -------------------------------------------------------------------------- */
/*                            ENUMERATIONS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Patient status values
 */
export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DECEASED = 'deceased',
  MERGED = 'merged',
  TEST_PATIENT = 'test_patient',
  SYSTEM_PATIENT = 'system_patient'
}

/**
 * Biological sex options
 */
export enum BiologicalSex {
  MALE = 'male',
  FEMALE = 'female',
  INTERSEX = 'intersex',
  UNKNOWN = 'unknown'
}

/**
 * Patient creation conflict resolution actions
 */
export enum DuplicateAction {
  BLOCK = 'block',
  ALLOW = 'allow'
}

/**
 * Existing user handling actions
 */
export enum ExistingUserAction {
  USE_EXISTING = 'use_existing',
  BLOCK = 'block'
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Patient search request parameters
 */
export interface PatientSearchRequest {
  q?: string; // general search term: patient_uuid OR name
  patient_uuid?: string;
  status?: PatientStatus;
  biological_sex?: BiologicalSex;
  date_of_birth_from?: string; // ISO date format
  date_of_birth_to?: string; // ISO date format
  facility_id?: number;
  limit?: number; // 1-50
}

/**
 * Patient creation request payload
 */
export interface CreatePatientRequest {
  // USER fields
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  
  // PATIENT fields
  date_of_birth: string; // ISO date format
  biological_sex: BiologicalSex;
  
  // Optional context
  created_from_facility_id?: number;
  
  // Duplicate-handling controls
  action_on_possible_duplicate?: DuplicateAction;
  existing_user_action?: ExistingUserAction;
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Base API response structure with generic data type
 */
export interface BaseApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T = unknown> extends BaseApiResponse<T> {
  success: true;
  meta?: Record<string, unknown>;
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse extends BaseApiResponse<[]> {
  success: false;
  errors?: Record<string, string[]>;
}

/**
 * Patient search API response
 */
export interface PatientSearchResponse extends ApiSuccessResponse<PatientSearchResult[]> {
  meta: {
    total: number;
    criteria: PatientSearchRequest;
  };
}

/**
 * Patient creation API response (successful creation)
 */
export interface PatientCreateSuccessResponse extends ApiSuccessResponse<PatientSearchResult> {
  meta: {
    status: 'created' | 'already_has_patient';
    created_new_user: boolean;
    possible_duplicate: PatientSearchResult | null;
    onboarding_link_required: boolean;
  };
}

/**
 * Patient creation API response (conflict)
 */
export interface PatientCreateConflictResponse extends ApiErrorResponse {
  meta: PatientCreationMetadata;
}

/**
 * Union type for all patient creation responses
 */
export type PatientCreateResponse = PatientCreateSuccessResponse | PatientCreateConflictResponse;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type guard to check if response is an error response
 */
export function isApiErrorResponse<T = unknown>(
  response: ApiSuccessResponse<T> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if patient creation response is a conflict
 */
export function isPatientCreateConflictResponse(
  response: PatientCreateResponse
): response is PatientCreateConflictResponse {
  return response.success === false && 
    (response.meta?.status === 'possible_duplicate' || 
     response.meta?.status === 'existing_user_found');
}

/**
 * Type guard to check if patient creation response is successful creation
 */
export function isPatientCreateSuccessResponse(
  response: PatientCreateResponse
): response is PatientCreateSuccessResponse {
  return response.success === true && 
    (response.meta?.status === 'created' || 
     response.meta?.status === 'already_has_patient');
}

/**
 * Type guard to check if response is a duplicate patient conflict
 */
export function isPossibleDuplicateResponse(
  response: PatientCreateResponse
): response is PatientCreateConflictResponse {
  return isPatientCreateConflictResponse(response) && 
    response.meta.status === 'possible_duplicate';
}

/**
 * Type guard to check if response is an existing user conflict
 */
export function isExistingUserResponse(
  response: PatientCreateResponse
): response is PatientCreateConflictResponse {
  return isPatientCreateConflictResponse(response) && 
    response.meta.status === 'existing_user_found';
}

/**
 * Type guard to check if patient was newly created
 */
export function isNewPatientCreatedResponse(
  response: PatientCreateResponse
): response is PatientCreateSuccessResponse {
  return isPatientCreateSuccessResponse(response) && 
    response.meta.status === 'created';
}

/**
 * Options for mutation callbacks
 */
export interface MutationCallbacks<TData = unknown, TError = ApiErrorResponse> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: () => void;
}

/**
 * Search result with additional UI state
 */
export interface PatientSearchResultWithSelection extends PatientSearchResult {
  selected?: boolean;
  highlighted?: boolean;
}

/**
 * Patient search criteria for local state management
 */
export interface PatientSearchState {
  query: string;
  filters: Omit<PatientSearchRequest, 'q' | 'limit'>;
  results: PatientSearchResult[];
  isLoading: boolean;
  error: string | null;
  selectedPatient: PatientSearchResult | null;
}

/**
 * Patient creation state for form management
 */
export interface PatientCreationState {
  formData: Partial<CreatePatientRequest>;
  isLoading: boolean;
  error: string | null;
  conflictData: {
    type: 'possible_duplicate' | 'existing_user_found' | null;
    existingPatient?: PatientSearchResult;
    existingUser?: {
      global_user_uuid: string;
      first_name: string;
      last_name: string;
      display_name: string | null;
    };
  };
}

/* -------------------------------------------------------------------------- */
/*                           VALIDATION TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Validation errors for patient creation form
 */
export interface PatientFormValidationErrors {
  first_name?: string[];
  last_name?: string[];
  email?: string[];
  phone?: string[];
  date_of_birth?: string[];
  biological_sex?: string[];
  contact?: string[]; // Email or phone required error
}

/**
 * Validation result for form inputs
 */
export interface ValidationResult {
  isValid: boolean;
  errors: PatientFormValidationErrors;
}

/**
 * Field validation rules
 */
export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validator?: (value: string) => string | null;
}

/**
 * Validation rules for patient creation form
 */
export interface PatientFormValidationRules {
  first_name: FieldValidationRule;
  last_name: FieldValidationRule;
  email: FieldValidationRule;
  phone: FieldValidationRule;
  date_of_birth: FieldValidationRule;
  biological_sex: FieldValidationRule;
}

/* -------------------------------------------------------------------------- */
/*                         PATIENT UTILITY FUNCTIONS                          */
/* -------------------------------------------------------------------------- */

/**
 * Format patient name for display
 */
export function formatPatientName(patient: PatientSearchResult): string {
  if (patient.name && patient.name.trim().length > 0) {
    return patient.name.trim();
  }
  return `Patient ${patient.patient_number}`;
}

/**
 * Calculate patient age from date of birth
 */
export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    // Validate date
    if (isNaN(birthDate.getTime())) {
      return null;
    }
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return null;
  }
}

/**
 * Get status badge color based on patient status
 */
export type StatusColor = 'success' | 'warning' | 'error' | 'info' | 'default';

export function getStatusColor(status: PatientStatus): StatusColor {
  const colorMap: Record<PatientStatus, StatusColor> = {
    [PatientStatus.ACTIVE]: 'success',
    [PatientStatus.INACTIVE]: 'warning',
    [PatientStatus.DECEASED]: 'error',
    [PatientStatus.MERGED]: 'info',
    [PatientStatus.TEST_PATIENT]: 'default',
    [PatientStatus.SYSTEM_PATIENT]: 'default'
  };
  
  return colorMap[status] || 'default';
}

/**
 * Check if patient requires special handling
 */
export function requiresSpecialHandling(patient: PatientSearchResult): boolean {
  return patient.requires_isolation || 
         patient.status === PatientStatus.DECEASED ||
         patient.status === PatientStatus.TEST_PATIENT ||
         patient.status === PatientStatus.SYSTEM_PATIENT;
}

/**
 * Get patient status display text
 */
export function getStatusDisplayText(status: PatientStatus): string {
  const displayMap: Record<PatientStatus, string> = {
    [PatientStatus.ACTIVE]: 'Active',
    [PatientStatus.INACTIVE]: 'Inactive',
    [PatientStatus.DECEASED]: 'Deceased',
    [PatientStatus.MERGED]: 'Merged',
    [PatientStatus.TEST_PATIENT]: 'Test Patient',
    [PatientStatus.SYSTEM_PATIENT]: 'System Patient'
  };
  
  return displayMap[status] || status;
}

/**
 * Get biological sex display text
 */
export function getBiologicalSexDisplayText(sex: BiologicalSex): string {
  const displayMap: Record<BiologicalSex, string> = {
    [BiologicalSex.MALE]: 'Male',
    [BiologicalSex.FEMALE]: 'Female',
    [BiologicalSex.INTERSEX]: 'Intersex',
    [BiologicalSex.UNKNOWN]: 'Unknown'
  };
  
  return displayMap[sex] || sex;
}

/**
 * Extract patient initials from name
 */
export function getPatientInitials(patient: PatientSearchResult): string {
  if (!patient.name) {
    return '??';
  }
  
  const nameParts = patient.name.trim().split(' ');
  if (nameParts.length === 0) {
    return '??';
  }
  
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
}

/**
 * Validate patient creation form data
 */
export function validatePatientFormData(data: Partial<CreatePatientRequest>): ValidationResult {
  const errors: PatientFormValidationErrors = {};
  
  // Required fields
  if (!data.first_name?.trim()) {
    errors.first_name = ['First name is required'];
  }
  
  if (!data.last_name?.trim()) {
    errors.last_name = ['Last name is required'];
  }
  
  if (!data.date_of_birth) {
    errors.date_of_birth = ['Date of birth is required'];
  } else {
    const dob = new Date(data.date_of_birth);
    if (isNaN(dob.getTime()) || dob > new Date()) {
      errors.date_of_birth = ['Invalid date of birth'];
    }
  }
  
  if (!data.biological_sex) {
    errors.biological_sex = ['Biological sex is required'];
  }
  
  // Email or phone is required
  if (!data.email?.trim() && !data.phone?.trim()) {
    errors.contact = ['Email or phone is required'];
  }
  
  // Email format validation
  if (data.email?.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = ['Invalid email format'];
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Type-safe object key checker
 */
export function hasKey<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Safe access to nested properties
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  return obj?.[key];
}

/**
 * Extract meta data from patient creation response
 */
export function extractPatientCreationMeta(response: PatientCreateResponse): PatientCreationMetadata | undefined {
  if ('meta' in response) {
    return response.meta as PatientCreationMetadata;
  }
  return undefined;
}

/**
 * Type for search criteria modification
 */
export type SearchCriteriaModifier = Partial<PatientSearchRequest> | ((current: PatientSearchRequest) => PatientSearchRequest);

/**
 * Default search criteria
 */
export const DEFAULT_SEARCH_CRITERIA: PatientSearchRequest = {
  q: '',
  limit: 15,
  status: PatientStatus.ACTIVE
};

/**
 * Type for patient selection callback
 */
export type PatientSelectionCallback = (patient: PatientSearchResult) => void;

/**
 * Type for patient search filter change callback
 */
export type PatientFilterChangeCallback = (filters: Omit<PatientSearchRequest, 'q' | 'limit'>) => void;