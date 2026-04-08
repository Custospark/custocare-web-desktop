import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CreditCard,
  DollarSign,
  FileMinus,
  ReceiptText,
  RefreshCcw,
  Wallet,
} from 'lucide-react';

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const hasData = <T,>(value: T[] | null | undefined): value is T[] =>
  Array.isArray(value) && value.length > 0;

export const toRecord = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
};

export const extractArray = <T = Record<string, unknown>>(
  value: unknown,
  keys: string[] = ['items', 'data', 'rows', 'series', 'categories']
): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  const record = toRecord(value);

  for (const key of keys) {
    const nested = record[key];
    if (Array.isArray(nested)) {
      return nested as T[];
    }
  }

  return [];
};

export const pickString = (
  source: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback = ''
): string => {
  if (!source) return fallback;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return fallback;
};

export const pickNumber = (
  source: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback = 0
): number => {
  if (!source) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
};

export const pickOptionalNumber = (
  source: Record<string, unknown> | null | undefined,
  keys: string[]
): number | null => {
  if (!source) return null;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

export const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const formatCompactCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

export const formatCompactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);

export const formatPercent = (value: number, digits = 1) =>
  `${(Number.isFinite(value) ? value : 0).toFixed(digits)}%`;

export type DashboardMetricCard = {
  label: string;
  value: string;
  subtext?: string;
  change?: number | null;
  icon: LucideIcon;
  iconClassName?: string;
  accentClassName?: string;
};

export const buildSnapshotCards = (
  snapshot: Record<string, unknown>
): DashboardMetricCard[] => [
  {
    label: 'Gross Revenue',
    value: formatCurrency(
      pickNumber(snapshot, [
        'gross_revenue',
        'gross_amount',
        'subtotal_amount',
        'total_amount_charged',
      ])
    ),
    change: pickOptionalNumber(snapshot, [
      'gross_revenue_change_pct',
      'gross_change_pct',
      'gross_change_percent',
    ]),
    icon: DollarSign,
    iconClassName: 'text-emerald-500',
    accentClassName: 'border-l-4 border-emerald-500',
  },
  {
    label: 'Net Revenue',
    value: formatCurrency(
      pickNumber(snapshot, ['net_revenue', 'net_amount', 'net_collections'])
    ),
    change: pickOptionalNumber(snapshot, [
      'net_revenue_change_pct',
      'net_change_pct',
      'net_change_percent',
    ]),
    icon: Wallet,
    iconClassName: 'text-blue-500',
    accentClassName: 'border-l-4 border-blue-500',
  },
  {
    label: 'Collections',
    value: formatCurrency(
      pickNumber(snapshot, [
        'collected_amount',
        'collections_amount',
        'paid_amount',
      ])
    ),
    subtext: `Collection rate ${formatPercent(
      pickNumber(snapshot, ['collection_rate', 'collections_rate'], 0)
    )}`,
    change: pickOptionalNumber(snapshot, [
      'collected_amount_change_pct',
      'collection_change_pct',
    ]),
    icon: CreditCard,
    iconClassName: 'text-violet-500',
    accentClassName: 'border-l-4 border-violet-500',
  },
  {
    label: 'Refunds',
    value: formatCurrency(
      pickNumber(snapshot, ['refund_amount', 'refunded_amount', 'refunds_total'])
    ),
    subtext: `${formatNumber(
      pickNumber(snapshot, ['refund_count', 'refunded_count'], 0)
    )} refund events`,
    change: pickOptionalNumber(snapshot, [
      'refund_amount_change_pct',
      'refund_change_pct',
    ]),
    icon: RefreshCcw,
    iconClassName: 'text-amber-500',
    accentClassName: 'border-l-4 border-amber-500',
  },
  {
    label: 'Outstanding',
    value: formatCurrency(
      pickNumber(snapshot, [
        'outstanding_amount',
        'accounts_receivable',
        'amount_due',
      ])
    ),
    subtext: `${formatPercent(
      pickNumber(snapshot, ['outstanding_rate', 'receivable_rate'], 0)
    )} of billed`,
    icon: ReceiptText,
    iconClassName: 'text-sky-500',
    accentClassName: 'border-l-4 border-sky-500',
  },
  {
    label: 'Write-Offs',
    value: formatCurrency(
      pickNumber(snapshot, [
        'write_off_amount',
        'written_off_amount',
        'total_written_off',
      ])
    ),
    subtext: `${formatPercent(
      pickNumber(snapshot, ['write_off_rate', 'written_off_rate'], 0)
    )} leakage`,
    icon: FileMinus,
    iconClassName: 'text-rose-500',
    accentClassName: 'border-l-4 border-rose-500',
  },
  {
    label: 'Financial Leakage',
    value: formatCurrency(
      pickNumber(snapshot, [
        'financial_leakage_amount',
        'leakage_amount',
        'revenue_leakage',
      ])
    ),
    subtext: `${formatPercent(
      pickNumber(snapshot, ['financial_leakage_rate', 'leakage_rate'], 0)
    )} of gross`,
    icon: AlertTriangle,
    iconClassName: 'text-orange-500',
    accentClassName: 'border-l-4 border-orange-500',
  },
];
