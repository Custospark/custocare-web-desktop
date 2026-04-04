import type { RenderableChargeItem } from '../billing-types';
import type {
  BillingReviewItem,
  PaymentMethod,
  Tax,
} from '../../../../api/billing-review/BillingReviewTypes';
import { PaymentStatus } from '../../../../api/billing-review/BillingReviewTypes';

import {
  buildCashBreakdown,
  computeDiscountSnapshot,
  firstMeaningfulNumber,
  roundCurrency,
  safeArray,
  safeNumber,
} from './helpers';

import type {
  NormalizedBillingView,
  NormalizedDraftBillingData,
  NormalizedPersistedBillingData,
  ReceiptBillingDataShape,
  ReceiptTransactionShape,
} from './types';

export const extractDiscountSnapshot = (
  rawBillingData: any,
  item: any,
  subtotal: number
) => {
  return computeDiscountSnapshot({
    subtotal,
    discountType:
      rawBillingData?.discountType ??
      rawBillingData?.discount_type ??
      rawBillingData?.discount?.type ??
      item?.discountType ??
      item?.discount_type ??
      item?.discount?.type,
    discountValue:
      rawBillingData?.discountValue ??
      rawBillingData?.discount_value ??
      rawBillingData?.discount?.value ??
      item?.discountValue ??
      item?.discount_value ??
      item?.discount?.value,
    explicitDiscountAmount:
      rawBillingData?.discountAmount ??
      rawBillingData?.discount_amount ??
      rawBillingData?.discount?.amount ??
      item?.discountAmount ??
      item?.discount_amount ??
      item?.discount?.amount,
  });
};

export const normalizeBackendBillingData = (
  billingData: any,
  backendChargeItems: RenderableChargeItem[] = []
): NormalizedPersistedBillingData => {
  const servicesSubtotalFromItems = roundCurrency(
    safeArray(backendChargeItems).reduce(
      (sum, item) => sum + safeNumber((item as any)?.totalAmount),
      0
    )
  );

  const fallbackSubtotal = roundCurrency(
    firstMeaningfulNumber(billingData?.subtotal, billingData?.sub_total)
  );

  return {
    servicesSubtotal:
      servicesSubtotalFromItems > 0 ? servicesSubtotalFromItems : fallbackSubtotal,
    existingBalance: roundCurrency(
      firstMeaningfulNumber(
        billingData?.balance,
        billingData?.balance_due,
        billingData?.amount_due
      )
    ),
    persistedGrandTotal: roundCurrency(
      firstMeaningfulNumber(billingData?.grandTotal, billingData?.grand_total)
    ),
    persistedTotalPaid: roundCurrency(
      firstMeaningfulNumber(billingData?.totalPaid, billingData?.total_paid)
    ),
    persistedDiscountAmount: roundCurrency(
      firstMeaningfulNumber(
        billingData?.discountAmount,
        billingData?.discount_amount,
        billingData?.discount?.amount
      )
    ),
    persistedTaxes: safeArray<Tax>(billingData?.taxes),
  };
};

export const normalizeDraftBillingData = (
  billingData: any
): NormalizedDraftBillingData => ({
  subtotal: roundCurrency(firstMeaningfulNumber(billingData?.subtotal)),
  discountAmount: roundCurrency(
    firstMeaningfulNumber(billingData?.discountAmount, billingData?.discount_amount)
  ),
  taxableAmount: roundCurrency(
    firstMeaningfulNumber(billingData?.taxableAmount, billingData?.taxable_amount)
  ),
  taxTotal: roundCurrency(
    firstMeaningfulNumber(billingData?.taxTotal, billingData?.tax_total)
  ),
  grandTotal: roundCurrency(
    firstMeaningfulNumber(billingData?.grandTotal, billingData?.grand_total)
  ),
  taxes: safeArray<Tax>(billingData?.taxes),
  totalPaid: roundCurrency(
    firstMeaningfulNumber(billingData?.totalPaid, billingData?.total_paid)
  ),
  balance: roundCurrency(
    firstMeaningfulNumber(
      billingData?.balance,
      billingData?.balance_due,
      billingData?.amount_due
    )
  ),
});

export const normalizeServerBillingItem = (
  item: BillingReviewItem,
  fallbackStatus: string,
  facilityData: any
): NormalizedBillingView => {
  const rawBillingData: any = item?.billing_data ?? {};

  const subtotal = roundCurrency(
    firstMeaningfulNumber(
      rawBillingData?.subtotal,
      rawBillingData?.sub_total,
      (item as any)?.subtotal,
      (item as any)?.sub_total
    )
  );

  const {
    discountAmount,
    discountType,
    rawDiscountValue,
    discountPercent,
  } = extractDiscountSnapshot(rawBillingData, item as any, subtotal);

  const taxableAmount = roundCurrency(
    firstMeaningfulNumber(
      rawBillingData?.taxableAmount,
      rawBillingData?.taxable_amount,
      (item as any)?.taxableAmount,
      (item as any)?.taxable_amount,
      subtotal - discountAmount
    )
  );

  const taxTotal = roundCurrency(
    firstMeaningfulNumber(
      rawBillingData?.taxTotal,
      rawBillingData?.tax_total,
      (item as any)?.taxTotal,
      (item as any)?.tax_total
    )
  );

  const grandTotal = roundCurrency(
    firstMeaningfulNumber(
      rawBillingData?.grandTotal,
      rawBillingData?.grand_total,
      (item as any)?.grandTotal,
      (item as any)?.grand_total,
      taxableAmount + taxTotal
    )
  );

  const totalPaid = roundCurrency(
    firstMeaningfulNumber(
      rawBillingData?.totalPaid,
      rawBillingData?.total_paid,
      (item as any)?.totalPaid,
      (item as any)?.total_paid
    )
  );

  const balance = roundCurrency(
    firstMeaningfulNumber(
      rawBillingData?.balance,
      rawBillingData?.balance_due,
      (item as any)?.balance,
      (item as any)?.balance_due,
      (item as any)?.amount_due,
      Math.max(0, grandTotal - totalPaid)
    )
  );

  const taxes = safeArray<Tax>(rawBillingData?.taxes ?? (item as any)?.taxes);
  const paymentMethods = safeArray<PaymentMethod>((item as any)?.payment_methods);

  const cashTendered = roundCurrency(
    paymentMethods
      .filter((method) => method?.type === 'cash')
      .reduce((sum, method) => sum + safeNumber(method?.amount), 0)
  );

  const nonCashTotal = roundCurrency(
    paymentMethods
      .filter((method) => method?.type !== 'cash')
      .reduce((sum, method) => sum + safeNumber(method?.amount), 0)
  );

  const totalPaidFromMethods = roundCurrency(
    paymentMethods.reduce((sum, method) => sum + safeNumber(method?.amount), 0)
  );

  const serverReportedChange = roundCurrency(
    firstMeaningfulNumber(
      rawBillingData?.changeAmount,
      rawBillingData?.change_amount,
      (item as any)?.changeAmount,
      (item as any)?.change_amount
    )
  );

  const fallbackComputedChange = roundCurrency(
    Math.max(0, cashTendered - Math.max(0, grandTotal - nonCashTotal))
  );

  const changeAmount =
    serverReportedChange > 0 ? serverReportedChange : fallbackComputedChange;

  const netPaid =
    totalPaid > 0 ? totalPaid : roundCurrency(totalPaidFromMethods - changeAmount);

  const billingData: ReceiptBillingDataShape = {
    subtotal,
    discountAmount,
    discountValue: rawDiscountValue,
    discountType,
    taxableAmount,
    taxTotal,
    grandTotal,
    totalPaid,
    balance,
    taxes,
  };

  const combinedNotes = [
    (item as any)?.receipt_number ? `Receipt: ${(item as any).receipt_number}` : null,
    (item as any)?.additional_notes ?? null,
  ]
    .filter(Boolean)
    .join('\n');

  const transaction: ReceiptTransactionShape = {
    receipt_number: (item as any)?.receipt_number ?? null,
    patient_name: (item as any)?.patient_name || 'Unknown Patient',
    patient_number: (item as any)?.patient_number || 'N/A',
    created_at: (item as any)?.created_at || new Date().toISOString(),
    charge_items: safeArray((item as any)?.charge_items).map((charge: any) => ({
      ...charge,
      source: 'backend',
      persisted: true,
    })) as RenderableChargeItem[],
    billing_data: billingData,
    payment_methods: paymentMethods,
    additional_notes: combinedNotes || undefined,
    facilityData,
    payment_status: (item as any)?.payment_status || PaymentStatus.PAID_IN_FULL,
    billing_status: (item as any)?.billing_status || fallbackStatus,
    attending_staff_display: (item as any)?.attending_staff_display || null,
    attending_staff_name: (item as any)?.attending_staff_name || null,
    attending_staff_role: (item as any)?.attending_staff_role || null,
  };

  return {
    transaction,
    derivedFinancials: {
      status: ((item as any)?.payment_status ||
        PaymentStatus.PAID_IN_FULL) as PaymentStatus,
      refunded: 0,
      netPaid,
      balanceDue: balance,
      grandTotal,
      subtotal,
      discountAmount,
      discountPercent,
      discountType,
      taxTotal,
      totalPaidFromMethods,
      cashTendered,
      changeAmount,
      hasCashPayment: cashTendered > 0,
      nonCashTotal,
    },
    cashBreakdown: buildCashBreakdown(cashTendered, changeAmount),
    billingData,
  };
};
