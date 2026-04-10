/**
 * FacilityAdminAnalyticsTypes.ts
 * ============================================================================
 * FACILITY ADMIN ANALYTICS DASHBOARD TYPES
 * Matches the response from FacilityOwnerAnalyticsService (PHP)
 * ============================================================================
 */

import { BillingRevenueDashboardData } from '../../../../medical-records/api/billing-revenue-stats/BillingRevenueDashboardTypes';

// ---------------------------------------------------------------------------
// Filter types (same as billing dashboard)
// ---------------------------------------------------------------------------
export type AnalyticsGroupBy = 'day' | 'week' | 'month';

export interface FacilityAdminAnalyticsFilters {
  date_from?: string;
  date_to?: string;
  group_by?: AnalyticsGroupBy;
  top?: number;
}

export interface FacilityAnalyticsFiltersNormalized {
  date_from: string;
  date_to: string;
  group_by: AnalyticsGroupBy;
  top: number;
}

// ---------------------------------------------------------------------------
// Staff Availability & Workload
// ---------------------------------------------------------------------------
export interface StaffCurrentSnapshot {
  staff_on_duty: number;
  staff_busy: number;
  staff_off_duty: number;
  total_active: number;
  occupancy_rate: number;
}

export interface RoleDistributionItem {
  role: string;
  count: number;
}

export interface HighWorkloadStaffItem {
  staff_uuid: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  full_name: string;
  max_concurrent_patients: number;
  current_patient_load: number;
  workload_percentage: number;
  total_patients_treated: number;
  patient_satisfaction: number | null;
}

export interface PresenceTrendPoint {
  date: string;
  on_duty: number;
  busy: number;
  off_duty: number;
}

export interface WorkloadTrendPoint {
  date: string;
  total_active_patients: number;
  unique_staff_assigned: number;
  avg_patients_per_staff: number;
}

export interface StaffAvailabilityMetrics {
  current_snapshot: StaffCurrentSnapshot;
  role_distribution: RoleDistributionItem[];
  high_workload_staff: HighWorkloadStaffItem[];
  presence_trend: PresenceTrendPoint[];
  workload_trend: WorkloadTrendPoint[];
}

// ---------------------------------------------------------------------------
// Capacity Utilization (Departments, Spaces, Wards)
// ---------------------------------------------------------------------------
export interface DepartmentCapacityItem {
  department_name: string;
  department_type: string;
  bed_count: number;
  treatment_rooms: number;
  max_capacity: number;
  assigned_staff_count: number;
  avg_wait_time_minutes: number | null;
  capacity_utilization_hint: string;
}

export interface SpaceTypeSummary {
  space_type: string;
  total: number;
}

export interface WardsByTypeItem {
  ward_type: string;
  count: number;
  total_declared_capacity: number;
  total_operational_capacity: number;
}

export interface WardDetail {
  id: number;
  code: string | null;
  name: string;
  ward_type: string;
  building: string | null;
  floor: string | null;
  capacity_declared: number;
  capacity_operational: number;
  sex_restriction: string;
  age_group: string;
  status: 'active';
  estimated_occupied_beds: number | null;
  utilization_percentage: number | null;
}

export interface CapacitySummaryWards {
  total_wards: number;
  total_declared_capacity: number;
  total_operational_capacity: number;
  wards_by_type: WardsByTypeItem[];
}

export interface CapacitySummary {
  total_beds: number;
  total_treatment_rooms: number;
  total_concurrent_capacity: number;
  space_utilization_rate: number;
  occupied_spaces: number;
  total_active_spaces: number;
  wards: CapacitySummaryWards;
}

export interface CapacityUtilizationMetrics {
  departments: DepartmentCapacityItem[];
  summary: CapacitySummary;
  space_types: SpaceTypeSummary[];
  wards: WardDetail[];
}

// ---------------------------------------------------------------------------
// Inventory Risk
// ---------------------------------------------------------------------------
export interface InventoryItemNeedingReorder {
  item_code: string;
  item_name: string;
  category: string;
  current_stock: number;
  reorder_point: number;
  shortage_units: number;
  reorder_qty: number;
  safety_stock: number;
  unit_cost: number;
  risk_level: string;
}

export interface ControlledItem {
  item_name: string;
  schedule: string;
}

export interface InventoryRiskSummary {
  total_active_items: number;
  items_below_reorder_point: number;
  high_risk_inventory_count: number;
}

export interface InventoryRiskMetrics {
  items_needing_reorder: InventoryItemNeedingReorder[];
  controlled_substances_count: number;
  controlled_items: ControlledItem[];
  summary: InventoryRiskSummary;
}

// ---------------------------------------------------------------------------
// Service Pricing & Revenue Potential
// ---------------------------------------------------------------------------
export interface TopServiceByPrice {
  service_name: string;
  category: string;
  price: number;
  currency: string;
  risk_level: string;
  duration_minutes: number | null;
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  total_price_sum: number;
  avg_price: number;
  share_percentage: number;
}

export interface ServicePricingSummary {
  total_active_services: number;
  total_revenue_potential: number;
  average_service_price: number;
  highest_price_service: number;
}

export interface ServicePricingMetrics {
  top_services_by_price: TopServiceByPrice[];
  category_breakdown: CategoryBreakdownItem[];
  summary: ServicePricingSummary;
}

// ---------------------------------------------------------------------------
// Overall Dashboard Data
// ---------------------------------------------------------------------------
export interface FacilityAdminAnalyticsData {
  staff_availability: StaffAvailabilityMetrics;
  capacity_utilization: CapacityUtilizationMetrics;
  inventory_risk: InventoryRiskMetrics;
  service_pricing: ServicePricingMetrics;
  financial: BillingRevenueDashboardData | null;
}

export interface FacilityAdminAnalyticsResponse {
  success: boolean;
  message: string;
  data?: FacilityAdminAnalyticsData;
  filters?: FacilityAnalyticsFiltersNormalized;
  errors?: Record<string, string[]>;
  error?: string | null;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  error?: string;
}