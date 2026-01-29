/**
 * ============================================================================
 * STAFF INVITATION TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for staff invitation-related
 * operations in the healthcare facility management system.
 * 
 * @module staffInvitationTypes
 * @description Comprehensive type definitions for managing staff invitations,
 * including request/response types, enums, and utility types for type-safe API interactions.
 */

import type { Module } from './moduleTypes';
import type { FacilityRole } from './facilityRolesTypes';
import type { Staff,UserMetaData } from './staffTypes';

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Staff invitation status enum.
 */
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Invitation metadata structure for storing additional information.
 */
export type InvitationMetadata = Record<string, unknown>;

/**
 * Simplified facility reference for nested responses.
 */
export interface FacilityReference {
  id: number;
  facility_uuid: string;
  facility_code: string;
  facility_name: string;
}

/**
 * Simplified department reference for nested responses.
 */
export interface DepartmentReference {
  id: number;
  department_uuid: string;
  department_code: string;
  department_name: string;
}

/**
 * Simplified staff reference for nested responses.
 */
export interface StaffReference {
  id: number;
  staff_uuid: string;
  employee_id: string;
  professional_title: string | null;
  global_role_level: string;
}

/* -------------------------------------------------------------------------- */
/*                      CORE STAFF INVITATION TYPE                            */
/* -------------------------------------------------------------------------- */

/**
 * Complete staff invitation entity as returned by the API.
 */
export interface StaffInvitation {
  // Primary identifiers
  id: number;
  invitation_uuid: string;
  
  // Assignment references
  staff_id: number;
  facility_id: number;
  department_id: number | null;
  role_code: string;
  module_code: string[] | null;
  
  // Status
  status: InvitationStatus;
  
  // Timing
  sent_at: string | null;
  reminder_sent_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
  
  // Audit
  invited_by_staff_id: number | null;
  metadata: InvitationMetadata | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Relationships (loaded conditionally)
  staff?: StaffData;
  facility?: FacilityReference;
  department?: DepartmentReference;
  role?: FacilityRole;
  modules?: Module[];
  invited_by?: StaffReference;
  
  // Computed properties
  is_expired: boolean;
  is_pending: boolean;
  can_be_accepted: boolean;
  can_be_declined: boolean;
  can_be_resent: boolean;
  days_until_expiry: number | null;
  can_be_cancelled: boolean;
  can_be_deleted: boolean;
}
export type StaffData = {
  id: number;
  staff_uuid: string;
  user_id: number;
  employee_id: string | null;

  professional_title: string | null;

  license_issuing_state: string | null;
  license_issuing_country: string | null;
  license_expiry_date: string | null; 
  license_status: "expired" | "valid" | "not_provided";

  specialization_codes: string[] | null;
  board_certifications: string[] | null;
  additional_certifications: string[] | null;

  npi_number: string | null;

  dea_expiry_date: string | null;
  dea_status: "expired" | "valid" | "not_provided";

  employment_status: string; 
  employment_type: string | null;

  hire_date: string | null;
  termination_date: string | null;
  termination_reason: string | null;

  clinical_privileges: unknown | null;
  prescribing_authority: unknown | null;

  can_supervise_trainees: boolean;
  can_order_controlled_substances: boolean;
  can_sign_death_certificates: boolean;

  global_role_level: string;

  reports_to_staff_id: number | null;

  default_schedule: unknown | null;

  max_concurrent_patients: number | null;
  average_appointment_duration_minutes: number | null;

  accepts_new_patients: boolean;

  patient_satisfaction_score: number | null;
  total_patients_treated: number;

  quality_metrics: unknown | null;

  last_peer_review_date: string | null;
  last_competency_assessment_date: string | null;

  background_check_completed: boolean;
  background_check_date: string | null;

  drug_screening_completed: boolean;
  drug_screening_date: string | null;

  immunization_records: unknown | null;
  tb_test_records: unknown | null;

  hipaa_training_completed: boolean;
  hipaa_training_date: string | null;
  hipaa_training_expiry: string | null;
  hipaa_status: "expired" | "valid" | "not_completed";

  system_permissions: unknown | null;
  accessible_facility_ids: number[] | null;
  accessible_department_ids: number[] | null;

  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  deleted_at: string | null;

  // convenience fields you added in StaffResource
  global_user_uuid: string | null;
  staff_name: string | null;
  user_title: string | null;
  user_gender: "male" | "female" | "other" | null;
  user_identity_state: "pending" | "verified" | "suspended" | "archived" | string;

  user:UserMetaData;

  // computed flags
  is_active: boolean;
  can_prescribe: boolean;
  has_expired_license: boolean;
  has_expired_dea: boolean;
  requires_credential_renewal: boolean;
};


/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new staff invitation.
 */
export interface CreateStaffInvitationRequest {
  // Required fields
  staff_id: number;
  facility_id: number;
  role_code: string;
  
  // Optional fields
  department_id?: number | null;
  module_code?: string[] | null;
  expires_at?: string | null;
  metadata?: InvitationMetadata | null;
}

/**
 * Request payload for updating an existing staff invitation.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateStaffInvitationRequest {
  department_id?: number | null;
  role_code?: string;
  module_code?: string[] | null;
  status?: InvitationStatus;
  expires_at?: string | null;
  metadata?: InvitationMetadata | null;
}

/**
 * Query parameters for filtering staff invitation list.
 */
export interface StaffInvitationFilters {
  status?: InvitationStatus;
  facility_id?: number;
  staff_id?: number;
  department_id?: number;
  role_code?: string;
  module_code?: string;
  invited_by_staff_id?: number;
  sent_from?: string; // ISO date string
  sent_to?: string; // ISO date string
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
}

/**
 * Pagination metadata returned with invitation lists.
 */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Response structure for invitation acceptance.
 * Returns both the updated invitation and the created staff assignment.
 */
export interface AcceptInvitationResult {
  invitation: StaffInvitation;
  assignment: {
    id: number;
    staff_id: number;
    facility_id: number;
    department_id: number | null;
    role_code: string;
    module_codes: string[];
    is_active: boolean;
    created_at: string;
  };
}



/**
 * Request payload for batch canceling invitations.
 */
export interface BatchCancelInvitationsRequest {
  invitation_ids: number[];
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
 * Response for invitation list endpoint (GET /staff-invitations).
 */
export type GetStaffInvitationsResponse = ApiSuccessResponse<StaffInvitation[]> & {
  meta: PaginationMeta & {
    filters_applied?: Record<string, unknown>;
  };
};

/**
 * Response for single invitation operations (GET, POST, PUT).
 */
export type StaffInvitationResponse = ApiSuccessResponse<StaffInvitation>;

/**
 * Response for delete operation (DELETE /staff-invitations/:id).
 */
export type DeleteStaffInvitationResponse = ApiSuccessResponse<null>;

/**
 * Response for accept invitation (POST /staff-invitations/:id/accept).
 */
export type AcceptInvitationResponse = ApiSuccessResponse<AcceptInvitationResult>;

/**
 * Response for decline invitation (POST /staff-invitations/:id/decline).
 */
export type DeclineInvitationResponse = ApiSuccessResponse<StaffInvitation>;

/**
 * Response for resend invitation (POST /staff-invitations/:id/resend).
 */
export type ResendInvitationResponse = ApiSuccessResponse<StaffInvitation>;

/**
 * Response for cancel invitation (POST /staff-invitations/:id/cancel).
 */
export type CancelInvitationResponse = ApiSuccessResponse<null>;

/**
 * Response for my invitations (GET /staff-invitations/my/invitations).
 */
export interface GetMyInvitationsResponse extends ApiSuccessResponse<StaffInvitation[]> {
  meta: {
    total: number;
    staff_id: number;
  };
}

/**
 * Response for my pending invitations (GET /staff-invitations/my/pending-invitations).
 */
export interface GetMyPendingInvitationsResponse extends ApiSuccessResponse<StaffInvitation[]> {
  meta: {
    total: number;
    staff_id: number;
  };
}

/**
 * Response for batch resend operation.
 */
export interface BatchResendInvitationsResponse extends ApiSuccessResponse<{
  successful: number[];
  failed: { id: number; reason: string }[];
}> {
  meta: {
    total_requested: number;
    successful_count: number;
    failed_count: number;
  };
}

/**
 * Response for batch cancel operation.
 */
export interface BatchCancelInvitationsResponse extends ApiSuccessResponse<{
  successful: number[];
  failed: { id: number; reason: string }[];
}> {
  meta: {
    total_requested: number;
    successful_count: number;
    failed_count: number;
  };
}

/**
 * Request payload for batch deleting invitations.
 * Used for permanently removing declined/expired invitations.
 */
export interface BatchDeleteInvitationsRequest {
  invitation_ids: number[];
}

/**
 * Response for batch delete operation.
 */
export interface BatchDeleteInvitationsResponse extends ApiSuccessResponse<{
  successful: number[];
  failed: { id: number; reason: string }[];
}> {
  meta: {
    total_requested: number;
    successful_count: number;
    failed_count: number;
  };
}



/**
 * Request payload for batch resending invitations.
 */
export interface BatchResendInvitationsRequest {
  invitation_ids: number[];
}


/**
 * Request payload for batch deleting invitations.
 * Used for permanently removing declined/expired invitations.
 */
export interface BatchDeleteInvitationsRequest {
  invitation_ids: number[];
}

/**
 * Common response structure for batch operations.
 */
export interface BatchOperationResult {
  successful: number[];
  failed: Array<{
    id: number;
    reason: string;
  }>;
}

/**
 * Common meta structure for batch operations.
 */
export interface BatchOperationMeta {
  total_requested: number;
  successful_count: number;
  failed_count: number;
}

/**
 * Response for batch resend operation.
 */
export interface BatchResendInvitationsResponse extends ApiSuccessResponse<BatchOperationResult> {
  meta: BatchOperationMeta;
}

/**
 * Response for batch cancel operation.
 */
export interface BatchCancelInvitationsResponse extends ApiSuccessResponse<BatchOperationResult> {
  meta: BatchOperationMeta;
}

/**
 * Response for process expired invitations.
 */
export interface ProcessExpiredInvitationsResponse extends ApiSuccessResponse<{
  processed_count: number;
  expired_invitation_ids: number[];
}> {
  meta: {
    processed_at: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for invitation ID parameter in API calls.
 */
export type InvitationId = number;

/**
 * Type for invitation UUID parameter in API calls.
 */
export type InvitationUUID = string;

/**
 * Union type of all possible staff invitation API responses.
 */
export type StaffInvitationApiResponse =
  | GetStaffInvitationsResponse
  | StaffInvitationResponse
  | DeleteStaffInvitationResponse
  | AcceptInvitationResponse
  | DeclineInvitationResponse
  | ResendInvitationResponse
  | CancelInvitationResponse
  | GetMyInvitationsResponse
  | GetMyPendingInvitationsResponse
  | BatchResendInvitationsResponse
  | BatchCancelInvitationsResponse
  | ProcessExpiredInvitationsResponse;

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
 */
export interface UpdateStaffInvitationParams {
  id: InvitationId;
  data: UpdateStaffInvitationRequest;
}

/**
 * Parameters for delete mutation.
 */
export interface DeleteStaffInvitationParams {
  id: InvitationId;
}

/**
 * Parameters for accept mutation.
 */
export interface AcceptInvitationParams {
  id: InvitationId;
}

/**
 * Parameters for decline mutation.
 */
export interface DeclineInvitationParams {
  id: InvitationId;
}

/**
 * Parameters for resend mutation.
 */
export interface ResendInvitationParams {
  id: InvitationId;
}

/**
 * Parameters for cancel mutation.
 */
export interface CancelInvitationParams {
  id: InvitationId;
}

/* -------------------------------------------------------------------------- */
/*                          INVITATION WORKFLOW TYPES                         */
/* -------------------------------------------------------------------------- */

/**
 * Invitation creation workflow data.
 * Used for multi-step invitation creation process.
 */
export interface InvitationCreationWorkflow {
  // Step 1: Search/Select Staff
  selected_staff?: Staff;
  
  // Step 2: Select Facility & Department
  selected_facility_id?: number;
  selected_department_id?: number | null;
  
  // Step 3: Assign Role & Modules
  selected_role_code?: string;
  selected_module_codes?: string[];
  
  // Step 4: Additional Settings
  expiry_date?: string | null;
  custom_message?: string | null;
}

/**
 * Invitation summary for dashboard display.
 */
export interface InvitationSummary {
  total_invitations: number;
  pending_count: number;
  accepted_count: number;
  declined_count: number;
  expired_count: number;
  expiring_soon_count: number; // Expiring within 7 days
}



/**
 * Invitation statistics by facility.
 */
export interface InvitationStatsByFacility {
  facility_id: number;
  facility_name: string;
  total_sent: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
  acceptance_rate: number; // Percentage
}