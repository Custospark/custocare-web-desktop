/**
 * BillingRevenueDashboardTypes.ts
 * ============================================================================
 * BILLING REVENUE DASHBOARD TYPES
 * ============================================================================
 */

export type BillingDashboardGroupBy = 'day' | 'week' | 'month';

export interface BillingRevenueDashboardFilters {
  date_from?: string;
  date_to?: string;
  group_by?: BillingDashboardGroupBy;
  top?: number;
}

export interface DashboardFiltersEcho {
  facility_id: number;
  date_from: string;
  date_to: string;
  group_by: BillingDashboardGroupBy;
  top: number;
}

export interface SnapshotMetrics {
  gross_billed_amount: number;
  net_revenue: number;
  total_collections: number;
  outstanding_balance: number;
  total_invoices: number;
  average_bill_value: number;
  median_bill_value: number;
  min_bill_value: number;
  max_bill_value: number;
  previous_period_net_revenue: number;
  revenue_growth_percentage: number;
  total_leakage_amount: number;
  leakage_percentage: number;
}

export interface RevenueTrendPoint {
  period_key: string;
  period_label: string;
  gross_billed_amount: number;
  net_revenue: number;
  total_collections: number;
  outstanding_balance: number;
  invoice_count: number;
}

export interface BillingActivityPoint {
  period_key: string;
  period_label: string;
  invoice_count: number;
  average_bill_value: number;
  median_bill_value: number;
  min_bill_value: number;
  max_bill_value: number;
}

export interface RevenueBreakdownByServiceItem {
  service_code: string;
  service_name: string;
  category: string;
  revenue: number;
  quantity_sold: number;
  average_unit_price: number;
  refund_count: number;
  refund_amount: number;
  share_percentage: number;
}

export interface RevenueBreakdownByCategoryItem {
  category: string;
  revenue: number;
  quantity_sold: number;
  share_percentage: number;
}

export interface RevenueBreakdownSection {
  by_service: RevenueBreakdownByServiceItem[];
  by_category: RevenueBreakdownByCategoryItem[];
}

export interface FinancialLeakageSummary {
  total_refund_amount: number;
  total_voided_amount: number;
  total_leakage_amount: number;
  refund_transaction_count: number;
  void_transaction_count: number;
  average_refund_size: number;
  leakage_rate_percentage: number;
}

export interface FinancialLeakageReasonItem {
  reason: string;
  count: number;
  amount: number;
}

export interface FinancialLeakageTrendPoint {
  period_key: string;
  period_label: string;
  refund_amount: number;
  void_amount: number;
  total_leakage_amount: number;
  count: number;
}

export interface FinancialLeakageTopCase {
  adjustment_id: number;
  reference_number: string;
  adjustment_type: string;
  adjustment_reason: string;
  amount: number;
  patient_id: number | null;
  visit_id: number | null;
  billing_cycle_id: number | null;
  billing_cycle_uuid: string | null;
  completed_at: string | null;
}

export interface FinancialLeakagesSection {
  summary: FinancialLeakageSummary;
  by_reason: FinancialLeakageReasonItem[];
  trend: FinancialLeakageTrendPoint[];
  top_cases: FinancialLeakageTopCase[];
}

export interface PerformanceByDayItem {
  day_of_week_number: number;
  day_of_week: string;
  invoice_count: number;
  net_revenue: number;
  gross_billed_amount: number;
  average_bill_value: number;
}

export interface StaffContributionItem {
  staff_id: number;
  staff_uuid: string | null;
  staff_name: string;
  invoice_count: number;
  net_revenue: number;
  average_bill_value: number;
}

export interface CollectionsSummary {
  total_outstanding_balance: number;
  pending_invoices_count: number;
  average_days_outstanding: number;
  collection_rate_percentage: number;
}

export interface AgingBucketItem {
  label: string;
  min: number;
  max: number | null;
  amount: number;
  count: number;
}

export interface CollectionsStatusDistributionItem {
  billing_status: string;
  count: number;
  amount: number;
}

export interface CollectionsSection {
  summary: CollectionsSummary;
  aging: AgingBucketItem[];
  status_distribution: CollectionsStatusDistributionItem[];
}

export interface PaymentMixMethodItem {
  payment_method: string;
  amount: number;
  count: number;
  share_percentage: number;
}

export interface PaymentMixSummary {
  patient_contribution: number;
  insurance_contribution: number;
  overpayment_occurrences: number;
  overpayment_amount: number;
}

export interface PaymentMixSection {
  methods: PaymentMixMethodItem[];
  summary: PaymentMixSummary;
}

export interface InventoryLeakageItem {
  inventory_item_id: number | null;
  item_code: string;
  item_name: string;
  billed_quantity: number;
  billed_amount: number;
  refunded_quantity: number;
  restored_quantity: number;
  leakage_amount: number;
  adjustment_count: number;
}

export interface BillingRevenueDashboardData {
  filters: DashboardFiltersEcho;
  snapshot: SnapshotMetrics;
  revenue_trend: RevenueTrendPoint[];
  billing_activity: BillingActivityPoint[];
  revenue_breakdown: RevenueBreakdownSection;
  financial_leakages: FinancialLeakagesSection;
  performance_by_day: PerformanceByDayItem[];
  staff_contribution: StaffContributionItem[];
  collections: CollectionsSection;
  payment_mix: PaymentMixSection;
  inventory_leakage: InventoryLeakageItem[];
}

export interface BillingRevenueDashboardResponse {
  success: boolean;
  message: string;
  data?: BillingRevenueDashboardData;
  errors?: Record<string, string[]>;
  error?: string | null;
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  error?: string;
}
