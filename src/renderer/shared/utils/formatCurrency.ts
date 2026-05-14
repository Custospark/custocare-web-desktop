import { store } from '../../app/store/store';
import { selectActiveFacilityCurrency } from '../../app/store/slices/activeContextSlice';

/**
 * Currency code → symbol mapping.
 * Guarantees correct symbol display regardless of ICU data availability.
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥', NGN: '₦', UGX: 'USh',
  KES: 'KSh', TZS: 'TSh', RWF: 'FRw', ZAR: 'R', GHS: '₵', XOF: 'CFA',
  XAF: 'FCFA', AED: 'د.إ', SAR: '﷼', INR: '₹', PKR: '₨', BDT: '৳',
  AUD: 'A$', CAD: 'C$', CHF: 'CHF', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  BRL: 'R$', MXN: 'Mex$', RUB: '₽', TRY: '₺', ILS: '₪', KRW: '₩',
};

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

/**
 * Format a number as currency using the facility's configured currency.
 * Falls back to USD if no facility currency is set.
 */
export function formatCurrency(value?: number | null, currencyCode?: string): string {
  const raw = (currencyCode || getFacilityCurrency()).toUpperCase();
  const symbol = CURRENCY_SYMBOLS[raw] || raw;
  const num = Number(value ?? 0);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  return `${symbol}${formatted}`;
}

/**
 * Format with an explicit currency code (no Redux fallback).
 */
export function formatCurrencyWithCustomCurrency(value?: number | null, currencyCode?: string): string {
  const raw = (currencyCode || 'USD').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[raw] || raw;
  const num = Number(value ?? 0);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  return `${symbol}${formatted}`;
}

/**
 * Compact notation (K, M, B) for dashboard stats.
 */
export function formatCompactCurrency(value?: number | null, currencyCode?: string): string {
  const raw = (currencyCode || getFacilityCurrency()).toUpperCase();
  const symbol = CURRENCY_SYMBOLS[raw] || raw;
  const num = Number(value ?? 0);
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(num);
  return `${symbol}${formatted}`;
}

/**
 * Alias for formatCurrency — used in admin/service-catalog modules.
 */
export const formatPrice = formatCurrency;
