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
export type GetFacilitySpacesResponse = ApiSuccessResponse<FacilitySpace[]> & {
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

/* -------------------------------------------------------------------------- */
/*                              TYPE GUARDS                                   */
/* -------------------------------------------------------------------------- */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasOwn = <K extends PropertyKey>(
  obj: object,
  key: K
): obj is Record<K, unknown> => Object.prototype.hasOwnProperty.call(obj, key);

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
 * Type guard to check whether an unknown value matches ApiErrorResponse.
 * Useful when catching thrown errors or dealing with untyped API clients.
 */
export function isApiErrorResponseUnknown(value: unknown): value is ApiErrorResponse {
  if (!isRecord(value)) return false;
  if (!hasOwn(value, 'success') || value.success !== false) return false;
  if (!hasOwn(value, 'message') || typeof value.message !== 'string') return false;

  if (hasOwn(value, 'errors') && value.errors !== undefined) {
    const errors = value.errors;
    if (!isRecord(errors)) return false;

    for (const key of Object.keys(errors)) {
      const entry = errors[key];
      if (!Array.isArray(entry) || !entry.every(v => typeof v === 'string')) return false;
    }
  }

  if (hasOwn(value, 'error') && value.error !== undefined && typeof value.error !== 'string') {
    return false;
  }

  return true;
}

/**
 * Type guard to check whether an unknown value matches ApiSuccessResponse<T>.
 * (Lightweight shape validation; does not deep-validate `data`.)
 */
export function isApiSuccessResponseUnknown<TData = unknown>(
  value: unknown
): value is ApiSuccessResponse<TData> {
  if (!isRecord(value)) return false;
  if (!hasOwn(value, 'success') || value.success !== true) return false;
  if (!hasOwn(value, 'message') || typeof value.message !== 'string') return false;
  if (!hasOwn(value, 'data')) return false;
  return true;
}

/**
 * Type guard: checks if an unknown value is a FacilitySpaceType.
 * Useful for safely handling values from query params / form inputs.
 */
export function isFacilitySpaceType(value: unknown): value is FacilitySpaceType {
  return typeof value === 'string' && (Object.values(FacilitySpaceType) as string[]).includes(value);
}

/**
 * Type guard: checks if an unknown value is a SpaceStatus.
 */
export function isSpaceStatus(value: unknown): value is SpaceStatus {
  return typeof value === 'string' && (Object.values(SpaceStatus) as string[]).includes(value);
}

/**
 * Type guard: validates FacilitySpace shape at runtime (pragmatic checks).
 * This helps remove `any` usage in UI code by enabling narrowing from unknown.
 */
export function isFacilitySpace(value: unknown): value is FacilitySpace {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'number' &&
    typeof value.facility_id === 'number' &&
    typeof value.name === 'string' &&
    isFacilitySpaceType(value.type) &&
    typeof value.type_label === 'string' &&
    (value.floor === null || typeof value.floor === 'string') &&
    (value.building === null || typeof value.building === 'string') &&
    typeof value.is_active === 'boolean' &&
    isSpaceStatus(value.status) &&
    typeof value.status_label === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string' &&
    (value.full_location === null || typeof value.full_location === 'string') &&
    typeof value.is_available === 'boolean'
  );
}

/**
 * Type guard for GetFacilitySpacesResponse at runtime.
 * Ensures `data` is an array of FacilitySpace.
 */
export function isGetFacilitySpacesResponse(value: unknown): value is GetFacilitySpacesResponse {
  if (!isApiSuccessResponseUnknown<unknown>(value)) return false;

  const data = value.data;
  if (!Array.isArray(data)) return false;
  if (!data.every(isFacilitySpace)) return false;

  // Optional meta: if present, lightly validate pagination keys
  if (value.meta !== undefined) {
    const meta = value.meta as unknown;
    if (!isRecord(meta)) return false;

    // If it's pagination meta, these should be numbers. If backend sometimes uses meta as
    // other shape, we don't hard-fail unless keys exist with invalid types.
    const numKeys: Array<keyof PaginationMeta> = ['current_page', 'last_page', 'per_page', 'total'];
    for (const k of numKeys) {
      if (hasOwn(meta, k) && meta[k] !== undefined && typeof meta[k] !== 'number') return false;
    }
  }

  return true;
}

/* -------------------------------------------------------------------------- */
/*                        MUTATION / PARAMETER TYPES                          */
/* -------------------------------------------------------------------------- */

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
