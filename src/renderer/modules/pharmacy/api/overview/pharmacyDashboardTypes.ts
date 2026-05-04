/**
 * Types for GET /pharmacy/facility/{facilityId}/dashboard
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

export interface SummaryRevenueBlock {
  value: number;
  currency?: string | null;
  change_pct_vs_avg_daily?: number | null;
  change_label?: string | null;
}

export interface PharmacyDashboardSummary {
  total_stock_items: SummaryStatBlock & { change_label?: string | null };
  low_stock_alerts: SummaryLowStockBlock;
  dispensed_today: SummaryDispensedBlock;
  pending_checkouts: { value: number; change_label?: string | null };
  revenue_today: SummaryRevenueBlock;
  out_of_stock_items: number;
}

export interface PrescriptionActivityDay {
  day: string;
  date: string;
  prescriptions: number;
  dispensed: number;
  pending: number;
}

export interface PrescriptionActivityBlock {
  bucket: string;
  series: PrescriptionActivityDay[];
  totals: {
    prescriptions_week: number;
    dispensed_week: number;
    completion_rate_pct: number;
    avg_per_day: number;
  };
}

export interface InventoryTrendPoint {
  date: string;
  label: string;
  dispensed_units: number;
  restock_units: number;
  consumption_units: number;
}

export interface InventoryTrendsBlock {
  days: number;
  series: InventoryTrendPoint[];
  footer: {
    avg_stock_units: number;
    avg_low_stock: number;
    avg_out_of_stock: number;
    stock_growth_pct: number;
    avg_daily_dispensed_units?: number;
    note?: string | null;
  };
}

export type PharmacyActivityType = 'dispensed' | 'prescription' | 'checkout' | 'stock';

export interface PharmacyRecentActivityItem {
  id: string;
  type: PharmacyActivityType;
  title: string;
  description: string;
  occurred_at: string | null;
  actor_name: string | null;
}

export interface PharmacyPerformanceBlock {
  dispensing_safety_rate_pct: number;
  prescription_completion_pct: number;
  verification_rate_pct: number;
  avg_wait_minutes: number | null;
  daily_patients: number;
  revenue_target_pct: number;
  overall_grade: string;
  overall_label: string;
}

export interface PharmacyDashboardData {
  summary: PharmacyDashboardSummary;
  prescription_activity: PrescriptionActivityBlock;
  inventory_trends: InventoryTrendsBlock;
  recent_activity: PharmacyRecentActivityItem[];
  performance: PharmacyPerformanceBlock;
  generated_at: string;
}

export interface PharmacyDashboardResponse {
  success: boolean;
  message: string;
  data: PharmacyDashboardData;
}
