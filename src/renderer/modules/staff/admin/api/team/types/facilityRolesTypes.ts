/**
 * ============================================================================
 * FACILITY ROLES TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for facility role-related
 * operations in the healthcare facility management system.
 * 
 * @module facilityRolesTypes
 * @description Comprehensive type definitions for facility roles, including
 * request/response types and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                          CORE FACILITY ROLE TYPE                           */
/* -------------------------------------------------------------------------- */

/**
 * Complete facility role entity as returned by the API.
 * Facility roles define staff permissions and access levels within facilities.
 */
export interface FacilityRole {
  // Primary identifiers
  id: number;
  code: string;
  
  // Role details
  name: string;
  description: string | null;
  
  // Classification
  is_system_role: boolean;
  facility_id: number | null;
  
  // Audit timestamps
  created_at: string;
  updated_at: string;
  
  // Optional relationships
  facility?: {
    id: number;
    facility_uuid: string;
    facility_name: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new facility role.
 */
export interface CreateFacilityRoleRequest {
  // Required fields
  name: string;
  
  // Optional fields
  code?: string;
  description?: string | null;
  is_system_role?: boolean;
  facility_id?: number | null;
}

/**
 * Request payload for updating an existing facility role.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateFacilityRoleRequest {
  name?: string;
  description?: string | null;
  is_system_role?: boolean;
}

/**
 * Query parameters for filtering facility role list.
 */
export interface FacilityRoleFilters {
  is_system_role?: boolean;
  facility_id?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard success response structure.
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Standard error response structure.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}

/**
 * Response for facility role list endpoint (GET /roles).
 */
export type GetFacilityRolesResponse = ApiSuccessResponse<FacilityRole[]>;

/**
 * Response for single facility role operations (GET, POST, PUT).
 */
export type FacilityRoleResponse = ApiSuccessResponse<FacilityRole>;

/**
 * Response for delete operation (DELETE /roles/:id).
 */
export type DeleteFacilityRoleResponse = ApiSuccessResponse<null>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for facility role ID parameter in API calls.
 */
export type FacilityRoleId = number;

/**
 * Type for facility role code parameter in API calls.
 */
export type FacilityRoleCode = string;

/**
 * Union type of all possible facility role API responses.
 */
export type FacilityRoleApiResponse =
  | GetFacilityRolesResponse
  | FacilityRoleResponse
  | DeleteFacilityRoleResponse;

/**
 * Type guard to check if response is an error.
 * 
 * @param response - API response to check
 * @returns True if response is an error response
 */
export function isApiErrorResponse(
  response: ApiSuccessResponse<unknown> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Options for mutation callbacks.
 */
export interface MutationCallbacks<TData, TError = ApiErrorResponse> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Parameters for update mutation.
 */
export interface UpdateFacilityRoleParams {
  id: FacilityRoleId;
  data: UpdateFacilityRoleRequest;
}

/**
 * Parameters for delete mutation.
 */
export interface DeleteFacilityRoleParams {
  id: FacilityRoleId;
}

/* -------------------------------------------------------------------------- */
/*                        COMMON FACILITY ROLE CODES                          */
/* -------------------------------------------------------------------------- */

/**
 * Standard system-defined facility role codes.
 * Used for type-safe role code references.
 */
export enum SystemFacilityRoleCodes {
  FACILITY_ADMINISTRATOR = 'facility_administrator',
  DEPARTMENT_HEAD = 'department_head',
  ATTENDING_PHYSICIAN = 'attending_physician',
  FELLOW = 'fellow',
  RESIDENT = 'resident',
  NURSE_PRACTITIONER = 'nurse_practitioner',
  PHYSICIAN_ASSISTANT = 'physician_assistant',
  REGISTERED_NURSE = 'registered_nurse',
  LICENSED_PRACTICAL_NURSE = 'licensed_practical_nurse',
  PHARMACIST = 'pharmacist',
  THERAPIST = 'therapist',
  TECHNICIAN = 'technician',
  SUPPORT_STAFF = 'support_staff',
}

/**
 * Facility role with associated module access.
 * Used when displaying role permissions.
 */
export interface FacilityRoleWithModules extends FacilityRole {
  modules: {
    code: string;
    name: string;
    has_access: boolean;
  }[];
}