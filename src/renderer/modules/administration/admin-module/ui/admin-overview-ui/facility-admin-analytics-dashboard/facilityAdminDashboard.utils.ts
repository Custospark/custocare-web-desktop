import type {
  AnalyticsGroupBy,
  HighWorkloadStaffItem,
  InventoryItemNeedingReorder,
}  from '../../../api/admin-overview/FacilityAdminAnalyticsTypes';

export {
  AGE_COLORS,
  PIE_COLORS,
  cn,
  formatCompactCurrency,
  formatCurrency,
  formatDateLabel,
  formatFullDate,
  formatNumber,
  formatPercent,
  getPanelClass,
  getSubtlePanelClass,
  getTrendMeta,
  type AccentTone,
} from '../../../../../medical-records/ui/overview/medical-records-dashboard/dashboard.utils';

export const ANALYTICS_GROUP_OPTIONS: Array<{
  label: string;
  value: AnalyticsGroupBy;
}> = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

export const clampPercentage = (value?: number | null) =>
  Math.max(0, Math.min(100, Number(value ?? 0)));

export const formatMinutes = (value?: number | null) => {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(0)} min`;
};

export const formatPersonName = (
  staff: Pick<
    HighWorkloadStaffItem,
    'display_name' | 'full_name' | 'first_name' | 'last_name'
  >
) => {
  if (staff.display_name?.trim()) return staff.display_name;
  if (staff.full_name?.trim()) return staff.full_name;

  const first = staff.first_name?.trim() ?? '';
  const last = staff.last_name?.trim() ?? '';
  const composed = `${first} ${last}`.trim();

  return composed || 'Unknown Staff';
};

export const toTrendDirection = (
  current?: number | null,
  previous?: number | null
): 'up' | 'down' | 'stable' => {
  const currentValue = Number(current ?? 0);
  const previousValue = Number(previous ?? 0);

  if (currentValue > previousValue) return 'up';
  if (currentValue < previousValue) return 'down';
  return 'stable';
};

export const getRiskRank = (riskLevel?: string | null) => {
  const risk = String(riskLevel ?? '').toLowerCase();

  switch (risk) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
};

export const sortInventoryByRisk = (
  items: InventoryItemNeedingReorder[]
): InventoryItemNeedingReorder[] =>
  [...items].sort((a, b) => {
    const riskDelta = getRiskRank(b.risk_level) - getRiskRank(a.risk_level);
    if (riskDelta !== 0) return riskDelta;

    return Number(b.shortage_units ?? 0) - Number(a.shortage_units ?? 0);
  });

export const getRiskPillStyles = (riskLevel: string, isDark: boolean) => {
  const risk = String(riskLevel ?? '').toLowerCase();

  switch (risk) {
    case 'critical':
      return isDark
        ? 'bg-rose-500/15 text-rose-200 border border-rose-500/30'
        : 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'high':
      return isDark
        ? 'bg-orange-500/15 text-orange-200 border border-orange-500/30'
        : 'bg-orange-50 text-orange-700 border border-orange-200';
    case 'medium':
      return isDark
        ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
        : 'bg-amber-50 text-amber-700 border border-amber-200';
    default:
      return isDark
        ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
};
