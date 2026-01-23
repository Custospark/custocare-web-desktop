/**
 * ============================================================================
 * CUSTOMER WALK-IN TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for customer walk-in
 * operations in the healthcare facility management system.
 * 
 * @module customerWalkInTypes
 * @description Comprehensive type definitions for walk-in customers, including
 * request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                              CORE TYPES                                    */
/* -------------------------------------------------------------------------- */

/**
 * Complete walk-in session entity as returned by the API.
 * Includes all fields from walk-in session creation.
 */
export interface WalkInSession {
  facility_id: number;
  walkin: {
    facility_id: number;
    system_user_id: number;
    patient_id: number;
    patient_uuid: string | null;
    display_name: string;
    mode: 'existing' | 'created';
  };
  visit: {
    id: number;
    visit_uuid: string;
    facility_id: number;
    patient_id: number;
    visit_type: string;
    acuity_score: number;
    chief_complaints: unknown[];
    arrived_at: string;
    current_phase: string;
    is_walk_in: boolean;
    status: string;
    created_at: string;
    updated_at: string;
  };
  billing: {
    id: number;
    billing_cycle_uuid: string;
    facility_id: number;
    visit_id: number;
    patient_id: number;
    cycle_type: string;
    period_start: string;
    billing_status: string;
    total_amount_charged: number;
    total_adjustments: number;
    net_amount: number;
    patient_responsibility_amount: number;
    patient_payment_received: number;
    created_by_staff_id: number | null;
    updated_by_staff_id: number | null;
    created_at: string;
    updated_at: string;
  };
  ui_next: {
    route: string;
    params: {
      billing_cycle_id: number;
      visit_id: number;
      patient_id: number;
    };
  };
}

/**
 * Walk-in patient information for a facility.
 */
export interface FacilityWalkInPatient {
  facility_id: number;
  system_user_id: number;
  patient_id: number;
  patient_uuid: string | null;
  display_name: string;
  mode: 'existing' | 'created';
}

/**
 * Upgraded walk-in session response.
 */
export interface UpgradedWalkInSession {
  facility_id: number;
  billing_cycle_id: number;
  visit_id: number;
  upgraded: boolean;
  new_user_id: number;
  new_patient_id: number;
  ui_next: {
    route: string;
    params: {
      billing_cycle_id: number;
      visit_id: number;
      patient_id: number;
    };
  };
}

/**
 * System walk-in user validation response.
 */
export interface SystemWalkInUserValidation {
  user_id: number;
  is_system_walkin: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for upgrading a walk-in session to a real patient.
 * All fields are optional but at least phone or email is required.
 */
export interface UpgradeWalkInSessionRequest {
  facility_id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  biological_sex?: 'male' | 'female' | 'intersex' | 'unknown';
  gender_identity?: string;
  country_code?: string;
  data_residency_region?: string;
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
  errors?: Record<string, string[]>;
  error?: string;
}

/**
 * Response for walk-in session creation.
 */
export type CreateWalkInSessionResponse = ApiSuccessResponse<WalkInSession>;

/**
 * Response for walk-in session upgrade.
 */
export type UpgradeWalkInSessionResponse = ApiSuccessResponse<UpgradedWalkInSession>;

/**
 * Response for facility walk-in patient retrieval.
 */
export type FacilityWalkInPatientResponse = ApiSuccessResponse<FacilityWalkInPatient>;

/**
 * Response for system walk-in user validation.
 */
export type SystemWalkInUserValidationResponse = ApiSuccessResponse<SystemWalkInUserValidation>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for billing cycle ID parameter in API calls.
 */
export type BillingCycleId = number;

/**
 * Type for facility ID parameter in filtered queries.
 */
export type FacilityId = number;

/**
 * Type for visit ID parameter in API calls.
 */
export type VisitId = number;

/**
 * Type for patient ID parameter in API calls.
 */
export type PatientId = number;

/**
 * Union type of all possible API responses.
 * Useful for comprehensive error handling.
 */
export type WalkInApiResponse =
  | CreateWalkInSessionResponse
  | UpgradeWalkInSessionResponse
  | FacilityWalkInPatientResponse
  | SystemWalkInUserValidationResponse;

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
 * Parameters for walk-in session creation.
 */
export interface CreateWalkInSessionParams {
  facilityId: FacilityId;
}

/**
 * Parameters for walk-in session upgrade.
 */
export interface UpgradeWalkInSessionParams {
  billingCycleId: BillingCycleId;
  data: UpgradeWalkInSessionRequest;
}

/**
 * Parameters for facility walk-in patient retrieval.
 */
export interface GetFacilityWalkInPatientParams {
  facilityId: FacilityId;
}

/**
 * Parameters for system walk-in user validation.
 */
export interface ValidateSystemWalkInUserParams {
  userId: number;
}

