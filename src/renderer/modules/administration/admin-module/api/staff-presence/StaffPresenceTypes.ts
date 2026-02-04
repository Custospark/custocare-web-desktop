/**
 * ============================================================================
 * STAFF PRESENCE TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for staff presence-related
 * operations in the healthcare facility management system.
 * 
 * @module staffPresenceTypes
 * @description Comprehensive type definitions for staff presence tracking,
 * including request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Staff presence statuses as defined in the backend migration.
 * Maps to database enum values for staff availability tracking.
 */
export enum StaffPresenceStatus {
  OFF_DUTY = 'off_duty',
  ON_DUTY = 'on_duty',
  ON_BREAK = 'on_break',
  BUSY = 'busy',
  UNAVAILABLE = 'unavailable',
}

/**
 * Who initiated the presence update.
 * Used for audit trail and permission checking.
 */
export enum UpdatedBy {
  SYSTEM = 'system',
  STAFF = 'staff',
  ADMIN = 'admin',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Simplified staff reference for presence records.
 */
export interface StaffReference {
  id: number;
  staff_uuid?: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  professional_title?: string;
  global_role_level?: string;
  avatar_url?: string | null;
}

/**
 * Simplified facility reference for presence records.
 */
export interface FacilityReference {
  id: number;
  facility_uuid?: string;
  facility_code: string;
  facility_name: string;
  facility_type: string;
}

/**
 * Simplified user reference for audit trail.
 */
export interface UserReference {
  id: number;
  user_uuid?: string;
  email: string;
  first_name: string;
  last_name: string;
}

/* -------------------------------------------------------------------------- */
/*                           CORE PRESENCE TYPE                               */
/* -------------------------------------------------------------------------- */

/**
 * Complete staff presence entity as returned by the API.
 * Represents a staff member's presence session in a facility.
 */
export interface StaffPresence {
  // Primary identifiers
  id: number;
  staff_id: number;
  facility_id: number;

  // Presence status
  status: StaffPresenceStatus;
  status_label: string;

  // Session timing
  started_at: string | null;
  ended_at: string | null;

  // Audit trail
  updated_by: UpdatedBy;
  updated_by_user_id: number | null;

  // Additional information
  note: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Relationships (loaded conditionally)
  staff?: StaffReference;
  facility?: FacilityReference;
  updated_by_user?: UserReference;

  // Computed attributes
  is_active: boolean;
  duration_minutes?: number;
  is_eligible_for_forwarding: boolean;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for setting/updating staff presence.
 * Used in POST /staff/presence endpoint.
 */
export interface SetPresenceRequest {
  // Required fields
  facility_id: number;
  status: StaffPresenceStatus;

  // Optional fields
  note?: string | null;
  updated_by?: UpdatedBy; // Defaults to 'staff' when set by the staff member
}

/**
 * Request payload for updating presence (admin/system use).
 * Includes additional fields for administrative updates.
 */
export interface UpdatePresenceRequest extends SetPresenceRequest {
  staff_id?: number; // Optional, defaults to current staff if not provided
  updated_by_user_id?: number; // User ID of admin/system updating the presence
}

/**
 * Query parameters for myPresence endpoint.
 */
export interface MyPresenceQuery {
  facility_id: number;
}

/**
 * Query parameters for eligibleForForwarding endpoint.
 */
export interface EligibleForForwardingQuery {
  facility_id: number;
  search?: string; // Optional search term for staff name/ID
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
 * Response for myPresence endpoint (GET /staff/presence).
 */
export type MyPresenceResponse = ApiSuccessResponse<StaffPresence | null>;

/**
 * Response for setMyPresence endpoint (POST /staff/presence).
 */
export type SetMyPresenceResponse = ApiSuccessResponse<StaffPresence>;

/**
 * Response for eligibleForForwarding endpoint (GET /facilities/staff/eligible-for-forwarding).
 */
export interface EligibleForForwardingResponse extends ApiSuccessResponse<StaffPresence[]> {
  meta?: {
    facility_id: number;
    count: number;
    timestamp: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for presence ID parameter.
 */
export type PresenceId = number;

/**
 * Type for staff ID parameter.
 */
export type StaffId = number;

/**
 * Type for facility ID parameter.
 */
export type FacilityId = number;

/**
 * Union type of all possible presence API responses.
 */
export type PresenceApiResponse =
  | MyPresenceResponse
  | SetMyPresenceResponse
  | EligibleForForwardingResponse;

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
 * Parameters for presence mutations.
 */
export interface SetPresenceParams {
  data: SetPresenceRequest;
}

/**
 * Helper type to check if a presence is eligible for forwarding.
 * Based on backend's scopeEligibleForForwarding logic.
 */
export type EligibleForForwarding = StaffPresence & {
  status: StaffPresenceStatus.ON_DUTY | StaffPresenceStatus.BUSY;
};

/**
 * Computed presence statistics for reporting/dashboard.
 */
export interface PresenceStats {
  total_staff: number;
  on_duty: number;
  on_break: number;
  busy: number;
  unavailable: number;
  off_duty: number;
  available_for_forwarding: number;
  last_updated: string;
}

/**
 * Active presence session with staff and facility details.
 * Used for real-time presence tracking displays.
 */
export interface ActivePresence extends StaffPresence {
  staff: StaffReference;
  facility: FacilityReference;
}

/**
 * Historical presence record for reporting.
 */
export interface HistoricalPresence extends StaffPresence {
  staff: StaffReference;
  facility: FacilityReference;
  duration_seconds: number;
}