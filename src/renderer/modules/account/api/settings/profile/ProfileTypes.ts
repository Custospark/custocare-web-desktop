/**
 * ============================================================================
 * PROFILE TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for user profile
 * operations. Handles profile data structure, API request/response types,
 * and utility types for type-safe interactions.
 * 
 * @module profileTypes
 * @description Comprehensive type definitions for user profile management
 */

/* -------------------------------------------------------------------------- */
/*                               ENUMS & CONSTANTS                            */
/* -------------------------------------------------------------------------- */

/**
 * Gender options for user profile
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

/**
 * Available gender options as a union type for flexibility
 */
export type GenderType = 'male' | 'female' | 'other';

/* -------------------------------------------------------------------------- */
/*                              CORE PROFILE TYPE                             */
/* -------------------------------------------------------------------------- */

/**
 * Complete user profile entity as returned by the API.
 * Includes all fields from the backend response structure.
 */
export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  display_name: string;
  title: string | null;
  dob: string | null; // Date in YYYY-MM-DD format
  gender: GenderType | null;
  phone: string | null; // Encrypted in storage, decrypted on retrieval
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  profile_photo_path: string | null;
}

/**
 * Extended profile type with computed properties for UI display
 */
export interface UserProfileDisplay extends UserProfile {
  full_name: string;
  formatted_phone?: string;
  profile_photo_url?: string;
  address_formatted?: string;
  age?: number;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for updating user profile.
 * All fields are optional - only provided fields will be updated.
 * Matches the validation rules from UpdateUserProfileRequest.
 */
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  title?: string | null;
  dob?: string | null; // Format: YYYY-MM-DD
  gender?: GenderType | null;
  phone?: string | null; // Plain text (will be encrypted on server)
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  profile_photo_path?: string | null; // Path to already-uploaded photo
}

/**
 * Parameters for profile photo upload
 */
export interface ProfilePhotoUploadParams {
  photo: File;
  onProgress?: (percentage: number) => void;
}

/**
 * Response from profile photo upload endpoint
 */
export interface ProfilePhotoUploadResponse {
  success: boolean;
  message: string;
  data: {
    profile_photo_path: string;
    profile_photo_url: string;
  };
}

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Response for GET profile endpoint
 */
export type GetProfileResponse = ApiSuccessResponse<UserProfile>;

/**
 * Response for PUT profile update endpoint
 */
export type UpdateProfileResponse = ApiSuccessResponse<UserProfile>;

/* -------------------------------------------------------------------------- */
/*                              PARAMETER TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * User identifier parameter for API calls
 */
export interface UserParams {
  user: number | string; // User ID or 'me' for current user
}

/**
 * Combined params for profile update
 */
export interface UpdateProfileParams extends UserParams {
  data: UpdateProfileRequest;
}

/* -------------------------------------------------------------------------- */
/*                              QUERY KEY TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * Profile query key structure for React Query
 */
export interface ProfileQueryKey {
  user: number | string;
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type guard to check if response is an error
 */
export function isApiErrorResponse(
  response: ApiSuccessResponse<unknown> | ApiErrorResponse
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Options for mutation callbacks
 */
export interface MutationCallbacks<TData, TError = ApiErrorResponse> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
  onSettled?: () => void;
}

/**
 * Helper function to format full name from profile
 */
export const formatFullName = (profile: Partial<UserProfile>): string => {
  if (profile.display_name) return profile.display_name;
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`.trim();
  }
  if (profile.first_name) return profile.first_name;
  if (profile.last_name) return profile.last_name;
  return 'Unknown User';
};

/**
 * Helper function to format address from profile fields
 */
export const formatAddress = (profile: Partial<UserProfile>): string | null => {
  const parts = [
    profile.address_line1,
    profile.address_line2,
    profile.city,
    profile.state,
    profile.postal_code,
    profile.country,
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : null;
};

/**
 * Helper function to calculate age from date of birth
 */
export const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  
  try {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return null;
  }
};