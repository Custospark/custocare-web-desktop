/**
 * ============================================================================
 * DEPARTMENT TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for department-related
 * operations in the healthcare facility management system.
 * 
 * @module departmentTypes
 * @description Comprehensive type definitions for departments, including
 * request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Available department types in the healthcare facility system.
 * Maps to backend enum values for department classification.
 */
export enum DepartmentType {
  EMERGENCY = 'emergency',
  INTENSIVE_CARE = 'intensive_care',
  SURGERY = 'surgery',
  OUTPATIENT = 'outpatient',
  INPATIENT = 'inpatient',
  RADIOLOGY = 'radiology',
  LABORATORY = 'laboratory',
  PHARMACY = 'pharmacy',
  PHYSICAL_THERAPY = 'physical_therapy',
  CARDIOLOGY = 'cardiology',
  ONCOLOGY = 'oncology',
  PEDIATRICS = 'pediatrics',
  OBSTETRICS = 'obstetrics',
  PSYCHIATRY = 'psychiatry',
  ADMINISTRATION = 'administration',
  SUPPORT_SERVICES = 'support_services',
}

/**
 * Department operational status.
 * Determines whether the department is accepting patients and functioning.
 */
export enum DepartmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TEMPORARILY_CLOSED = 'temporarily_closed',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Operating hours structure for a department.
 * Flexible JSON structure to accommodate various scheduling patterns.
 * 
 * @example
 * {
 *   "monday": { "open": "08:00", "close": "18:00" },
 *   "tuesday": { "open": "08:00", "close": "18:00" },
 *   "saturday": "closed"
 * }
 */
export type OperatingHours = Record<string, unknown>;

/**
 * Metadata structure for storing additional department information.
 * Extensible structure for custom properties and future requirements.
 */
export type DepartmentMetadata = Record<string, unknown>;

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
 * Simplified staff reference for department head.
 */
export interface StaffReference {
  id: number;
  staff_uuid: string;
  employee_id: string;
  professional_title: string;
  global_role_level?: string;
}

/**
 * Simplified department reference for parent/child relationships.
 */
export interface DepartmentReference {
  id: number;
  department_uuid: string;
  department_code: string;
  department_name: string;
  department_type: DepartmentType;
}

/* -------------------------------------------------------------------------- */
/*                            CORE DEPARTMENT TYPE                            */
/* -------------------------------------------------------------------------- */

/**
 * Complete department entity as returned by the API.
 * Includes all fields, computed properties, and optional relationships.
 */
export interface Department {
  // Primary identifiers
  id: number;
  department_uuid: string;
  facility_id: number;

  // Department identification
  department_code: string;
  department_name: string;
  department_type: DepartmentType;
  department_type_label: string;

  // Hierarchy
  parent_department_id: number | null;
  department_head_staff_id: number | null;

  // Capacity & resources
  bed_count: number | null;
  treatment_room_count: number | null;
  max_concurrent_capacity: number | null;

  // Location
  building: string | null;
  floor: string | null;
  wing_section: string | null;

  // Operational
  operating_hours: OperatingHours | null;
  formatted_operating_hours: string | null;
  accepts_walk_ins: boolean;
  requires_appointment: boolean;
  average_wait_time_minutes: number | null;

  // Status
  status: DepartmentStatus;
  status_label: string;

  // Audit timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: DepartmentMetadata | null;

  // Relationships (loaded conditionally)
  facility?: FacilityReference;
  parent_department?: DepartmentReference;
  child_departments?: DepartmentReference[];
  department_head?: StaffReference;

  // Computed attributes
  has_available_capacity: boolean;
  is_active: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new department.
 * All required fields must be provided; optional fields can be omitted.
 */
export interface CreateDepartmentRequest {
  // Required fields
  facility_id: number;
  department_name: string;
  department_type: DepartmentType;

  // Optional identification
  department_code?: string;

  // Optional hierarchy
  parent_department_id?: number | null;
  department_head_staff_id?: number | null;

  // Optional capacity
  bed_count?: number | null;
  treatment_room_count?: number | null;
  max_concurrent_capacity?: number | null;

  // Optional location
  building?: string | null;
  floor?: string | null;
  wing_section?: string | null;

  // Optional operational settings
  operating_hours?: OperatingHours | null;
  accepts_walk_ins?: boolean;
  requires_appointment?: boolean;
  average_wait_time_minutes?: number | null;

  // Optional status
  status?: DepartmentStatus;
  metadata?: DepartmentMetadata | null;
}

/**
 * Request payload for updating an existing department.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateDepartmentRequest {
  facility_id?: number;
  department_code?: string;
  department_name?: string;
  department_type?: DepartmentType;
  parent_department_id?: number | null;
  department_head_staff_id?: number | null;
  bed_count?: number | null;
  treatment_room_count?: number | null;
  max_concurrent_capacity?: number | null;
  building?: string | null;
  floor?: string | null;
  wing_section?: string | null;
  operating_hours?: OperatingHours | null;
  accepts_walk_ins?: boolean;
  requires_appointment?: boolean;
  average_wait_time_minutes?: number | null;
  status?: DepartmentStatus;
  metadata?: DepartmentMetadata | null;
}

/**
 * Query parameters for filtering department list.
 * Used in GET /departments endpoint.
 */
export interface DepartmentFilters {
  facility_id?: number;
  department_type?: DepartmentType;
  status?: DepartmentStatus;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  with_children?: boolean;
}

/**
 * Pagination metadata returned with department lists.
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
 * Response for department list endpoint (GET /departments).
 */
export type GetDepartmentsResponse =
  ApiSuccessResponse<Department[]> & {
    meta: PaginationMeta;
  };


/**
 * Response for single department operations (GET, POST, PUT, PATCH).
 */
export type DepartmentResponse = ApiSuccessResponse<Department>;

/**
 * Response for delete operation (DELETE /departments/:uuid).
 */
export type DeleteDepartmentResponse =ApiSuccessResponse<null>;

/**
 * Response for restore operation (POST /departments/:uuid/restore).
 */
export type RestoreDepartmentResponse = ApiSuccessResponse<Department>;

/**
 * Response for facility-filtered departments (GET /departments/facility/:facilityId).
 */
export interface GetDepartmentsByFacilityResponse extends ApiSuccessResponse<Department[]> {
  meta: {
    facility_id: number;
    count: number;
  };
}

/**
 * Response for type-filtered departments (GET /departments/type/:type).
 */
export interface GetDepartmentsByTypeResponse extends ApiSuccessResponse<Department[]> {
  meta: {
    department_type: DepartmentType;
    count: number;
  };
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for department UUID parameter in API calls.
 */
export type DepartmentUUID = string;

/**
 * Type for facility ID parameter in filtered queries.
 */
export type FacilityId = number;

/**
 * Union type of all possible API responses.
 * Useful for comprehensive error handling.
 */
export type DepartmentApiResponse =
  | GetDepartmentsResponse
  | DepartmentResponse
  | DeleteDepartmentResponse
  | RestoreDepartmentResponse
  | GetDepartmentsByFacilityResponse
  | GetDepartmentsByTypeResponse;

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
 * Combines UUID with request payload.
 */
export interface UpdateDepartmentParams {
  uuid: DepartmentUUID;
  data: UpdateDepartmentRequest;
}

/**
 * Parameters for restore mutation.
 */
export interface RestoreDepartmentParams {
  uuid: DepartmentUUID;
}

/**
 * Parameters for delete mutation.
 */
export interface DeleteDepartmentParams {
  uuid: DepartmentUUID;
}