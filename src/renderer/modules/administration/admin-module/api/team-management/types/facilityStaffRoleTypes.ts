/**
 * ============================================================================
 * FACILITY STAFF ROLE TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for facility staff role
 * operations in the healthcare facility management system.
 * 
 * @module facilityStaffRoleTypes
 * @description Comprehensive type definitions for staff role assignments,
 * including request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                              CORE ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Staff assignment status at facility
 */
export type AssignmentStatus = 'active' | 'on_leave' | 'suspended' | 'terminated';

/**
 * Staff shift types at facility
 */
export type ShiftType = 'day' | 'night' | 'rotating' | 'on_call' | 'flexible';

/* -------------------------------------------------------------------------- */
/*                          CORE STAFF ROLE TYPE                              */
/* -------------------------------------------------------------------------- */

/**
 * Complete facility staff role entity as returned by the API.
 * Represents a staff member's role assignment at a specific facility.
 */
export interface FacilityStaffRole {
  // Primary identifiers
  id: number;
  assignment_uuid: string;

  // Foreign keys
  facility_id: number;
  staff_id: number;

  // Role definition
  role_code: string;
  department_ids: number[] | null;
  is_primary_facility: boolean;

  // Employment details (NEW)
  employee_number:string;
  employment_status:
    | 'employed'
    | 'suspended'
    | 'unemployed'
    | 'terminated'
    | 'retired'
    | 'credentialing_pending';

  employment_type:
    | 'full_time'
    | 'part_time'
    | 'contract'
    | 'locum_tenens'
    | 'volunteer';

  hire_date: string | null;
  termination_date: string | null;
  termination_reason: string | null;

  // Privileges at this facility
  module_codes: string[] | null;
  privileges_bitmask: string[] | null;
  accessible_patient_populations: string[] | null;
  prescribing_authority_at_facility: string[] | null;

  // Schedule
  shift_schedule: Record<string, string> | null;
  shift_type: ShiftType | null;
  hours_per_week: number | null;

  // Effective period
  effective_from: string;
  effective_to: string | null;
  assignment_status: AssignmentStatus;

  // Credentialing at facility
  credentialing_completed_at: string | null;
  credentialed_by_staff_id: number | null;
  privileging_approved_at: string | null;
  next_reappointment_date: string | null;
  staff_invitation_id: number | null;

  // Performance
  patients_treated_at_facility: number;
  facility_satisfaction_score: number | null;

  // Audit
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_staff_id: number | null;
  metadata: Record<string, string> | null;

  // Relationships (if expanded)
  facility?: {
    id: number;
    name: string;
    code: string;
  };

  staff?: {
    id: number;
    user?: {
      profile?: {
        full_name: string;
        first_name?: string;
        last_name?: string;
      };
      contact?: {
        email?: string;
        phone?: string;
      };
    };
  };
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for updating a facility staff role.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateFacilityStaffRoleRequest {
  // Optional fields for update
  facility_id?: number;
  staff_id?: number;
  employment_type:string;
  role_code?: string;
  employment_status:string;
  department_ids?: number[] | null;
  is_primary_facility?: boolean;
  module_codes?: string[] | null;
  privileges_bitmask?: string[] | null;
  accessible_patient_populations?: string[] | null;
  prescribing_authority_at_facility?: string[] | null;
  shift_schedule?: Record<string, string> | null;
  shift_type?: ShiftType | null;
  hours_per_week?: number | null;
  effective_from?: string;
  effective_to?: string | null;
  assignment_status?: AssignmentStatus;
  credentialing_completed_at?: string | null;
  credentialed_by_staff_id?: number | null;
  privileging_approved_at?: string | null;
  next_reappointment_date?: string | null;
  staff_invitation_id?: number | null;
  patients_treated_at_facility?: number;
  facility_satisfaction_score?: number | null;
  metadata?: Record<string, string> | null;
}

/**
 * Query parameters for filtering facility staff role list.
 */
export interface FacilityStaffRoleFilters {
  facility_id?: number;
  staff_id?: number;
  role_code?: string;
  assignment_status?: AssignmentStatus;
  is_primary_facility?: boolean;
  effective_from?: string;
  effective_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include_inactive?: boolean;
  include?: string[];
}

/**
 * Parameters for getting a single facility staff role.
 */
export interface GetFacilityStaffRoleParams {
  id: number;
  include?: string[];
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
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}

/**
 * Response for facility staff role list endpoint.
 */
export type GetFacilityStaffRolesResponse = ApiSuccessResponse<FacilityStaffRole[]>;

/**
 * Response for single facility staff role operations.
 */
export type FacilityStaffRoleResponse = ApiSuccessResponse<FacilityStaffRole>;

/**
 * Response for update facility staff role operation.
 */
export type UpdateFacilityStaffRoleResponse = ApiSuccessResponse<FacilityStaffRole>;

/**
 * Response for create facility staff role operation.
 */
export type CreateFacilityStaffRoleResponse = ApiSuccessResponse<FacilityStaffRole>;

/**
 * Response for delete/deactivate facility staff role operation.
 */
export type DeleteFacilityStaffRoleResponse = ApiSuccessResponse<{ message: string }>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for facility staff role ID parameter in API calls.
 */
export type FacilityStaffRoleId = number;

/**
 * Union type of all possible facility staff role API responses.
 */
export type FacilityStaffRoleApiResponse =
  | GetFacilityStaffRolesResponse
  | FacilityStaffRoleResponse
  | UpdateFacilityStaffRoleResponse
  | CreateFacilityStaffRoleResponse
  | DeleteFacilityStaffRoleResponse;

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
 * Provides consistent typing for onSuccess and onError handlers.
 */
export interface MutationCallbacks<TData, TError = ApiErrorResponse> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Parameters for update mutation.
 */
export interface UpdateFacilityStaffRoleParams {
  id: FacilityStaffRoleId;
  data: UpdateFacilityStaffRoleRequest;
}

/**
 * Parameters for delete/deactivate mutation.
 */
export interface DeleteFacilityStaffRoleParams {
  id: FacilityStaffRoleId;
  deactivation_reason?: string;
}

/**
 * Parameters for create mutation.
 */
export interface CreateFacilityStaffRoleParams {
  data: UpdateFacilityStaffRoleRequest;
}

/* -------------------------------------------------------------------------- */
/*                          VALIDATION TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Validation error structure from API.
 */
export interface ValidationErrors {
  [field: string]: string[];
}

/**
 * API error with validation details.
 */
export interface ApiValidationError {
  response: {
    data: ApiErrorResponse;
  };
}

/* -------------------------------------------------------------------------- */
/*                          DEPARTMENT TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Department assignment in facility staff role.
 */
export interface DepartmentAssignment {
  department_id: number;
  department_name: string;
  department_code: string;
}

/**
 * Expanded department information for display.
 */
export interface DepartmentDetail {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          MODULE ACCESS TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * Module access details for staff role.
 */
export interface ModuleAccessDetail {
  module_code: string;
  module_name: string;
  is_default: boolean;
  granted_at: string | null;
}

/**
 * Staff role with expanded relationships.
 */
export interface FacilityStaffRoleExpanded extends FacilityStaffRole {
  departments?: DepartmentDetail[];
  modules?: ModuleAccessDetail[];
  facility_name?: string;
  staff_name?: string;
}