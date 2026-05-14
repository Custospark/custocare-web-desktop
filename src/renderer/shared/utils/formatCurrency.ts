import { store } from '../../app/store/store';
import { selectActiveFacilityCurrency } from '../../app/store/slices/activeContextSlice';
import { CURRENCY_SYMBOLS } from './currencies';

/**
 * Get the current facility currency from Redux store.
 * Falls back to 'USD' if not available.
 */
function getFacilityCurrency(): string {
  try {
    const state = store.getState();
    const currency = selectActiveFacilityCurrency(state);
    return currency && typeof currency === 'string' ? currency.toUpperCase() : 'USD';
  } catch {
    return 'USD';
  }
}

function symbolFor(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format a number as currency using the facility's configured currency.
 * Falls back to USD if no facility currency is set.
 */
export function formatCurrency(value?: number | null, currencyCode?: string): string {
  const raw = (currencyCode || getFacilityCurrency()).toUpperCase();
  return `${symbolFor(raw)}${formatNumber(Number(value ?? 0))}`;
}

/**
 * Format with an explicit currency code (no Redux fallback).
 */
export function formatCurrencyWithCustomCurrency(value?: number | null, currencyCode?: string): string {
  const raw = (currencyCode || 'USD').toUpperCase();
  return `${symbolFor(raw)}${formatNumber(Number(value ?? 0))}`;
}

/**
 * Compact notation (K, M, B) for dashboard stats.
 */
export function formatCompactCurrency(value?: number | null, currencyCode?: string): string {
  const raw = (currencyCode || getFacilityCurrency()).toUpperCase();
  const num = Number(value ?? 0);
  const compact = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num);
  return `${symbolFor(raw)}${compact}`;
}

/**
 * Alias for formatCurrency — used in admin/service-catalog modules.
 */
export const formatPrice = formatCurrency;
