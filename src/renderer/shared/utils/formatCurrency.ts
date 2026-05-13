import { store } from '../../app/store/store';
import { selectActiveFacilityCurrency } from '../../app/store/slices/activeContextSlice';

/**
 * Get the current facility currency from Redux store.
 * Falls back to 'USD' if not available.
 */
function getFacilityCurrency(): string {
  try {
    const state = store.getState();
    const currency = selectActiveFacilityCurrency(state);
    return currency && typeof currency === 'string' ? currency : 'USD';
  } catch {
    return 'USD';
  }
}

/**
 * Format a number as currency using the facility's configured currency.
 * Falls back to USD if no facility currency is set.
 */
export function formatCurrency(value?: number | null, currencyCode?: string): string {
  const currency = currencyCode || getFacilityCurrency();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

/**
 * Format with an explicit currency code (no Redux fallback).
 */
export function formatCurrencyWithCustomCurrency(value?: number | null, currencyCode?: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

/**
 * Compact notation (K, M, B) for dashboard stats.
 */
export function formatCompactCurrency(value?: number | null, currencyCode?: string): string {
  const currency = currencyCode || getFacilityCurrency();
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value ?? 0));
}

/**
 * Alias for formatCurrency — used in admin/service-catalog modules.
 */
export const formatPrice = formatCurrency;
