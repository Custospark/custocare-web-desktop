import type { LucideIcon } from 'lucide-react';
import { store } from '../../../../../../app/store/store'; // Adjust path as needed
import { selectActiveFacilityCurrency } from '../../../../../../app/store/slices/activeContextSlice';

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

export const hasData = <T,>(value: T[] | null | undefined): value is T[] =>
  Array.isArray(value) && value.length > 0;

/**
 * Get the current facility currency from Redux store
 * Falls back to 'USD' if not available
 */
const getCurrentFacilityCurrency = (): string => {
  try {
    const state = store.getState();
    const currency = selectActiveFacilityCurrency(state);
    return currency && typeof currency === 'string' ? currency : 'USD';
  } catch (error) {
    console.warn('Failed to get facility currency, falling back to USD:', error);
    return 'USD';
  }
};

/**
 * Format currency using facility's configured currency
 * Falls back to USD if no facility currency is set
 */
export const formatCurrency = (value: number, currency?: string) => {
  const finalCurrency = currency || getCurrentFacilityCurrency();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: finalCurrency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
};

/**
 * Format compact currency using facility's configured currency
 * Falls back to USD if no facility currency is set
 */
export const formatCompactCurrency = (value: number, currency?: string) => {
  const finalCurrency = currency || getCurrentFacilityCurrency();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: finalCurrency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
};

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

export const formatText = (text: string): string => {
  return text
    .replace(/[,-]/g, ' ')           // Replace commas and hyphens with spaces
    .split('_')                       // Split by underscore
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')                        // Join with spaces
    .replace(/\s+/g, ' ')             // Clean up multiple spaces
    .trim();                          // Remove leading/trailing spaces
};

export type DashboardMetricCard = {
  label: string;
  value: string;
  subtext?: string;
  change?: number | null;
  icon: LucideIcon;
  iconClassName?: string;
  accentClassName?: string;
};