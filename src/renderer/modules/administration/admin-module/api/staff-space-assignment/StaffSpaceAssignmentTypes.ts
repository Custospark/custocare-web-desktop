/**
 * ============================================================================
 * STAFF SPACE ASSIGNMENT TYPE DEFINITIONS
 * ============================================================================
 *
 * This file contains all TypeScript type declarations for staff space assignment
 * operations in the healthcare facility management system.
 *
 * @module staffSpaceAssignmentTypes
 * @description Comprehensive type definitions for staff space assignments,
 * including request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Staff space assignment status.
 * Determines the current state of a space assignment.
 */
export enum StaffSpaceAssignmentStatus {
  ACTIVE = 'active',
  RELEASED = 'released',
}

/**
 * Space assignment operation type.
 * Used to differentiate between self-service and admin operations.
 */
export enum AssignmentOperationType {
  SELF_ASSIGN = 'self_assign',
  ADMIN_ASSIGN = 'admin_assign',
  SELF_RELEASE = 'self_release',
  ADMIN_RELEASE = 'admin_release',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Simplified user reference for assignment operations.
 */
export interface UserReference {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

/**
 * Simplified staff reference for assignments.
 */
export interface StaffReference {
  staff_id: number;
  staff_uuid: string;
  employee_id: string;
  user: UserReference | null;
  role_code: string | null;
}

/**
 * Simplified space reference for assignments.
 * Based on FacilitySpaceTypes.ts for consistency.
 */
export interface SpaceReference {
  id: number;
  name: string;
  type: string;
  floor: string | null;
  building: string | null;
  is_active: boolean;
  facility_id: number;
}

/**
 * Staff member data for admin dropdown selection.
 */
export interface StaffForAssignment {
  staff_id: number;
  staff_uuid: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role_code: string;
  assignment_status: string;
}

/* -------------------------------------------------------------------------- */
/*                         CORE ASSIGNMENT TYPE                               */
/* -------------------------------------------------------------------------- */

/**
 * Complete staff space assignment entity as returned by the API.
 */
export interface StaffSpaceAssignment {
  // Primary identifiers
  id: number;
  facility_id: number;

  // Relationships
  space_id: number;
  staff_id: number;
  assigned_by_user_id: number | null;
  released_by_user_id: number | null;

  // Assignment details
  assigned_at: string | null;
  released_at: string | null;
  note: string | null;
  status: StaffSpaceAssignmentStatus;

  // Audit timestamps
  created_at: string;
  updated_at: string;

  // Relationships (loaded conditionally)
  space?: SpaceReference;
  staff?: StaffReference;
  assigned_by_user?: UserReference;
  released_by_user?: UserReference;
}

/**
 * Space with current assignment for occupancy tracking.
 */
export interface SpaceWithAssignment {
  id: number;
  facility_id: number;
  name: string;
  type: string;
  floor: string | null;
  building: string | null;
  is_active: boolean;
  current_assignment: StaffSpaceAssignment | null;
}

/**
 * Available space for assignment.
 */
export interface AvailableSpace {
  id: number;
  facility_id: number;
  name: string;
  type: string;
  floor: string | null;
  building: string | null;
  is_active: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for assigning a space (both self and admin).
 */
export interface AssignSpaceRequest {
  // Required fields
  facility_id: number;
  space_id: number;

  // Optional fields
  staff_id?: number; // Required for admin assignment
  note?: string;
}

/**
 * Request payload for releasing a space (self).
 */
export interface ReleaseSpaceRequest {
  facility_id: number;
}

/**
 * Request payload for releasing a space by admin.
 */
export interface ReleaseSpaceByAdminRequest {
  facility_id: number;
  staff_id: number;
}

/**
 * Query parameters for getting current space.
 */
export interface CurrentSpaceQuery {
  facility_id: number;
}

/**
 * Query parameters for occupancy list.
 */
export interface OccupancyFilters {
  facility_id: number;
  per_page?: number;
  space_type?: string;
  floor?: string;
  building?: string;
  search?: string;
  page?: number;
}

/**
 * Query parameters for available spaces.
 */
export interface AvailableSpacesFilters {
  facility_id: number;
  per_page?: number;
  space_type?: string;
  floor?: string;
  building?: string;
  search?: string;
  page?: number;
}

/**
 * Query parameters for staff list (admin dropdown).
 */
export interface StaffForAssignmentFilters {
  per_page?: number;
  search?: string;
  page?: number;
}

/**
 * Pagination metadata returned with lists.
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
 * Response for current space endpoint.
 */
export type CurrentSpaceResponse = ApiSuccessResponse<StaffSpaceAssignment | null> & {
  meta: {
    facility_id: number;
    staff_id: number;
  };
};

/**
 * Response for assign/release operations.
 */
export type AssignmentResponse = ApiSuccessResponse<StaffSpaceAssignment> & {
  meta: {
    facility_id: number;
    staff_id: number;
    space_id?: number;
  };
};

/**
 * Response for occupancy list endpoint.
 */
export type OccupancyResponse = ApiSuccessResponse<SpaceWithAssignment[]> & {
  meta: PaginationMeta & {
    facility_id: number;
    filters_applied: Record<string, unknown>;
    occupied_spaces: number;
    available_spaces: number;
  };
};

/**
 * Response for available spaces endpoint.
 */
export type AvailableSpacesResponse = ApiSuccessResponse<AvailableSpace[]> & {
  meta: PaginationMeta & {
    facility_id: number;
  };
};

/**
 * Response for staff list endpoint (admin dropdown).
 */
export type StaffForAssignmentResponse = ApiSuccessResponse<StaffForAssignment[]> & {
  meta: PaginationMeta & {
    facility_id: number;
    search_applied: boolean;
  };
};

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for facility ID parameter.
 */
export type FacilityId = number;

/**
 * Type for staff ID parameter.
 */
export type StaffId = number;

/**
 * Type for space ID parameter.
 */
export type SpaceId = number;

/**
 * Type for assignment ID parameter.
 */
export type AssignmentId = number;

/**
 * Union type of all possible API responses.
 */
export type StaffSpaceAssignmentApiResponse =
  | CurrentSpaceResponse
  | AssignmentResponse
  | OccupancyResponse
  | AvailableSpacesResponse
  | StaffForAssignmentResponse;

/* -------------------------------------------------------------------------- */
/*                              TYPE GUARDS                                   */
/* -------------------------------------------------------------------------- */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;


/**
 * Type guard to check if response is an error.
 */
export function isApiErrorResponse(
  response: ApiSuccessResponse<unknown> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Type guard to check if response is a success.
 */
export function isApiSuccessResponse<T>(
  response: ApiSuccessResponse<T> | ApiErrorResponse
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check whether an unknown value matches StaffSpaceAssignment.
 */
export function isStaffSpaceAssignment(value: unknown): value is StaffSpaceAssignment {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'number' &&
    typeof value.facility_id === 'number' &&
    typeof value.space_id === 'number' &&
    typeof value.staff_id === 'number' &&
    (value.assigned_by_user_id === null || typeof value.assigned_by_user_id === 'number') &&
    (value.released_by_user_id === null || typeof value.released_by_user_id === 'number') &&
    (value.assigned_at === null || typeof value.assigned_at === 'string') &&
    (value.released_at === null || typeof value.released_at === 'string') &&
    (value.note === null || typeof value.note === 'string') &&
    typeof value.status === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  );
}

/**
 * Type guard for SpaceWithAssignment.
 */
export function isSpaceWithAssignment(value: unknown): value is SpaceWithAssignment {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'number' &&
    typeof value.facility_id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    (value.floor === null || typeof value.floor === 'string') &&
    (value.building === null || typeof value.building === 'string') &&
    typeof value.is_active === 'boolean' &&
    (value.current_assignment === null || isStaffSpaceAssignment(value.current_assignment))
  );
}

/**
 * Type guard for AvailableSpace.
 */
export function isAvailableSpace(value: unknown): value is AvailableSpace {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === 'number' &&
    typeof value.facility_id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    (value.floor === null || typeof value.floor === 'string') &&
    (value.building === null || typeof value.building === 'string') &&
    typeof value.is_active === 'boolean'
  );
}

/**
 * Type guard for StaffForAssignment.
 */
export function isStaffForAssignment(value: unknown): value is StaffForAssignment {
  if (!isRecord(value)) return false;

  return (
    typeof value.staff_id === 'number' &&
    typeof value.staff_uuid === 'string' &&
    typeof value.employee_id === 'string' &&
    typeof value.first_name === 'string' &&
    typeof value.last_name === 'string' &&
    typeof value.full_name === 'string' &&
    typeof value.role_code === 'string' &&
    typeof value.assignment_status === 'string'
  );
}

/* -------------------------------------------------------------------------- */
/*                        MUTATION / PARAMETER TYPES                          */
/* -------------------------------------------------------------------------- */

/**
 * Options for mutation callbacks.
 */
export interface MutationCallbacks<TData, TError = ApiErrorResponse> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Parameters for assign space mutation.
 */
export interface AssignSpaceParams {
  data: AssignSpaceRequest;
  isAdmin?: boolean;
}

/**
 * Parameters for release space mutation.
 */
export interface ReleaseSpaceParams {
  facilityId: number;
  staffId?: number; // For admin release
  isAdmin?: boolean;
}