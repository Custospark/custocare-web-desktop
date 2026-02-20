/**
 * FacilityTypes.ts
 * ============================================================================
 * FACILITY IDENTITY TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains TypeScript type declarations for facility identity operations.
 * Exactly matches the response structure from FacilityController@getFacilityDetails.
 * 
 * @module facilityTypes
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Facility type enum - matches database facility_type column
 */
export enum FacilityType {
  HOSPITAL = 'hospital',
  CLINIC = 'clinic',
  URGENT_CARE = 'urgent_care',
  EMERGENCY_DEPARTMENT = 'emergency_department',
  AMBULATORY_SURGERY_CENTER = 'ambulatory_surgery_center',
  DIAGNOSTIC_CENTER = 'diagnostic_center',
  REHABILITATION_CENTER = 'rehabilitation_center',
  LONG_TERM_CARE = 'long_term_care',
  HOSPICE = 'hospice',
  COMMUNITY_HEALTH_CENTER = 'community_health_center',
  SPECIALTY_CENTER = 'specialty_center',
  TELEHEALTH_HUB = 'telehealth_hub',
  LABORATORY = 'laboratory',
  PHARMACY = 'pharmacy',
}

/**
 * Facility tier enum - matches database facility_tier column
 */
export enum FacilityTier {
  TERTIARY = 'tertiary',
  SECONDARY = 'secondary',
  PRIMARY = 'primary',
  SPECIALIZED = 'specialized',
}

/**
 * Operational status enum - matches database operational_status column
 */
export enum OperationalStatus {
  FULLY_OPERATIONAL = 'fully_operational',
  LIMITED_SERVICES = 'limited_services',
  EMERGENCY_ONLY = 'emergency_only',
  TEMPORARILY_CLOSED = 'temporarily_closed',
  PERMANENTLY_CLOSED = 'permanently_closed',
  UNDER_CONSTRUCTION = 'under_construction',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

/**
 * Facility address structure - exactly matches the address object in response
 */
export interface FacilityAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string; // Maps to state_province in DB
  postal_code: string;
  country: string; // Maps to country_code in DB
  formatted: string;
}

/**
 * Facility identity structure - exactly matches the facility object in response
 */
export interface FacilityIdentity {
  id: number;
  uuid: string;
  code: string;
  name: string;
  legal_name: string;
  type: FacilityType;
  tier: FacilityTier;
  status: OperationalStatus;
  phone: string;
  email: string | null;
  address: FacilityAddress;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Success response from the facility identity endpoint
 * GET /api/facility/identity
 * 
 * Exactly matches the JSON structure from FacilityController@getFacilityDetails
 */
export interface FacilityIdentityResponse {
  success: true;
  message: string;
  data: {
    facility: FacilityIdentity;
    retrieved_via: string;
    header_used: string;
    timestamp: string;
  };
  errors: null;
}

/**
 * Error response when facility ID not provided in header (400)
 */
export interface FacilityIdMissingResponse {
  success: false;
  message: string;
  errors: {
    header: string[];
  };
  data: null;
}

/**
 * Error response when facility ID format is invalid (400)
 */
export interface FacilityIdInvalidResponse {
  success: false;
  message: string;
  errors: {
    facility_id: string[];
  };
  data: null;
}

/**
 * Error response when facility not found (404)
 */
export interface FacilityNotFoundResponse {
  success: false;
  message: string;
  errors: {
    facility_id: string[];
  };
  data: null;
}

/**
 * Error response for database errors (500)
 */
export interface DatabaseErrorResponse {
  success: false;
  message: string;
  errors: {
    database: string[];
  };
  data: null;
}

/**
 * Error response for system errors (500)
 */
export interface SystemErrorResponse {
  success: false;
  message: string;
  errors: {
    system: string[];
  };
  data: null;
}

/**
 * Union type for all possible error responses
 */
export type FacilityErrorResponse = 
  | FacilityIdMissingResponse
  | FacilityIdInvalidResponse
  | FacilityNotFoundResponse
  | DatabaseErrorResponse
  | SystemErrorResponse;

/**
 * API Error response (for axios error handling)
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  data: null;
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export type FacilityId = number;
export type FacilityUuid = string;

export interface MutationCallbacks<TData, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & DEFAULTS                            */
/* -------------------------------------------------------------------------- */

export const DEFAULT_FACILITY_ID_HEADER = 'X-Facility-ID';

export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  [FacilityType.HOSPITAL]: 'Hospital',
  [FacilityType.CLINIC]: 'Clinic',
  [FacilityType.URGENT_CARE]: 'Urgent Care',
  [FacilityType.EMERGENCY_DEPARTMENT]: 'Emergency Department',
  [FacilityType.AMBULATORY_SURGERY_CENTER]: 'Ambulatory Surgery Center',
  [FacilityType.DIAGNOSTIC_CENTER]: 'Diagnostic Center',
  [FacilityType.REHABILITATION_CENTER]: 'Rehabilitation Center',
  [FacilityType.LONG_TERM_CARE]: 'Long-term Care',
  [FacilityType.HOSPICE]: 'Hospice',
  [FacilityType.COMMUNITY_HEALTH_CENTER]: 'Community Health Center',
  [FacilityType.SPECIALTY_CENTER]: 'Specialty Center',
  [FacilityType.TELEHEALTH_HUB]: 'Telehealth Hub',
  [FacilityType.LABORATORY]: 'Laboratory',
  [FacilityType.PHARMACY]: 'Pharmacy',
};

export const FACILITY_TIER_LABELS: Record<FacilityTier, string> = {
  [FacilityTier.TERTIARY]: 'Tertiary',
  [FacilityTier.SECONDARY]: 'Secondary',
  [FacilityTier.PRIMARY]: 'Primary',
  [FacilityTier.SPECIALIZED]: 'Specialized',
};

export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  [OperationalStatus.FULLY_OPERATIONAL]: 'Fully Operational',
  [OperationalStatus.LIMITED_SERVICES]: 'Limited Services',
  [OperationalStatus.EMERGENCY_ONLY]: 'Emergency Only',
  [OperationalStatus.TEMPORARILY_CLOSED]: 'Temporarily Closed',
  [OperationalStatus.PERMANENTLY_CLOSED]: 'Permanently Closed',
  [OperationalStatus.UNDER_CONSTRUCTION]: 'Under Construction',
};

/* -------------------------------------------------------------------------- */
/*                            TYPE GUARD FUNCTIONS                            */
/* -------------------------------------------------------------------------- */

/**
 * Type guard to check if a value is a valid FacilityType
 */
export function isFacilityType(value: string): value is FacilityType {
  return Object.values(FacilityType).includes(value as FacilityType);
}

/**
 * Type guard to check if a value is a valid FacilityTier
 */
export function isFacilityTier(value: string): value is FacilityTier {
  return Object.values(FacilityTier).includes(value as FacilityTier);
}

/**
 * Type guard to check if a value is a valid OperationalStatus
 */
export function isOperationalStatus(value: string): value is OperationalStatus {
  return Object.values(OperationalStatus).includes(value as OperationalStatus);
}

/**
 * Type guard to check if response is a success response
 */
export function isSuccessResponse(
  response: FacilityIdentityResponse | FacilityErrorResponse
): response is FacilityIdentityResponse {
  return response.success === true;
}



/* -------------------------------------------------------------------------- */
/*                            DISPLAY FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Get display name for facility type
 */
export function getFacilityTypeDisplayName(type: FacilityType): string {
  return FACILITY_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get display name for facility tier
 */
export function getFacilityTierDisplayName(tier: FacilityTier): string {
  return FACILITY_TIER_LABELS[tier] || tier.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get display name for operational status
 */
export function getOperationalStatusDisplayName(status: OperationalStatus): string {
  return OPERATIONAL_STATUS_LABELS[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get color scheme for operational status (for UI badges)
 */
export function getOperationalStatusColor(status: OperationalStatus): { bg: string; text: string; dot: string } {
  const colors: Record<OperationalStatus, { bg: string; text: string; dot: string }> = {
    [OperationalStatus.FULLY_OPERATIONAL]: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    [OperationalStatus.LIMITED_SERVICES]: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    [OperationalStatus.EMERGENCY_ONLY]: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
    [OperationalStatus.TEMPORARILY_CLOSED]: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    [OperationalStatus.PERMANENTLY_CLOSED]: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
    [OperationalStatus.UNDER_CONSTRUCTION]: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  };
  return colors[status];
}

/**
 * Format facility address components into a formatted string
 * Matches the 'formatted' field in the response
 */
export function formatAddress(address: {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}): string {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
}

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL TYPES                                */
/* -------------------------------------------------------------------------- */

export default {
  // Enums
  FacilityType,
  FacilityTier,
  OperationalStatus,
  
  // Constants
  DEFAULT_FACILITY_ID_HEADER,
  FACILITY_TYPE_LABELS,
  FACILITY_TIER_LABELS,
  OPERATIONAL_STATUS_LABELS,
  
  // Type Guards
  isFacilityType,
  isFacilityTier,
  isOperationalStatus,
  isSuccessResponse,
  
  // Display Functions
  getFacilityTypeDisplayName,
  getFacilityTierDisplayName,
  getOperationalStatusDisplayName,
  getOperationalStatusColor,
  
  // Utilities
  formatAddress,
};