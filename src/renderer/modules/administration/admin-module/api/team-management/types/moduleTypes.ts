/**
 * ============================================================================
 * MODULE TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for module-related
 * operations in the healthcare facility management system.
 * 
 * @module moduleTypes
 * @description Comprehensive type definitions for modules, including
 * request/response types, enums, and utility types for type-safe API interactions.
 */

/* -------------------------------------------------------------------------- */
/*                              CORE MODULE TYPE                              */
/* -------------------------------------------------------------------------- */

/**
 * Complete module entity as returned by the API.
 * Modules represent functional areas/capabilities in the system.
 */
export interface Module {
  // Primary identifiers
  id: number;
  code: string;
  
  // Module details
  name: string;
  description: string | null;
  
  // Status
  is_active: boolean;
  
  // Audit timestamps
  created_at: string;
  updated_at: string;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Request payload for creating a new module.
 */
export interface CreateModuleRequest {
  // Required fields
  code: string;
  name: string;
  
  // Optional fields
  description?: string | null;
  is_active?: boolean;
}

/**
 * Request payload for updating an existing module.
 * All fields are optional - only provided fields will be updated.
 */
export interface UpdateModuleRequest {
  code?: string;
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

/**
 * Query parameters for filtering module list.
 */
export interface ModuleFilters {
  is_active?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Role module default assignment entity.
 * Defines default module access for facility roles.
 */
export interface RoleModuleDefault {
  id: number;
  role_code: string;
  module_code: string;
  default_access: boolean;
  created_at: string;
  updated_at: string;
  
  // Relationships
  module?: Module;
}

/**
 * Request payload for assigning default module access to a role.
 */
export interface AssignRoleModuleDefaultRequest {
  role_code: string;
  module_code: string;
  default_access: boolean;
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
 * Response for module list endpoint (GET /modules).
 */
export type GetModulesResponse = ApiSuccessResponse<Module[]>;

/** Plan-scoped modules for invitations and staff assignments (GET /facilities/{id}/assignable-modules). */
export interface FacilityAssignableModulesData {
  modules: Module[];
  allowed_module_codes: string[];
  plan_enabled_module_codes: string[];
  plan: {
    slug: string | null;
    name: string | null;
  } | null;
  /** True when the current user is a facility owner (can grant administration to staff). */
  editor_is_facility_owner?: boolean;
}

export type GetFacilityAssignableModulesResponse = ApiSuccessResponse<FacilityAssignableModulesData>;

/**
 * Response for single module operations (GET, POST, PUT).
 */
export type ModuleResponse = ApiSuccessResponse<Module>;

/**
 * Response for role module defaults list (GET /modules/role-defaults).
 */
export type GetRoleModuleDefaultsResponse = ApiSuccessResponse<RoleModuleDefault[]>;

/**
 * Response for assign role module default (POST /modules/assign-default).
 */
export type AssignRoleModuleDefaultResponse = ApiSuccessResponse<RoleModuleDefault>;

/**
 * Response for module deactivation (DELETE /modules/:id).
 */
export type DeactivateModuleResponse = ApiSuccessResponse<{ message: string }>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Type for module ID parameter in API calls.
 */
export type ModuleId = number;

/**
 * Type for module code parameter in API calls.
 */
export type ModuleCode = string;

/**
 * Union type of all possible module API responses.
 */
export type ModuleApiResponse =
  | GetModulesResponse
  | ModuleResponse
  | DeactivateModuleResponse
  | GetRoleModuleDefaultsResponse
  | AssignRoleModuleDefaultResponse;

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
export interface UpdateModuleParams {
  id: ModuleId;
  data: UpdateModuleRequest;
}

/**
 * Parameters for deactivate mutation.
 */
export interface DeactivateModuleParams {
  id: ModuleId;
}

/* -------------------------------------------------------------------------- */
/*                          MODULE ACCESS TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * Module with access information for a specific context.
 * Used when displaying modules available to a user/role.
 */
export interface ModuleWithAccess extends Module {
  has_access: boolean;
  access_source?: 'role_default' | 'explicit_grant' | 'invitation';
}

/**
 * Grouped modules by category for UI display.
 */
export interface ModuleCategory {
  category_name: string;
  modules: Module[];
}

/**
 * Module access summary for a facility role.
 */
export interface RoleModuleAccess {
  role_code: string;
  role_name: string;
  modules: Module[];
  total_modules: number;
}