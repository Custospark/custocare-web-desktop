/**
 * ============================================================================
 * USER STATISTICS TYPES
 * ============================================================================
 * 
 * Type definitions for platform-wide user statistics.
 */

// ==================== METRIC TYPES ====================

export interface KeyMetric {
  label: string;
  value: string | number;
  change?: number | null;
  subtext?: string;
  icon: string;
  color: string;
  bgColor: string;
}

// ==================== VERIFICATION TYPES ====================

export interface VerificationFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface VerificationMethod {
  name: string;
  value: number;
  color: string;
}

export interface VerificationFunnel {
  funnel: VerificationFunnelStage[];
  verification_rate: number;
  pending_rate: number;
  rejection_rate: number;
  avg_verification_time_hours: number;
  methods: VerificationMethod[];
}

// ==================== ACTIVITY TYPES ====================

export interface DailyActivity {
  day: string;
  date: string;
  newUsers: number;
  verified: number;
  active: number;
}

export interface WeeklyTrend {
  week: string;
  week_number: number;
  start_date: string;
  newUsers: number;
  verified: number;
  mfaEnabled: number;
  activeUsers: number;
}

export interface MonthlyTrend {
  month: string;
  month_key: string;
  newUsers: number;
  verified: number;
  cumulative_total: number;
  cumulative_verified: number;
  verification_rate: number;
}

// ==================== DEMOGRAPHIC TYPES ====================

export interface AgeGroup {
  group: string;
  count: number;
  color: string;
}

export interface GenderDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TitleDistribution {
  title: string;
  count: number;
}

export interface DemographicDistribution {
  age: AgeGroup[];
  gender: GenderDistribution[];
  titles: TitleDistribution[];
}

// ==================== MFA TYPES ====================

export interface MfaOverall {
  enabled: number;
  disabled: number;
  adoption_rate: number;
}

export interface MfaByRegion {
  region: string;
  total: number;
  mfa_count: number;
  adoption_rate: number;
}

export interface MfaByCohort {
  cohort: string;
  total: number;
  mfa_count: number;
  adoption_rate: number;
}

export interface MfaTrend {
  month: string;
  adoption_rate: number;
  mfa_count: number;
  total_users: number;
}

export interface MfaAdoption {
  overall: MfaOverall;
  by_region: MfaByRegion[];
  by_cohort: MfaByCohort[];
  trend: MfaTrend[];
}

// ==================== GEOGRAPHIC TYPES ====================

export interface CountryDistribution {
  country: string;
  count: number;
  country_name?: string;
}

export interface StateDistribution {
  state: string;
  count: number;
  state_name?: string;
}

export interface CityDistribution {
  city: string;
  count: number;
}

export interface ResidencyDistribution {
  region: string;
  count: number;
}

export interface GeographicDistribution {
  by_country: CountryDistribution[];
  by_state: StateDistribution[];
  by_city: CityDistribution[];
  by_residency: ResidencyDistribution[];
}

// ==================== PLATFORM TYPES ====================

export interface DeviceTypes {
  desktop: number;
  mobile: number;
  tablet: number;
}

export interface Platforms {
  Windows: number;
  macOS: number;
  Linux: number;
  iOS: number;
  Android: number;
  Other: number;
}

export interface Browsers {
  Chrome: number;
  Firefox: number;
  Safari: number;
  Edge: number;
  Opera: number;
  Other: number;
}

export interface ThemePreference {
  theme: string;
  count: number;
  percentage: number;
}

export interface PlatformBreakdown {
  device_types: DeviceTypes;
  platforms: Platforms;
  browsers: Browsers;
  theme_preference: ThemePreference[];
}

// ==================== RETENTION TYPES ====================

export interface CohortRetentionPeriod {
  month: number;
  period: string;
  active_users: number;
  retention_rate: number;
}

export interface UserCohort {
  cohort: string;
  cohort_label: string;
  size: number;
  retention: CohortRetentionPeriod[];
}

// ==================== SECURITY TYPES ====================

export interface FailedAttemptsDistribution {
  attempt_range: string;
  count: number;
}

export interface SecurityMetrics {
  failed_attempts_distribution: FailedAttemptsDistribution[];
  locked_accounts: number;
  password_changes_30d: number;
  require_password_change: number;
  avg_failed_attempts: number;
}

// ==================== STAFF PERFORMANCE TYPES ====================

export interface StaffPerformer {
  staff_id: number;
  staff_name: string;
  verification_count: number;
  first_verification: string;
  last_verification: string;
}

export interface StaffPerformance {
  top_performers: StaffPerformer[];
  avg_time_by_staff: Record<number, number>;
  total_verifications: number;
  avg_verification_time_overall: number;
}

// ==================== MAIN DASHBOARD TYPES ====================

export interface UserStatistics {
  key_metrics: KeyMetric[];
  verification_funnel: VerificationFunnel;
  daily_activity: DailyActivity[];
  weekly_trends: WeeklyTrend[];
  monthly_trends: MonthlyTrend[];
  demographic_distribution: DemographicDistribution;
  mfa_adoption: MfaAdoption;
  geographic_distribution: GeographicDistribution;
  platform_breakdown: PlatformBreakdown;
  user_retention: UserCohort[];
  security_metrics: SecurityMetrics;
  staff_performance: StaffPerformance;
  timestamp: string;
}

// ==================== FILTER TYPES ====================

export type DateRange = '7_days' | '14_days' | '30_days' | '90_days' | '4_weeks' | '8_weeks' | '12_weeks' | '24_weeks';

export interface StatisticsFilters {
  date_range?: DateRange;
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