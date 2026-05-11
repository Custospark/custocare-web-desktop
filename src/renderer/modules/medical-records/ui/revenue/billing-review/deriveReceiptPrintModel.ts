/**
 * Pure helpers shared by receipt preview / print surfaces (billing review, billing invoices, etc.).
 */
import {
  PaymentStatus,
  type PaymentMethod,
  type Discount,
} from '../../../api/billing-review/BillingReviewTypes';
import type {
  CashBreakdown,
  DerivedFinancials,
  ReceiptTransactionShape,
} from './components/receipt-view/printable-receipt/ReceiptTypes';

export function resolveDiscountAmount(subtotal: number, discount?: Discount | null): number {
  if (!discount) return 0;

  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const safeValue = Math.max(0, Number(discount.value) || 0);

  const rawDiscount =
    discount.type === 'percentage' ? safeSubtotal * (safeValue / 100) : safeValue;

  return Math.min(rawDiscount, safeSubtotal);
}

export function getCashBreakdownForTransaction(
  selectedTransaction: ReceiptTransactionShape,
  cashAmount: number,
): CashBreakdown {
  const chargeItems = selectedTransaction.charge_items || [];
  const subtotal = chargeItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  const discountAmount = resolveDiscountAmount(subtotal, selectedTransaction.discount);
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxes = selectedTransaction.taxes || [];
  const taxTotal = taxes.reduce((sum, tax) => sum + (tax.amount || 0), 0);
  const grandTotal = taxableAmount + taxTotal;

  const nonCashTotal =
    selectedTransaction.payment_methods
      ?.filter((pm) => pm.type !== 'cash')
      ?.reduce((sum, pm) => sum + (pm.amount || 0), 0) || 0;

  const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
  const change = cashAmount > remainingAfterNonCash ? cashAmount - remainingAfterNonCash : 0;
  const netCash = cashAmount - change;

  return {
    tendered: cashAmount,
    change,
    netCash,
  };
}

export function getDerivedFinancialsFromReceiptTransaction(
  selectedTransaction: ReceiptTransactionShape | null,
): DerivedFinancials | null {
  if (!selectedTransaction) return null;

  const chargeItems = selectedTransaction.charge_items || [];
  const subtotal = chargeItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

  const discountType = selectedTransaction.discount?.type || null;
  const discountValue = Number(selectedTransaction.discount?.value || 0);
  const discountAmount = resolveDiscountAmount(subtotal, selectedTransaction.discount);
  const discountPercent = discountType === 'percentage' ? discountValue : 0;

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxes = selectedTransaction.taxes || [];
  const taxTotal = taxes.reduce((sum, tax) => sum + (tax.amount || 0), 0);

  const grandTotal = taxableAmount + taxTotal;

  const paymentMethods = selectedTransaction.payment_methods || [];
  const hasCashPayment = paymentMethods.some((pm) => pm.type === 'cash');

  const cashTendered = paymentMethods
    .filter((pm) => pm.type === 'cash')
    .reduce((sum, pm) => sum + (pm.amount || 0), 0);

  const nonCashTotal = paymentMethods
    .filter((pm) => pm.type !== 'cash')
    .reduce((sum, pm) => sum + (pm.amount || 0), 0);

  const totalPaidFromMethods = paymentMethods.reduce(
    (sum: number, pm: PaymentMethod) => sum + (pm.amount || 0),
    0,
  );

  const remainingAfterNonCash = Math.max(0, grandTotal - nonCashTotal);
  const changeAmount =
    cashTendered > remainingAfterNonCash ? cashTendered - remainingAfterNonCash : 0;

  const cashApplied = cashTendered - changeAmount;
  const netPaid = cashApplied + nonCashTotal;

  const balanceDue = Math.max(0, grandTotal - netPaid);

  const refunded = 0;

  let status = selectedTransaction.payment_status as PaymentStatus;

  if (grandTotal > 0) {
    if (balanceDue === 0 && netPaid > 0) {
      status = PaymentStatus.PAID_IN_FULL;
    } else if (balanceDue > 0 && balanceDue < grandTotal) {
      status = PaymentStatus.PARTIALLY_PAID;
    } else if (balanceDue === grandTotal && netPaid === 0) {
      status = PaymentStatus.PENDING;
    } else if (changeAmount > 0) {
      status = PaymentStatus.PAID_IN_FULL;
    }
  }

  return {
    status,
    refunded,
    netPaid,
    balanceDue,
    grandTotal,
    subtotal,
    discountAmount,
    discountPercent,
    discountType,
    taxTotal,
    totalPaidFromMethods,
    cashTendered,
    changeAmount,
    hasCashPayment,
    nonCashTotal,
  };
}
