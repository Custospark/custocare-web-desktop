/**
 * ============================================================================
 * WARD TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for ward-related
 * operations in the healthcare facility management system.
 * 
 * @module wardTypes
 * @description Comprehensive type definitions for wards, including
 * request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Available ward types in the healthcare facility system.
 * Maps to backend enum values for ward classification.
 */
export enum WardType {
  MEDICAL = 'medical',
  SURGICAL = 'surgical',
  MATERNITY = 'maternity',
  PEDIATRIC = 'pediatric',
  ICU = 'icu',
  NICU = 'nicu',
  PSYCHIATRIC = 'psychiatric',
  ISOLATION = 'isolation',
  EMERGENCY_OBSERVATION = 'emergency_observation',
  GENERAL = 'general',
}

/**
 * Ward operational status.
 * Determines whether the ward is accepting patients and functioning.
 */
export enum WardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TEMPORARILY_CLOSED = 'temporarily_closed',
}

/**
 * Sex restriction for ward admission.
 * Determines which gender patients can be admitted to the ward.
 */
export enum SexRestriction {
  MIXED = 'mixed',
  MALE_ONLY = 'male_only',
  FEMALE_ONLY = 'female_only',
}

/**
 * Age group restriction for ward admission.
 * Determines which age group patients can be admitted to the ward.
 */
export enum AgeGroup {
  ALL = 'all',
  ADULT = 'adult',
  PEDIATRIC = 'pediatric',
  NEONATAL = 'neonatal',
}

/* -------------------------------------------------------------------------- */
/*                            CORE WARD TYPE                                  */
/* -------------------------------------------------------------------------- */

/**
 * Complete ward entity as returned by the API.
 * Includes all fields, computed properties, and relationships.
 */
export interface Ward {
  // Primary identifiers
  id: number;
  facility_id: number;

  // Enterprise identifiers
  code: string | null;
  name: string;

  // Ward classification
  ward_type: WardType;
  ward_type_label?: string;

  // Physical context
  building: string | null;
  floor: string | null;

  // Operational state
  status: WardStatus;
  status_label?: string;

  // Capacity
  capacity_declared: number | null;
  capacity_operational: number | null;

  // Restrictions
  sex_restriction: SexRestriction;
  age_group: AgeGroup;

  // Notes / audit
  note: string | null;
  created_by_user_id: number | null;
  updated_by_user_id: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new ward.
 * All required fields must be provided; optional fields can be omitted.
 */
export interface CreateWardRequest {
  // Required fields
  facility_id: number;
  name: string;

  // Optional enterprise identifier
  code?: string | null;

  // Optional classification
  ward_type?: WardType;

  // Optional physical context
  building?: string | null;
  floor?: string | null;

  // Optional operational state
  status?: WardStatus;

  // Optional capacity
  capacity_declared?: number | null;
  capacity_operational?: number | null;

  // Optional restrictions
  sex_restriction?: SexRestriction;
  age_group?: AgeGroup;

  // Optional notes
  note?: string | null;
}

/**
 * Request payload for updating an existing ward.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateWardRequest {
  name?: string;
  code?: string | null;
  ward_type?: WardType;
  building?: string | null;
  floor?: string | null;
  status?: WardStatus;
  capacity_declared?: number | null;
  capacity_operational?: number | null;
  sex_restriction?: SexRestriction;
  age_group?: AgeGroup;
  note?: string | null;
}

/**
 * Query parameters for filtering ward list.
 * Used in GET /wards endpoint.
 */
export interface WardFilters {
  facility_id: number;
  status?: WardStatus;
  ward_type?: WardType;
  search?: string;
}

/**
 * Standard success response structure.
 * Generic type parameter T represents the data payload.
 */
export interface ApiSuccessResponse<T> {
  message: string;
  data: T;
}

/**
 * Standard error response structure.
 * Includes error message and optional validation errors.
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Response for ward list endpoint (GET /wards).
 */
export type GetWardsResponse = Ward[];

/**
 * Response for single ward operations (GET, POST, PATCH).
 */
export type WardResponse = ApiSuccessResponse<Ward>;

/**
 * Response for delete operation (DELETE /wards/:id).
 */
export type DeleteWardResponse = ApiSuccessResponse<null>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for ward ID parameter in API calls.
 */
export type WardId = number;

/**
 * Type for facility ID parameter in filtered queries.
 */
export type FacilityId = number;

/**
 * Union type of all possible API responses.
 * Useful for comprehensive error handling.
 */
export type WardApiResponse =
  | GetWardsResponse
  | WardResponse
  | DeleteWardResponse;

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
  response: any
): response is ApiErrorResponse {
  return response && typeof response === 'object' && 'errors' in response;
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
 * Combines ID with request payload.
 */
export interface UpdateWardParams {
  id: WardId;
  facility_id: FacilityId;
  data: UpdateWardRequest;
}

/**
 * Parameters for delete mutation.
 */
export interface DeleteWardParams {
  id: WardId;
  facility_id: FacilityId;
}

/**
 * Parameters for get single ward mutation.
 */
export interface GetWardParams {
  id: WardId;
  facility_id: FacilityId;
}