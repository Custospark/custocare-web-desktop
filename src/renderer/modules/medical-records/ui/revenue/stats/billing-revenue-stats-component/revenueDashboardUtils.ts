import type { LucideIcon } from 'lucide-react';
import { DEFAULT_CURRENCY } from '../../../visit-action-center/billing-space';

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const hasData = <T,>(value: T[] | null | undefined): value is T[] =>
  Array.isArray(value) && value.length > 0;

export const formatCurrency = (value: number, currency = DEFAULT_CURRENCY) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const formatCompactCurrency = (value: number, currency = DEFAULT_CURRENCY) =>
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
