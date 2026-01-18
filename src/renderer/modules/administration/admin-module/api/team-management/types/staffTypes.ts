/**
 * ============================================================================
 * STAFF TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for staff-related
 * operations in the healthcare facility management system.
 * 
 * @module staffTypes
 * @description Comprehensive type definitions for staff management, including
 * request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Staff employment status enum.
 */
export enum EmploymentStatus {
  EMPLOYED = 'employed',
  SUSPENDED = 'suspended',
  UNEMPLOYED = 'unemployed',
  TERMINATED = 'terminated',
  RETIRED = 'retired',
  CREDENTIALING_PENDING = 'credentialing_pending',
}

/**
 * Staff employment type enum.
 */
export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  LOCUM_TENENS = 'locum_tenens',
  VOLUNTEER = 'volunteer',
}

/**
 * Global role level enum for staff hierarchy.
 */
export enum GlobalRoleLevel {
  SUPER_ADMIN = 'super_admin',
  FACILITY_ADMIN = 'facility_admin',
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

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Default schedule structure for staff availability.
 */
export type DefaultSchedule = Record<string, unknown>;

/**
 * Clinical privileges structure.
 */
export type ClinicalPrivileges = string[];

/**
 * Prescribing authority structure.
 */
export type PrescribingAuthority = string[];

/**
 * Quality metrics structure.
 */
export type QualityMetrics = Record<string, unknown>;

/**
 * System permissions structure.
 */
export type SystemPermissions = Record<string, unknown>;

/**
 * Staff metadata structure.
 */
export type StaffMetadata = Record<string, unknown>;

/**
 * Simplified user reference for staff.
 */
export interface UserReference {
  id: number;
  uuid: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

/* -------------------------------------------------------------------------- */
/*                            CORE STAFF TYPE                                 */
/* -------------------------------------------------------------------------- */

/**
 * Complete staff entity as returned by the API.
 */
export interface Staff {
  // Primary identifiers
  id: number;
  staff_uuid: string;
  user_id: number;
  
  // Professional identification
  employee_id: string;
  professional_title: string | null;
  license_issuing_state: string | null;
  license_issuing_country: string;
  license_expiry_date: string | null;
  license_status: 'expired' | 'valid' | 'not_provided';
  
  // Specialization
  specialization_codes: string[] | null;
  board_certifications: string[] | null;
  additional_certifications: string[] | null;
  npi_number: string | null;
  dea_expiry_date: string | null;
  dea_status: 'expired' | 'valid' | 'not_provided';
  
  // Employment
  employment_status: EmploymentStatus;
  employment_type: EmploymentType;
  hire_date: string | null;
  termination_date: string | null;
  termination_reason: string | null;
  
  // Clinical privileges
  clinical_privileges: ClinicalPrivileges | null;
  prescribing_authority: PrescribingAuthority | null;
  can_supervise_trainees: boolean;
  can_order_controlled_substances: boolean;
  can_sign_death_certificates: boolean;
  
  // Role & hierarchy
  global_role_level: GlobalRoleLevel;
  reports_to_staff_id: number | null;
  
  // Availability
  default_schedule: DefaultSchedule | null;
  max_concurrent_patients: number;
  average_appointment_duration_minutes: number;
  accepts_new_patients: boolean;
  
  // Performance
  patient_satisfaction_score: number | null;
  total_patients_treated: number;
  quality_metrics: QualityMetrics | null;
  last_peer_review_date: string | null;
  last_competency_assessment_date: string | null;
  
  // Compliance
  background_check_completed: boolean;
  background_check_date: string | null;
  drug_screening_completed: boolean;
  drug_screening_date: string | null;
  immunization_records: Record<string, unknown> | null;
  tb_test_records: Record<string, unknown> | null;
  hipaa_training_completed: boolean;
  hipaa_training_date: string | null;
  hipaa_training_expiry: string | null;
  hipaa_status: 'expired' | 'valid' | 'not_completed';
  
  // System access
  system_permissions: SystemPermissions | null;
  accessible_facility_ids: number[] | null;
  accessible_department_ids: number[] | null;
  
  // Audit
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata: StaffMetadata | null;
  
  // Relationships
  user?: UserReference;
  supervisor?: Staff;
  subordinates?: Staff[];
  
  // Computed properties
  is_active: boolean;
  can_prescribe: boolean;
  has_expired_license: boolean;
  has_expired_dea: boolean;
  requires_credential_renewal: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

export interface CreateStaffByAdminRequest{
  email:string;
  first_name:string;
  last_name:string;
  phone:string;
  employee_id:string;
  global_role_level:string;
  facility_role_code:string;
  module_codes:string[];
  hire_date:string;
  employment_type:string;
  professional_title?:string; 
}
/**
 * Request payload for creating a new staff member.
 */
export interface CreateStaffRequest {
  // Required fields
  user_id: number;
  employee_id: string;
  global_role_level: GlobalRoleLevel;
  
  // Optional professional identification
  professional_title?: string | null;
  license_issuing_state?: string | null;
  license_issuing_country?: string;
  license_expiry_date?: string | null;
  
  // Optional credentials
  specialization_codes?: string[] | null;
  board_certifications?: string[] | null;
  additional_certifications?: string[] | null;
  npi_number?: string | null;
  dea_expiry_date?: string | null;
  
  // Optional employment details
  employment_status?: EmploymentStatus;
  employment_type?: EmploymentType;
  hire_date?: string | null;
  
  // Optional clinical privileges
  clinical_privileges?: ClinicalPrivileges | null;
  prescribing_authority?: PrescribingAuthority | null;
  can_supervise_trainees?: boolean;
  can_order_controlled_substances?: boolean;
  can_sign_death_certificates?: boolean;
  
  // Optional hierarchy
  reports_to_staff_id?: number | null;
  
  // Optional availability
  default_schedule?: DefaultSchedule | null;
  max_concurrent_patients?: number;
  average_appointment_duration_minutes?: number;
  accepts_new_patients?: boolean;
  
  // Optional compliance
  background_check_completed?: boolean;
  background_check_date?: string | null;
  drug_screening_completed?: boolean;
  drug_screening_date?: string | null;
  hipaa_training_completed?: boolean;
  hipaa_training_date?: string | null;
  hipaa_training_expiry?: string | null;
  
  // Optional system access
  accessible_facility_ids?: number[] | null;
  accessible_department_ids?: number[] | null;
  metadata?: StaffMetadata | null;
}

/**
 * Request payload for updating an existing staff member.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateStaffRequest {
  employee_id?: string;
  professional_title?: string | null;
  license_issuing_state?: string | null;
  license_issuing_country?: string;
  license_expiry_date?: string | null;
  specialization_codes?: string[] | null;
  board_certifications?: string[] | null;
  additional_certifications?: string[] | null;
  npi_number?: string | null;
  dea_expiry_date?: string | null;
  employment_status?: EmploymentStatus;
  employment_type?: EmploymentType;
  hire_date?: string | null;
  termination_date?: string | null;
  termination_reason?: string | null;
  clinical_privileges?: ClinicalPrivileges | null;
  prescribing_authority?: PrescribingAuthority | null;
  can_supervise_trainees?: boolean;
  can_order_controlled_substances?: boolean;
  can_sign_death_certificates?: boolean;
  global_role_level?: GlobalRoleLevel;
  reports_to_staff_id?: number | null;
  default_schedule?: DefaultSchedule | null;
  max_concurrent_patients?: number;
  average_appointment_duration_minutes?: number;
  accepts_new_patients?: boolean;
  patient_satisfaction_score?: number | null;
  quality_metrics?: QualityMetrics | null;
  last_peer_review_date?: string | null;
  last_competency_assessment_date?: string | null;
  background_check_completed?: boolean;
  background_check_date?: string | null;
  drug_screening_completed?: boolean;
  drug_screening_date?: string | null;
  hipaa_training_completed?: boolean;
  hipaa_training_date?: string | null;
  hipaa_training_expiry?: string | null;
  accessible_facility_ids?: number[] | null;
  accessible_department_ids?: number[] | null;
  metadata?: StaffMetadata | null;
}

/**
 * Query parameters for filtering staff list.
 */
export interface StaffFilters {
  employment_status?: EmploymentStatus;
  global_role_level?: GlobalRoleLevel;
  facility_id?: number;
  department_id?: number;
  search?: string;
  has_expired_license?: boolean;
  has_expired_dea?: boolean;
  accepts_new_patients?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  limit?:number;
  include_minimal?:boolean;
}

/**
 * Pagination metadata.
 */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Request payload for updating license information.
 */
export interface UpdateLicenseRequest {
  license_number_encrypted: string;
  license_number_hash: string;
  issuing_state: string;
  expiry_date: string;
}

/**
 * Request payload for updating employment status.
 */
export interface UpdateEmploymentStatusRequest {
  status: EmploymentStatus;
  reason?: string | null;
}

/**
 * Request payload for validating staff action.
 */
export interface ValidateStaffActionRequest {
  action: 'prescribe_medication' | 'supervise_others' | 'access_confidential';
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
 * Response for staff list endpoint (GET /staff).
 */
export type GetStaffResponse = ApiSuccessResponse<Staff[]> & {
  meta: PaginationMeta;
};

/**
 * Response for single staff operations (GET, POST, PUT).
 */
export type StaffResponse = ApiSuccessResponse<Staff>;

/**
 * Response for delete operation (DELETE /staff/:id).
 */
export type DeleteStaffResponse = ApiSuccessResponse<null>;

/**
 * Response for expiring credentials endpoint.
 */
export interface ExpiringCredentialsResponse extends ApiSuccessResponse<Staff[]> {
  meta: {
    days_threshold: number;
    count: number;
  };
}

/**
 * Response for validate action endpoint.
 */
export interface ValidateActionResponse extends ApiSuccessResponse<{
  valid: boolean;
  errors: string[];
}> {
  data: {
    valid: boolean;
    errors: string[];
  };
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for staff ID parameter in API calls.
 */
export type StaffId = number;

/**
 * Type for staff UUID parameter in API calls.
 */
export type StaffUUID = string;

/**
 * Union type of all possible staff API responses.
 */
export type StaffApiResponse =
  | GetStaffResponse
  | StaffResponse
  | DeleteStaffResponse
  | ExpiringCredentialsResponse
  | ValidateActionResponse;

/**
 * Type guard to check if response is an error.
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
export interface UpdateStaffParams {
  id: StaffId;
  data: UpdateStaffRequest;
}

/**
 * Parameters for delete mutation.
 */
export interface DeleteStaffParams {
  id: StaffId;
}

/**
 * Parameters for update license mutation.
 */
export interface UpdateLicenseParams {
  id: StaffId;
  data: UpdateLicenseRequest;
}

/**
 * Parameters for update status mutation.
 */
export interface UpdateEmploymentStatusParams {
  id: StaffId;
  data: UpdateEmploymentStatusRequest;
}

/**
 * Parameters for validate action mutation.
 */
export interface ValidateStaffActionParams {
  id: StaffId;
  data: ValidateStaffActionRequest;
}