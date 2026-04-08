import type {
  BillingRevenueDashboardData,
  BillingRevenueDashboardFilters,
} from '../../../../api/billing-revenue-stats/BillingRevenueDashboardTypes';

export type TabKey = 'overview' | 'collections' | 'operations' | 'leakages';

export type BillingRevenueDashboardUi = {
  pageBg: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
};

export type BillingRevenueDashboardTabProps = {
  dashboard?: BillingRevenueDashboardData;
  isDark: boolean;
  ui: BillingRevenueDashboardUi;
  cardClassName: string;
};

export const defaultFilters: BillingRevenueDashboardFilters = {
  group_by: 'day',
  top: 10,
};

export const dashboardTabs: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'collections', label: 'Collections' },
  { key: 'operations', label: 'Operations' },
  { key: 'leakages', label: 'Leakages' },
];

export const PAYMENT_MIX_COLORS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#84CC16',
  '#F97316',
];

export const LEAKAGE_REASON_COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#10B981'];
export const BREAKDOWN_COLORS = ['#3B82F6', '#14B8A6', '#A855F7', '#F59E0B', '#EC4899'];
export const STATUS_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
export const INVENTORY_COLORS = ['#F97316', '#FB923C', '#FDBA74', '#EA580C', '#C2410C'];
