/**
 * ============================================================================
 * FACILITY SETTINGS TYPE DEFINITIONS
 * ============================================================================
 *
 * Backend endpoints:
 *   GET  /facilities/{facility}/settings
 *   PUT  /facilities/{facility}/settings
 *   POST /facilities/{facility}/settings/logo
 */

export enum NatureOfFacility {
  GOVERNMENT = 'government',
  PRIVATE = 'private',
  FAITH_BASED = 'faith_based',
  NGO = 'ngo',
  MILITARY = 'military',
  ACADEMIC = 'academic',
  PUBLIC_PRIVATE_PARTNERSHIP = 'public_private_partnership',
}

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

export enum FacilityTier {
  TERTIARY = 'tertiary',
  SECONDARY = 'secondary',
  PRIMARY = 'primary',
  SPECIALIZED = 'specialized',
}

export enum OperationalStatus {
  FULLY_OPERATIONAL = 'fully_operational',
  LIMITED_SERVICES = 'limited_services',
  EMERGENCY_ONLY = 'emergency_only',
  TEMPORARILY_CLOSED = 'temporarily_closed',
  PERMANENTLY_CLOSED = 'permanently_closed',
  UNDER_CONSTRUCTION = 'under_construction',
}

export type JsonArray = unknown[];

/* -------------------------------------------------------------------------- */
/*                           Grouped Settings Shape                           */
/* -------------------------------------------------------------------------- */

export interface FacilitySettingsCoreIdentity {
  facility_name: string;
  legal_entity_name: string;
  health_system_name: string | null;
}

export interface FacilitySettingsClassification {
  nature_of_facility: NatureOfFacility | null;
  facility_type: FacilityType | null;
  facility_tier: FacilityTier | null;
}

export interface FacilitySettingsCapacityAndServices {
  bed_capacity: number | null;
  available_services: JsonArray;
  specialty_services: JsonArray | null;
  equipment_inventory_summary: JsonArray | null;
}

export interface FacilitySettingsLocation {
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string; // ISO2
  latitude: number | null;
  longitude: number | null;
}

export interface FacilitySettingsContactInformation {
  main_phone: string;
  emergency_phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
}

export interface FacilitySettingsOperations {
  operating_hours: JsonArray;
  emergency_services_hours: JsonArray | null;
  is_24_7: boolean;
  operational_status: OperationalStatus | null;
  average_wait_time_minutes: number | null;
  monthly_patient_volume: number | null;
}

export interface FacilitySettingsLicensingAndCompliance {
  license_number: string | null;
  license_issuing_authority: string | null;
  license_expiry_date: string | null; // YYYY-MM-DD
  regulatory_identifiers: JsonArray | null;
  participates_in_medicare: boolean;
  participates_in_medicaid: boolean;
}

export interface FacilitySettingsClinicalCapabilities {
  has_emergency_department: boolean;
  has_trauma_center: boolean;
  trauma_center_level: number | null; // 1..5
  has_intensive_care: boolean;
  has_neonatal_icu: boolean;
  has_cardiac_cath_lab: boolean;
}

export interface FacilitySettingsFinancialConfiguration {
  currency: string; // ISO4217 (size 3)
  tax_enabled: boolean;
  tax_name: string | null;
  tax_rate: number | null; // 0..100
}

export interface FacilitySettingsBranding {
  facility_logo_path: string | null; // read-only via settings (write via logo upload endpoint)
  facility_logo_url: string | null; // computed by backend
  primary_brand_color: string | null; // hex
  secondary_brand_color: string | null; // hex
}

export interface FacilitySettingsSystemConfiguration {
  timezone: string;
  data_residency_region: string | null;
}

export interface FacilitySettingsSnapshot {
  CoreIdentity: FacilitySettingsCoreIdentity;
  Classification: FacilitySettingsClassification;
  CapacityAndServices: FacilitySettingsCapacityAndServices;
  Location: FacilitySettingsLocation;
  ContactInformation: FacilitySettingsContactInformation;
  Operations: FacilitySettingsOperations;
  LicensingAndCompliance: FacilitySettingsLicensingAndCompliance;
  ClinicalCapabilities: FacilitySettingsClinicalCapabilities;
  FinancialConfiguration: FacilitySettingsFinancialConfiguration;
  Branding: FacilitySettingsBranding;
  SystemConfiguration: FacilitySettingsSystemConfiguration;
}

/* -------------------------------------------------------------------------- */
/*                             Flat Editable Fields                           */
/* -------------------------------------------------------------------------- */
/**
 * PUT payload is flat (NOT grouped). Only sent keys are updated.
 * NOTE: facility_logo_path is excluded by backend whitelist (logo uploads go
 *       through POST /settings/logo).
 */
export interface FacilitySettingsFlatEditableFields {
  // CoreIdentity
  facility_name: string;
  legal_entity_name: string;
  health_system_name: string | null;

  // Classification
  nature_of_facility: NatureOfFacility | null;
  facility_type: FacilityType | null;
  facility_tier: FacilityTier | null;

  // CapacityAndServices
  bed_capacity: number | null;
  available_services: JsonArray;
  specialty_services: JsonArray | null;
  equipment_inventory_summary: JsonArray | null;

  // Location
  address_line1: string;
  address_line2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  latitude: number | null;
  longitude: number | null;

  // ContactInformation
  main_phone: string;
  emergency_phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;

  // Operations
  operating_hours: JsonArray;
  emergency_services_hours: JsonArray | null;
  is_24_7: boolean;
  operational_status: OperationalStatus | null;
  average_wait_time_minutes: number | null;
  monthly_patient_volume: number | null;

  // LicensingAndCompliance
  license_number: string | null;
  license_issuing_authority: string | null;
  license_expiry_date: string | null;
  regulatory_identifiers: JsonArray | null;
  participates_in_medicare: boolean;
  participates_in_medicaid: boolean;

  // ClinicalCapabilities
  has_emergency_department: boolean;
  has_trauma_center: boolean;
  trauma_center_level: number | null;
  has_intensive_care: boolean;
  has_neonatal_icu: boolean;
  has_cardiac_cath_lab: boolean;

  // FinancialConfiguration
  currency: string;
  tax_enabled: boolean;
  tax_name: string | null;
  tax_rate: number | null;

  // Branding (colors only)
  primary_brand_color: string | null;
  secondary_brand_color: string | null;

  // SystemConfiguration
  timezone: string;
  data_residency_region: string | null;
}

export type UpdateFacilitySettingsRequest = Partial<FacilitySettingsFlatEditableFields>;

/* -------------------------------------------------------------------------- */
/*                                API Envelopes                               */
/* -------------------------------------------------------------------------- */

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
}

export type GetFacilitySettingsResponse = ApiSuccessResponse<FacilitySettingsSnapshot>;
export type UpdateFacilitySettingsResponse = ApiSuccessResponse<FacilitySettingsSnapshot>;

export interface UploadFacilityLogoResponseData {
  facility_logo_path: string;
  facility_logo_url: string;
}
export type UploadFacilityLogoResponse = ApiSuccessResponse<UploadFacilityLogoResponseData>;

/* -------------------------------------------------------------------------- */
/*                             Mutations + Helpers                            */
/* -------------------------------------------------------------------------- */

export type AxiosApiError = import('axios').AxiosError<ApiErrorResponse>;

export interface MutationCallbacks<TData, TError = AxiosApiError> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/** Utility: strict-ish hex validation (matches backend regex intent) */
export const isValidHexColor = (v: string): boolean =>
  /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);

/** Utility: safe URL check for basic client-side validation */
export const isProbablyUrl = (v: string): boolean => {
  try {
    // eslint-disable-next-line no-new
    new URL(v);
    return true;
  } catch {
    return false;
  }
};
