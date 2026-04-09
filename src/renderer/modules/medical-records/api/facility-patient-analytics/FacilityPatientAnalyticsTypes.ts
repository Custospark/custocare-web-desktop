/**
 * FacilityPatientAnalyticsTypes.ts
 * ============================================================================
 * Type definitions for the clinic owner dashboard data.
 */

/* -------------------------------------------------------------------------- */
/*                               KPI & METRICS                                */
/* -------------------------------------------------------------------------- */

export interface KpiMetric {
  value: number;
  previous_value: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface NewVsReturning {
  new: number;
  returning: number;
  new_rate: number;
}

export interface KpiData {
  total_patients: KpiMetric;
  new_vs_returning: NewVsReturning;
  active_visits: number;
  completed_visits: number;
  cancelled_missed: number;
}

/* -------------------------------------------------------------------------- */
/*                               PATIENT TRENDS                               */
/* -------------------------------------------------------------------------- */

export interface DailyTrend {
  date: string;
  patients: number;
}

export interface WeeklyTrend {
  week: string;
  patients: number;
}

export interface NewPatientGrowth {
  date: string;
  new_patients: number;
}

export interface PeakDay {
  day: string;
  count: number;
}

export interface PatientTrends {
  daily: DailyTrend[];
  weekly: WeeklyTrend[];
  new_patient_growth: NewPatientGrowth[];
  peak_days: PeakDay[];
}

/* -------------------------------------------------------------------------- */
/*                             PATIENT FLOW                                   */
/* -------------------------------------------------------------------------- */

export interface PatientFlow {
  average_waiting_minutes: number;
  average_consultation_minutes: number;
  average_arrival_to_consultation_minutes: number;
  queue_length: number;
}

/* -------------------------------------------------------------------------- */
/*                              DEMOGRAPHICS                                  */
/* -------------------------------------------------------------------------- */

export interface AgeGroup {
  group: string;
  count: number;
}

export interface GenderDistribution {
  gender: string;
  count: number;
}

export interface InsuranceVsCash {
  insurance: number;
  cash: number;
}

export interface Demographics {
  age_groups: AgeGroup[];
  gender_distribution: GenderDistribution[];
  insurance_vs_cash: InsuranceVsCash;
}

/* -------------------------------------------------------------------------- */
/*                              VISIT TYPES                                   */
/* -------------------------------------------------------------------------- */

export interface VisitTypeCount {
  type: string;
  count: number;
}

export interface TopCondition {
  condition: string;
  count: number;
}

export interface VisitTypesData {
  visit_types: VisitTypeCount[];
  most_treated_conditions: TopCondition[];
}

/* -------------------------------------------------------------------------- */
/*                              RETENTION                                     */
/* -------------------------------------------------------------------------- */

export interface RetentionData {
  repeat_visit_rate: number;
  missed_appointment_rate: number;
  follow_up_compliance: number;
  returning_patients_percentage: number;
}

/* -------------------------------------------------------------------------- */
/*                              REVENUE                                       */
/* -------------------------------------------------------------------------- */

export interface TopPayingService {
  service: string;
  revenue: number;
}

export interface RevenueData {
  revenue_per_patient: number;
  average_revenue_per_visit: number;
  top_paying_services: TopPayingService[];
}

/* -------------------------------------------------------------------------- */
/*                              ALERTS                                        */
/* -------------------------------------------------------------------------- */

export interface DashboardAlert {
  type: 'high_waiting_time' | 'high_missed_rate' | 'patient_drop' | 'overcrowding';
  severity: 'info' | 'warning' | 'danger';
  message: string;
  value: number;
}

/* -------------------------------------------------------------------------- */
/*                          COMPLETE DASHBOARD RESPONSE                       */
/* -------------------------------------------------------------------------- */

export interface PeriodInfo {
  label: string;
  start_date: string;
  end_date: string;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    period: PeriodInfo;
    kpi: KpiData;
    patient_trends: PatientTrends;
    patient_flow: PatientFlow;
    demographics: Demographics;
    visit_types: VisitTypesData;
    retention: RetentionData;
    revenue: RevenueData;
    alerts: DashboardAlert[];
  };
}

/* -------------------------------------------------------------------------- */
/*                            REQUEST PARAMS                                  */
/* -------------------------------------------------------------------------- */

export type DashboardPeriod = 'today' | 'week' | 'month' | 'custom';

export interface DashboardQueryParams {
  period?: DashboardPeriod;
  date_from?: string;
  date_to?: string;
}