/**
 * ============================================================================
 * SERVICE CATALOG TYPE DEFINITIONS
 * ============================================================================
 * 
 * TypeScript type declarations for service catalog operations in the
 * healthcare facility management system.
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */

/**
 * Service code systems
 */
export enum CodeSystem {
  CPT = 'cpt',
  HCPCS = 'hcpcs',
  ICD_10_PCS = 'icd_10_pcs',
  CDT = 'cdt',
  LOCAL_CUSTOM = 'local_custom',
}

/**
 * Service categories for clinical classification
 */
export enum ServiceCategory {
  EVALUATION_MANAGEMENT = 'evaluation_management',
  DIAGNOSTIC_IMAGING = 'diagnostic_imaging',
  LABORATORY_TEST = 'laboratory_test',
  SURGICAL_PROCEDURE = 'surgical_procedure',
  MEDICAL_PROCEDURE = 'medical_procedure',
  THERAPY_SESSION = 'therapy_session',
  PREVENTIVE_CARE = 'preventive_care',
  VACCINATION = 'vaccination',
  MEDICATION_ADMINISTRATION = 'medication_administration',
  EMERGENCY_SERVICE = 'emergency_service',
  CONSULTATION = 'consultation',
  ANESTHESIA = 'anesthesia',
  PATHOLOGY = 'pathology',
  RADIOLOGY = 'radiology',
  FACILITY_FEE = 'facility_fee',
}

/**
 * Service operational status
 */
export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  UNDER_REVIEW = 'under_review',
}

/**
 * Risk levels for services
 */
export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/* -------------------------------------------------------------------------- */
/*                              CORE DATA TYPES                               */
/* -------------------------------------------------------------------------- */

/**
 * Service catalog entity as returned by API
 */
export interface ServiceCatalog {
  // Primary identifiers
  id: number;
  service_uuid: string;
  facility_id: number;

  // Service identification
  service_code: string;
  service_name: string;
  service_description: string | null;
  service_category: ServiceCategory;
  code_system: CodeSystem;

  // Clinical information
  default_duration_minutes: number | null;
  department_specialty: string | null;
  risk_level: RiskLevel;
  requires_informed_consent: boolean;

  // Pricing
  currency_code: string;
  price_amount: number;

  // Validity period
  effective_from: string; // YYYY-MM-DD
  effective_to: string | null; // YYYY-MM-DD

  // Status
  status: ServiceStatus;

  // Geographic
  applicable_region: string | null;

  // JSON fields
  alternate_names: string[] | null;
  service_subcategories: string[] | null;
  regulatory_approval_status: Record<string, unknown> | null;
  required_certifications: string[] | null;
  minimum_required_credentials: string[] | null;
  required_equipment: string[] | null;
  required_facility_capabilities: string[] | null;
  typical_indications: string[] | null;
  contraindications: string[] | null;
  prerequisites: string[] | null;
  commonly_paired_services: string[] | null;
  approved_countries: string[] | null;
  state_specific_regulations: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;

  // Audit timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_staff_id: number | null;
}

/**
 * Simplified service catalog for lists
 */
export interface ServiceCatalogListItem {
  service_uuid: string;
  service_code: string;
  service_name: string;
  service_category: ServiceCategory;
  status: ServiceStatus;
  currency_code: string;
  price_amount: number;
  effective_from: string;
  effective_to: string | null;
}

/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

/**
 * Query parameters for filtering service catalog list
 */
export interface ServiceCatalogFilters {
  status?: ServiceStatus;
  service_category?: ServiceCategory;
  code_system?: CodeSystem;
  applicable_region?: string;
  risk_level?: RiskLevel;
  effective_date?: string; // YYYY-MM-DD
  department_specialty?: string;
  requires_consent?: boolean;
  min_duration?: number;
  max_duration?: number;
  min_price?: number;
  max_price?: number;
  currency_code?: string;
  search?: string;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Request payload for creating a service catalog
 */
export interface CreateServiceCatalogRequest {
  service_code: string;
  service_name: string;
  service_category: ServiceCategory;
  code_system: CodeSystem;
  currency_code: string;
  price_amount: number;
  effective_from: string;

  // Optional fields
  service_description?: string;
  default_duration_minutes?: number | null;
  department_specialty?: string | null;
  risk_level?: RiskLevel;
  requires_informed_consent?: boolean;
  applicable_region?: string | null;
  effective_to?: string | null;
  status?: ServiceStatus;

  // JSON fields
  alternate_names?: string[] | null;
  service_subcategories?: string[] | null;
  regulatory_approval_status?: Record<string, unknown> | null;
  required_certifications?: string[] | null;
  minimum_required_credentials?: string[] | null;
  required_equipment?: string[] | null;
  required_facility_capabilities?: string[] | null;
  typical_indications?: string[] | null;
  contraindications?: string[] | null;
  prerequisites?: string[] | null;
  commonly_paired_services?: string[] | null;
  approved_countries?: string[] | null;
  state_specific_regulations?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Request payload for updating a service catalog
 */
export type UpdateServiceCatalogRequest = Partial<CreateServiceCatalogRequest> & {
  service_code?: string;
};

/* -------------------------------------------------------------------------- */
/*                            API RESPONSE TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Standard API response structure
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

/**
 * Single service catalog response
 */
export type ServiceCatalogResponse = ApiResponse<ServiceCatalog>;

/**
 * Service catalog list response
 */
export type ServiceCatalogListResponse = PaginatedResponse<ServiceCatalog[]>;

/**
 * Service catalog search response
 */
export type ServiceCatalogSearchResponse = ApiResponse<ServiceCatalog[]>;

/**
 * Service effectiveness check response
 */
export interface ServiceEffectivenessResponse {
  is_effective: boolean;
  service_uuid: string;
  check_date: string;
  effective_from: string;
  effective_to: string | null;
  status: ServiceStatus;
}

export type CheckEffectivenessResponse = ApiResponse<ServiceEffectivenessResponse>;

/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

/**
 * Service UUID type alias
 */
export type ServiceUUID = string;

/**
 * Service code type alias
 */
export type ServiceCode = string;

/**
 * Code system parameter type
 */
export type CodeSystemParam = CodeSystem;

/**
 * Service category parameter type
 */
export type ServiceCategoryParam = ServiceCategory;

/**
 * Mutation callback options
 */
export interface MutationCallbacks<TData, TError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/**
 * Parameters for update mutation
 */
export interface UpdateServiceCatalogParams {
  uuid: ServiceUUID;
  data: UpdateServiceCatalogRequest;
}

/**
 * Parameters for restore mutation
 */
export interface RestoreServiceCatalogParams {
  uuid: ServiceUUID;
}

/**
 * Parameters for delete mutation
 */
export interface DeleteServiceCatalogParams {
  uuid: ServiceUUID;
}

/**
 * Parameters for check effectiveness query
 */
export interface CheckEffectivenessParams {
  uuid: ServiceUUID;
  date?: string;
}

/**
 * Parameters for search query
 */
export interface SearchServiceCatalogsParams {
  query: string;
  filters?: Partial<ServiceCatalogFilters>;
}

/**
 * Parameters for effective services query
 */
export interface EffectiveServicesParams {
  date: string;
  filters?: Partial<ServiceCatalogFilters>;
}

/**
 * Error response type
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  data: [];
}