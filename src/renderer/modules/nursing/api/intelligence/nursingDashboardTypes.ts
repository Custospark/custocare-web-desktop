/**
 * Types for GET /nursing/facility/{facilityId}/dashboard
 */

export interface SummaryStatBlock {
  value: number;
  change_pct?: number | null;
  change_label?: string | null;
}

export interface SummaryLowStockBlock extends SummaryStatBlock {
  change?: number | null;
}

export interface SummaryDispensedBlock extends SummaryStatBlock {
  secondary_label?: string | null;
}

export interface SummaryTreatmentVolumeBlock {
  value: number;
  currency?: string | null;
  change_pct_vs_avg_daily?: number | null;
  change_label?: string | null;
}

export interface NursingDashboardSummary {
  open_tasks: SummaryStatBlock & { change_label?: string | null };
  missed_medication_alerts: SummaryLowStockBlock;
  administrations_today: SummaryDispensedBlock;
  pending_review: { value: number; change_label?: string | null };
  treatment_logs_today: SummaryTreatmentVolumeBlock;
  overdue_tasks: number;
}

export interface DoseActivityDay {
  day: string;
  date: string;
  doses_scheduled: number;
  administered: number;
  pending: number;
}

export interface DoseActivityBlock {
  bucket: string;
  series: DoseActivityDay[];
  totals: {
    doses_scheduled_week: number;
    administrations_week: number;
    completion_rate_pct: number;
    avg_per_day: number;
  };
}

export interface CareVolumeTrendPoint {
  date: string;
  label: string;
  administered_units: number;
  scheduled_doses: number;
  exceptions: number;
}

export interface CareVolumeTrendsBlock {
  days: number;
  series: CareVolumeTrendPoint[];
  footer: {
    pending_upcoming_doses: number;
    overdue_pending_doses: number;
    activity_growth_pct: number;
    avg_daily_admin_units: number;
    note?: string | null;
  };
}

export type NursingActivityType = 'task' | 'medication' | 'treatment' | 'handover';

export interface NursingRecentActivityItem {
  id: string;
  type: NursingActivityType;
  title: string;
  description: string;
  occurred_at: string | null;
  actor_name: string | null;
}

export interface NursingPerformanceBlock {
  medication_on_time_pct: number;
  task_completion_pct: number;
  documentation_rate_pct: number;
  avg_wait_minutes: number | null;
  daily_touchpoints: number;
  workload_vs_avg_pct: number;
  overall_grade: string;
  overall_label: string;
}

export interface NursingDashboardDataSources {
  facility_tasks_table: boolean;
  nursing_medication_doses_table: boolean;
  nursing_medication_administrations_table: boolean;
  nursing_treatment_logs_table: boolean;
  facility_shift_handovers_table: boolean;
}

export interface NursingDashboardData {
  summary: NursingDashboardSummary;
  dose_activity: DoseActivityBlock;
  care_volume_trends: CareVolumeTrendsBlock;
  recent_activity: NursingRecentActivityItem[];
  performance: NursingPerformanceBlock;
  generated_at: string;
  data_sources?: NursingDashboardDataSources;
}

export interface NursingDashboardResponse {
  success: boolean;
  message: string;
  data: NursingDashboardData;
}
