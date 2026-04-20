/**
 * ============================================================================
 * ALLERGY TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for allergy-related
 * operations in the healthcare facility management system.
 * 
 * @module allergyTypes
 * @description Comprehensive type definitions for allergies, including
 * request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Allergy severity levels.
 * Maps to backend enum values for clinical severity classification.
 */
export enum AllergySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Simplified patient reference for nested responses.
 */
export interface PatientReference {
  id: number;
  patient_uuid: string;
  patient_number?: string;
  name?: string;
}

/**
 * Simplified user reference for who recorded the allergy.
 */
export interface UserReference {
  id: number;
  name: string;
  email?: string;
}

/**
 * Simplified visit reference for nested responses.
 */
export interface VisitReference {
  id: number;
  visit_uuid?: string;
  visit_date: string | null;
  facility_name: string | null;
  facility_main_phone: string | null;
}

/* -------------------------------------------------------------------------- */
/*                            CORE ALLERGY TYPE                               */
/* -------------------------------------------------------------------------- */

/**
 * Complete allergy entity as returned by the API.
 * Includes all fields, computed properties, and optional relationships.
 */
export interface Allergy {
  // Primary identifiers
  id: number;
  patient_id: number;

  // Core fields
  allergen: string;
  reaction: string | null;
  severity: AllergySeverity;
  clinical_notes: string | null;

  // Status
  is_active: boolean;
  is_severe: boolean;
  is_resolved: boolean;

  // Timestamps
  diagnosed_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Relationships (loaded conditionally)
  recorded_by?: UserReference;
  visit?: VisitReference;
  patient?: PatientReference;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new allergy.
 * All required fields must be provided; optional fields can be omitted.
 */
export interface CreateAllergyRequest {
  // Required fields
  allergen?: string;
  severity: AllergySeverity;

  // Optional fields
  reaction?: string | null;
  clinical_notes?: string | null;
  visit_id?: number | null;
  diagnosed_at?: string | null; // ISO date string
  is_active?: boolean;
}

/**
 * Request payload for updating an existing allergy.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateAllergyRequest {
  allergen?: string;
  reaction?: string | null;
  severity?: AllergySeverity;
  clinical_notes?: string | null;
  is_active?: boolean;
  diagnosed_at?: string | null;
  resolved_at?: string | null;
  visit_id?: number | null;
}

/**
 * Query parameters for filtering allergy list.
 * Used in GET /patients/{patient}/allergies endpoint.
 */
export interface AllergyFilters {
  is_active?: boolean;
  severity?: AllergySeverity;
  search?: string;
  per_page?: number;
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard success response structure.
 * Generic type parameter T represents the data payload.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Standard error response structure.
 * Includes error message and optional validation errors.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  data?: [];
  errors?: Record<string, string[]>;
  error?: string; // Debug error message (only in development)
}

/**
 * Response for allergy list endpoint (GET /patients/{patient}/allergies).
 */
export type GetAllergiesResponse = ApiSuccessResponse<Allergy[]> & {
  meta: {
    total: number;
    active_count: number;
    severe_count: number;
  };
};

/**
 * Response for active allergies endpoint (GET /patients/{patient}/allergies/active).
 */
export interface GetActiveAllergiesResponse extends ApiSuccessResponse<Allergy[]> {
  meta: {
    warning_text: string | null;
    has_severe_allergy: boolean;
  };
}

/**
 * Response for single allergy operations (GET, POST, PUT).
 */
export type AllergyResponse = ApiSuccessResponse<Allergy>;

/**
 * Response for delete operation (DELETE /patients/{patient}/allergies/{allergy}).
 */
export type DeleteAllergyResponse = ApiSuccessResponse<null>;

/**
 * Response for restore operation (POST /patients/{patient}/allergies/{allergy}/restore).
 */
export type RestoreAllergyResponse = ApiSuccessResponse<Allergy>;

/**
 * Response for resolve operation (POST /patients/{patient}/allergies/{allergy}/resolve).
 */
export type ResolveAllergyResponse = ApiSuccessResponse<Allergy>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for patient ID parameter in API calls.
 */
export type PatientId = number | string;

/**
 * Type for allergy ID parameter in API calls.
 */
export type AllergyId = number;

/**
 * Union type of all possible API responses.
 * Useful for comprehensive error handling.
 */
export type AllergyApiResponse =
  | GetAllergiesResponse
  | GetActiveAllergiesResponse
  | AllergyResponse
  | DeleteAllergyResponse
  | RestoreAllergyResponse
  | ResolveAllergyResponse;

/**
 * Type guard to check if response is an error.
 * 
 * @param response - API response to check
 * @returns True if response is an error response
 * 
 * @example
 * if (isApiErrorResponse(response)) {
 *   console.error(response.message);
 * }
 */
export function isApiErrorResponse(
  response: ApiSuccessResponse<unknown> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Options for mutation callbacks.
 * Provides consistent typing for onSuccess and onError handlers.
 */
export interface MutationCallbacks<TData, TError = ApiErrorResponse> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Parameters for update and delete mutations.
 * Combines IDs with request payload.
 */
export interface UpdateAllergyParams {
  patientId: PatientId;
  allergyId: AllergyId;
  data: UpdateAllergyRequest;
}

/**
 * Parameters for delete mutation.
 */
export interface DeleteAllergyParams {
  patientId: PatientId;
  allergyId: AllergyId;
}

/**
 * Parameters for restore mutation.
 */
export interface RestoreAllergyParams {
  patientId: PatientId;
  allergyId: AllergyId;
}

/**
 * Parameters for resolve mutation.
 */
export interface ResolveAllergyParams {
  patientId: PatientId;
  allergyId: AllergyId;
}

/**
 * Parameters for creating a new allergy.
 */
export interface CreateAllergyParams {
  patientId: PatientId;
  data: CreateAllergyRequest;
}