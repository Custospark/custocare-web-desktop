export interface LaboratorySummaryBlock {
  value: number;
  change_pct?: number | null;
  change_label?: string | null;
}

export interface LaboratoryRevenueBlock extends LaboratorySummaryBlock {}

export interface LaboratoryDashboardSummary {
  pending_requests: LaboratorySummaryBlock;
  in_progress_items: LaboratorySummaryBlock;
  completed_results_today: LaboratorySummaryBlock;
  critical_results_today: LaboratorySummaryBlock;
  revenue_today: LaboratoryRevenueBlock;
  avg_turnaround_hours: LaboratorySummaryBlock;
}

export interface LaboratoryRequestActivityDay {
  day: string;
  date: string;
  requested: number;
  completed: number;
  pending: number;
}

export interface LaboratoryRequestActivityBlock {
  bucket: string;
  series: LaboratoryRequestActivityDay[];
  totals: {
    requested_week: number;
    completed_week: number;
    completion_rate_pct: number;
  };
}

export interface LaboratoryResultFlags {
  normal: number;
  abnormal: number;
  critical: number;
  pending: number;
}

export interface LaboratoryRevenueTrendPoint {
  date: string;
  label: string;
  revenue: number;
}

export interface LaboratoryRevenueTrendBlock {
  days: number;
  series: LaboratoryRevenueTrendPoint[];
  total_revenue: number;
  avg_daily_revenue: number;
}

export interface LaboratoryTopBilledService {
  service_name: string;
  quantity: number;
  revenue: number;
}

export type LaboratoryRecentActivityType = 'request' | 'result';

export interface LaboratoryRecentActivityItem {
  id: string;
  type: LaboratoryRecentActivityType;
  title: string;
  description: string;
  occurred_at: string | null;
}

export interface LaboratoryPerformanceBlock {
  verification_rate_pct: number;
  avg_turnaround_hours: number;
  critical_open_count: number;
  overall_grade: string;
  overall_label: string;
}

export interface LaboratoryDashboardData {
  summary: LaboratoryDashboardSummary;
  request_activity: LaboratoryRequestActivityBlock;
  result_flags: LaboratoryResultFlags;
  revenue_trend: LaboratoryRevenueTrendBlock;
  top_billed_services: LaboratoryTopBilledService[];
  recent_activity: LaboratoryRecentActivityItem[];
  performance: LaboratoryPerformanceBlock;
  generated_at: string;
}

export interface LaboratoryDashboardResponse {
  success: boolean;
  message: string;
  data: LaboratoryDashboardData;
}

