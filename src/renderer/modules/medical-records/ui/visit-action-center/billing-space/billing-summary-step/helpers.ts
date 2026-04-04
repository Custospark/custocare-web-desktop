import { PaymentStatus } from '../../../../api/billing-review/BillingReviewTypes';
import type { CashBreakdown, ComputedDiscountSnapshot } from './types';

export const clamp = (
  value: number,
  min = 0,
  max = Number.POSITIVE_INFINITY
) => Math.max(min, Math.min(max, value));

export const onlyDigits = (value: string) => value.replace(/[^\d]/g, '');

export const safeArray = <T,>(value: T[] | undefined | null): T[] =>
  Array.isArray(value) ? value : [];

export const safeNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const roundCurrency = (value: number) =>
  Math.round((safeNumber(value) + Number.EPSILON) * 100) / 100;

export const firstMeaningfulNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && value.trim() === '') continue;

    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
};

export const normalizeDiscountType = (
  value: unknown
): 'percentage' | 'fixed' | null => {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized === 'percentage' || normalized === 'percent') return 'percentage';
  if (normalized === 'fixed' || normalized === 'flat') return 'fixed';

  return null;
};

export const computeDiscountSnapshot = ({
  subtotal,
  discountType,
  discountValue,
  explicitDiscountAmount,
}: {
  subtotal: number;
  discountType: unknown;
  discountValue: unknown;
  explicitDiscountAmount?: unknown;
}): ComputedDiscountSnapshot => {
  const normalizedType = normalizeDiscountType(discountType);
  const normalizedSubtotal = roundCurrency(Math.max(0, safeNumber(subtotal)));
  const normalizedRawValue = roundCurrency(Math.max(0, safeNumber(discountValue)));
  const normalizedExplicitAmount = roundCurrency(
    Math.max(0, safeNumber(explicitDiscountAmount))
  );

  let computedAmount = normalizedExplicitAmount;

  if (computedAmount <= 0 && normalizedType && normalizedRawValue > 0) {
    computedAmount =
      normalizedType === 'percentage'
        ? roundCurrency(normalizedSubtotal * (normalizedRawValue / 100))
        : roundCurrency(normalizedRawValue);
  }

  const discountAmount = roundCurrency(clamp(computedAmount, 0, normalizedSubtotal));

  return {
    discountType: normalizedType,
    rawDiscountValue: normalizedRawValue,
    discountPercent: normalizedType === 'percentage' ? normalizedRawValue : 0,
    discountAmount,
  };
};

export const getPaymentStatusFromNumbers = ({
  amountDueBeforePayment,
  netPaid,
  balanceDue,
}: {
  amountDueBeforePayment: number;
  netPaid: number;
  balanceDue: number;
}): PaymentStatus => {
  if (amountDueBeforePayment <= 0) return PaymentStatus.PENDING;
  if (netPaid <= 0) return PaymentStatus.PENDING;
  if (balanceDue <= 0) return PaymentStatus.PAID_IN_FULL;
  return PaymentStatus.PARTIALLY_PAID;
};

export const buildCashBreakdown = (
  cashTendered: number,
  changeAmount: number
): CashBreakdown | null => {
  if (cashTendered <= 0) return null;

  return {
    tendered: roundCurrency(cashTendered),
    change: roundCurrency(changeAmount),
    netCash: roundCurrency(cashTendered - changeAmount),
  };
};
