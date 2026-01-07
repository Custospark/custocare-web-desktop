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
import type { Staff } from './staffTypes';

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
  staff?: StaffReference;
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
}

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
 * Request payload for batch resending invitations.
 */
export interface BatchResendInvitationsRequest {
  invitation_ids: number[];
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