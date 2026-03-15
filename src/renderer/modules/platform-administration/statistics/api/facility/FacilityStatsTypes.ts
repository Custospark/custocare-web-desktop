/**
 * ============================================================================
 * FACILITY STATISTICS TYPES
 * ============================================================================
 * 
 * Type definitions for platform-wide facility statistics.
 */

// ==================== METRIC TYPES ====================

export interface FacilityKeyMetric {
  label: string;
  value: string | number;
  change?: number | null;
  subtext?: string;
  icon: string;
  color: string;
  bgColor: string;
}

// ==================== DISTRIBUTION TYPES ====================

export interface FacilityTypeDistribution {
  type: string;
  type_label: string;
  count: number;
  color: string;
}

export interface FacilityTierDistribution {
  tier: string;
  tier_label: string;
  count: number;
  color: string;
}

export interface NatureDistribution {
  nature: string;
  nature_label: string;
  count: number;
  color: string;
}

export interface OperationalStatusDistribution {
  status: string;
  status_label: string;
  count: number;
  color: string;
}

// ==================== GEOGRAPHIC TYPES ====================

export interface CountryDistribution {
  country_code: string;
  country_name?: string;
  count: number;
}

export interface StateDistribution {
  state: string;
  count: number;
}

export interface CityDistribution {
  city: string;
  count: number;
}

export interface GeographicDistribution {
  by_country: CountryDistribution[];
  by_state: StateDistribution[];
  by_city: CityDistribution[];
}

// ==================== CAPACITY TYPES ====================

export interface BedDistribution {
  range: string;
  count: number;
  color: string;
}

export interface CapacityMetrics {
  bed_distribution: BedDistribution[];
  facilities_with_beds: number;
  facilities_without_beds: number;
  avg_bed_capacity: number;
  total_beds_by_tier: Record<string, number>;
}

// ==================== SERVICE TYPES ====================

export interface TopService {
  service: string;
  count: number;
  percentage: number;
}

export interface ServiceAvailability {
  top_services: TopService[];
  total_unique_services: number;
  avg_services_per_facility: number;
}

export interface TopSpecialty {
  specialty: string;
  count: number;
  percentage: number;
}

export interface SpecialtyServices {
  top_specialties: TopSpecialty[];
  total_unique_specialties: number;
  facilities_with_specialties: number;
}

// ==================== EMERGENCY TYPES ====================

export interface EmergencyCapability {
  count: number;
  percentage: number;
}

export interface TraumaLevel {
  level: string;
  count: number;
}

export interface TraumaCenter extends EmergencyCapability {
  by_level: TraumaLevel[];
}

export interface EmergencyCapabilities {
  emergency_dept: EmergencyCapability;
  trauma_center: TraumaCenter;
  intensive_care: EmergencyCapability;
  neonatal_icu: EmergencyCapability;
  cardiac_cath_lab: EmergencyCapability;
}

// ==================== ACCREDITATION TYPES ====================

export interface TopAccreditation {
  accreditation: string;
  count: number;
  percentage: number;
}

export interface AccreditationStats {
  top_accreditations: TopAccreditation[];
  accredited_facilities: number;
  percentage_accredited: number;
}

// ==================== LICENSE TYPES ====================

export interface LicenseExpiryMetrics {
  expiring_soon: number;
  expiring_medium: number;
  expiring_later: number;
  expired: number;
  no_license_date: number;
  total_with_license: number;
}

// ==================== PERFORMANCE TYPES ====================

export interface PerformanceMetrics {
  avg_wait_time_overall: number;
  avg_wait_time_by_type: Record<string, number>;
  avg_satisfaction_overall: number;
  avg_satisfaction_by_tier: Record<string, number>;
  total_monthly_volume: number;
  volume_by_tier: Record<string, number>;
  facilities_with_performance_data: number;
}

// ==================== DATA RESIDENCY TYPES ====================

export interface ResidencyDistribution {
  region: string;
  count: number;
}

// ==================== GROWTH TREND TYPES ====================

export interface GrowthTrend {
  month: string;
  month_key: string;
  new_facilities: number;
  cumulative_total: number;
}

// ==================== MAIN DASHBOARD TYPES ====================

export interface FacilityStatistics {
  key_metrics: FacilityKeyMetric[];
  facility_type_distribution: FacilityTypeDistribution[];
  facility_tier_distribution: FacilityTierDistribution[];
  nature_distribution: NatureDistribution[];
  operational_status_distribution: OperationalStatusDistribution[];
  geographic_distribution: GeographicDistribution;
  capacity_metrics: CapacityMetrics;
  service_availability: ServiceAvailability;
  specialty_services: SpecialtyServices;
  emergency_capabilities: EmergencyCapabilities;
  accreditation_stats: AccreditationStats;
  license_expiry_metrics: LicenseExpiryMetrics;
  performance_metrics: PerformanceMetrics;
  data_residency_distribution: ResidencyDistribution[];
  facility_growth_trends: GrowthTrend[];
  timestamp: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]> | null;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}