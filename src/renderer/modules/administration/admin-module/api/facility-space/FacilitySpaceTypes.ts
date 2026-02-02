/**
 * ============================================================================
 * FACILITY SPACE TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for facility space-related
 * operations in the healthcare facility management system.
 * 
 * @module facilitySpaceTypes
 * @description Comprehensive type definitions for facility spaces, including
 * request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Available space types in the healthcare facility system.
 * Maps to backend enum values for space classification.
 */
export enum FacilitySpaceType {
  CONSULTATION = 'consultation',
  TRIAGE = 'triage',
  LAB = 'lab',
  THEATRE = 'theatre',
  WARD = 'ward',
  PHARMACY = 'pharmacy',
}

/**
 * Space operational status.
 * Determines whether the space is currently available for use.
 */
export enum SpaceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Simplified facility reference for nested responses.
 */
export interface FacilityReference {
  id: number;
  facility_uuid: string;
  facility_code: string;
  facility_name: string;
  facility_type: string;
}

/**
 * Simplified space reference for relationships.
 */
export interface SpaceReference {
  id: number;
  name: string;
  type: FacilitySpaceType;
  type_label: string;
  floor: string | null;
  building: string | null;
  is_active: boolean;
}

/* -------------------------------------------------------------------------- */
/*                            CORE SPACE TYPE                                 */
/* -------------------------------------------------------------------------- */

/**
 * Complete facility space entity as returned by the API.
 * Includes all fields from the database with computed properties.
 */
export interface FacilitySpace {
  // Primary identifiers
  id: number;
  facility_id: number;
  
  // Basic information
  name: string;
  type: FacilitySpaceType;
  type_label: string;
  
  // Location details
  floor: string | null;
  building: string | null;
  
  // Status
  is_active: boolean;
  status: SpaceStatus;
  status_label: string;
  
  // Audit timestamps
  created_at: string;
  updated_at: string;
  
  // Relationships (loaded conditionally)
  facility?: FacilityReference;
  
  // Computed attributes
  full_location: string | null;
  is_available: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new facility space.
 * All required fields must be provided; optional fields can be omitted.
 */
export interface CreateFacilitySpaceRequest {
  // Required fields
  facility_id: number;
  name: string;
  type: FacilitySpaceType;
  
  // Optional fields
  floor?: string | null;
  building?: string | null;
  is_active?: boolean;
}

/**
 * Request payload for updating an existing facility space.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateFacilitySpaceRequest {
  facility_id?: number;
  name?: string;
  type?: FacilitySpaceType;
  floor?: string | null;
  building?: string | null;
  is_active?: boolean;
}

/**
 * Query parameters for filtering facility space list.
 * Used in GET /facilities/spaces endpoint.
 */
export interface FacilitySpaceFilters {
  facility_id?: number;
  type?: FacilitySpaceType;
  is_active?: boolean;
  active_only?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

/**
 * Pagination metadata returned with space lists.
 */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
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
  error?: string; // Debug error message (only in development)
}

/**
 * Response for facility space list endpoint (GET /facilities/spaces).
 */
export type GetFacilitySpacesResponse =
  ApiSuccessResponse<FacilitySpace[]> & {
    meta?: PaginationMeta;
  };

/**
 * Response for single facility space operations (GET, POST, PATCH).
 */
export type FacilitySpaceResponse = ApiSuccessResponse<FacilitySpace>;

/**
 * Response for delete operation (DELETE /facilities/spaces/{space}).
 */
export type DeleteFacilitySpaceResponse = ApiSuccessResponse<null>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for space ID parameter in API calls.
 */
export type SpaceId = number;

/**
 * Type for facility ID parameter in filtered queries.
 */
export type FacilityId = number;

/**
 * Union type of all possible API responses.
 * Useful for comprehensive error handling.
 */
export type FacilitySpaceApiResponse =
  | GetFacilitySpacesResponse
  | FacilitySpaceResponse
  | DeleteFacilitySpaceResponse;

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
 * Parameters for update mutation.
 * Combines ID with request payload.
 */
export interface UpdateFacilitySpaceParams {
  id: SpaceId;
  data: UpdateFacilitySpaceRequest;
}

/**
 * Parameters for delete mutation.
 */
export interface DeleteFacilitySpaceParams {
  id: SpaceId;
}