import { useMemo } from 'react';

import type { PaymentMethod } from '../../../../api/billing-review/BillingReviewTypes';
import type { RenderableChargeItem } from '../billing-types';
import type {
  BillingSummaryTheme,
  NormalizedBillingView,
  ReceiptBillingDataShape,
  ReceiptTransactionShape,
  DerivedFinancials,
} from './types';

import {
  buildCashBreakdown,
  computeDiscountSnapshot,
  getPaymentStatusFromNumbers,
  normalizeBackendBillingData,
  normalizeDraftBillingData,
  normalizeServerBillingItem,
  roundCurrency,
  safeArray,
  safeNumber,
} from './helpers';

import { getBillingSummaryColors } from './billingSummaryTheme';

interface UseBillingSummaryViewModelParams {
  theme: BillingSummaryTheme;
  activeVisit: any;
  activePatient: any;
  backendBillingData: any;
  backendBillingMeta: any;
  backendChargeItems: RenderableChargeItem[];
  draftBillingData: any;
  renderableChargeItems: RenderableChargeItem[];
  facilityData: any;
  status: string;
  paymentMethods: PaymentMethod[];
  discount: any;
  additionalNotes: string;
  receiptNumber: string;
  serverBillingItem: any;
  isServerMode: boolean;
  isReadOnly: boolean;
  isFinalized: boolean;
  isProcessing: boolean;
  isSubmitting: boolean;
  hasAnyBillableContext: boolean;
  hasRequiredIds: boolean;
  focusedAmountInputs: Record<number, boolean>;
}

export const useBillingSummaryViewModel = ({
  theme,
  activeVisit,
  activePatient,
  backendBillingData,
  backendBillingMeta,
  backendChargeItems,
  draftBillingData,
  renderableChargeItems,
  facilityData,
  status,
  paymentMethods,
  discount,
  additionalNotes,
  receiptNumber,
  serverBillingItem,
  isServerMode,
  isReadOnly,
  isFinalized,
  isProcessing,
  isSubmitting,
  hasAnyBillableContext,
  hasRequiredIds,
  focusedAmountInputs,
}: UseBillingSummaryViewModelParams) => {
  const normalizedPersistedBilling = useMemo(
    () => normalizeBackendBillingData(backendBillingData, backendChargeItems),
    [backendBillingData, backendChargeItems]
  );

  const normalizedDraftBilling = useMemo(
    () => normalizeDraftBillingData(draftBillingData),
    [draftBillingData]
  );

  const draftDiscountBase = useMemo(() => {
    return roundCurrency(
      safeNumber(normalizedPersistedBilling.existingBalance) +
        safeNumber(normalizedDraftBilling.subtotal)
    );
  }, [
    normalizedPersistedBilling.existingBalance,
    normalizedDraftBilling.subtotal,
  ]);

  const draftBillingView = useMemo<NormalizedBillingView>(() => {
    const persisted = normalizedPersistedBilling;
    const draft = normalizedDraftBilling;

    const currentMethods = safeArray(paymentMethods).filter(
      (method) => safeNumber(method?.amount) > 0
    );

    const servicesSubtotal = roundCurrency(
      safeNumber(persisted.servicesSubtotal) + safeNumber(draft.subtotal)
    );

    const existingBalance = roundCurrency(safeNumber(persisted.existingBalance));
    const newItemsSubtotal = roundCurrency(safeNumber(draft.subtotal));

    const currentSessionSubtotal = roundCurrency(existingBalance + newItemsSubtotal);

    const discountSnapshot = computeDiscountSnapshot({
      subtotal: currentSessionSubtotal,
      discountType: discount?.type,
      discountValue: discount?.value,
    });

    const currentSessionDiscountAmount = roundCurrency(discountSnapshot.discountAmount);
    const currentSessionTaxableAmount = roundCurrency(
      Math.max(0, currentSessionSubtotal - currentSessionDiscountAmount)
    );

    const currentSessionTaxTotal = roundCurrency(safeNumber(draft.taxTotal));

    const amountDueBeforeCurrentPayment = roundCurrency(
      currentSessionTaxableAmount + currentSessionTaxTotal
    );

    const newItemsDiscountAmount = roundCurrency(currentSessionDiscountAmount);
    const newItemsTaxableAmount = roundCurrency(currentSessionTaxableAmount);
    const newItemsTaxTotal = roundCurrency(currentSessionTaxTotal);
    const newItemsGrandTotal = roundCurrency(amountDueBeforeCurrentPayment);

    const totalPaidFromMethods = roundCurrency(
      currentMethods.reduce((sum, method) => sum + safeNumber(method?.amount), 0)
    );

    const cashTendered = roundCurrency(
      currentMethods
        .filter((method) => method?.type === 'cash')
        .reduce((sum, method) => sum + safeNumber(method?.amount), 0)
    );

    const nonCashTotal = roundCurrency(
      currentMethods
        .filter((method) => method?.type !== 'cash')
        .reduce((sum, method) => sum + safeNumber(method?.amount), 0)
    );

    const remainingAfterNonCash = roundCurrency(
      Math.max(0, amountDueBeforeCurrentPayment - nonCashTotal)
    );

    const changeAmount = roundCurrency(
      Math.max(0, cashTendered - remainingAfterNonCash)
    );

    const currentNetPaid = roundCurrency(totalPaidFromMethods - changeAmount);

    const balanceDue = roundCurrency(
      Math.max(0, amountDueBeforeCurrentPayment - currentNetPaid)
    );

    const paymentStatus = getPaymentStatusFromNumbers({
      amountDueBeforePayment: amountDueBeforeCurrentPayment,
      netPaid: currentNetPaid,
      balanceDue,
    });

    const billingData: ReceiptBillingDataShape = {
      servicesSubtotal,
      existingBalance,
      newItemsSubtotal,
      newItemsDiscountAmount,
      newItemsTaxableAmount,
      newItemsTaxTotal,
      newItemsGrandTotal,

      subtotal: currentSessionSubtotal,
      discountAmount: currentSessionDiscountAmount,
      discountValue: roundCurrency(discountSnapshot.rawDiscountValue),
      discountType: discountSnapshot.discountType,
      taxableAmount: currentSessionTaxableAmount,
      taxTotal: currentSessionTaxTotal,
      grandTotal: amountDueBeforeCurrentPayment,
      totalPaid: currentNetPaid,
      balance: balanceDue,
      taxes: draft.taxes,
    };

    const combinedNotes = [
      backendBillingMeta?.receiptNumber
        ? `Existing Receipt: ${backendBillingMeta.receiptNumber}`
        : null,
      additionalNotes || null,
    ]
      .filter(Boolean)
      .join('\n');

    const transaction: ReceiptTransactionShape = {
      receipt_number: receiptNumber || backendBillingMeta?.receiptNumber || null,
      patient_name: activeVisit?.patient?.name || activePatient?.name || 'Unknown Patient',
      patient_number:
        activeVisit?.patient?.patient_number ||
        activePatient?.patient_number ||
        'N/A',
      created_at: new Date().toISOString(),
      charge_items: safeArray(renderableChargeItems),
      billing_data: billingData,
      payment_methods: currentMethods,
      additional_notes: combinedNotes || undefined,
      facilityData,
      payment_status: paymentStatus,
      billing_status: status,
      attending_staff_display: backendBillingMeta?.attendingStaffDisplay || null,
      attending_staff_name: backendBillingMeta?.attendingStaffName || null,
      attending_staff_role: backendBillingMeta?.attendingStaffRole || null,
    };

    const derivedFinancials: DerivedFinancials = {
      status: paymentStatus,
      refunded: 0,
      netPaid: currentNetPaid,
      balanceDue,
      grandTotal: amountDueBeforeCurrentPayment,
      subtotal: currentSessionSubtotal,
      discountAmount: currentSessionDiscountAmount,
      discountPercent: discountSnapshot.discountPercent,
      discountType: discountSnapshot.discountType,
      taxTotal: currentSessionTaxTotal,
      totalPaidFromMethods,
      cashTendered,
      changeAmount,
      hasCashPayment: cashTendered > 0,
      nonCashTotal,
    };

    return {
      transaction,
      derivedFinancials,
      cashBreakdown: buildCashBreakdown(cashTendered, changeAmount),
      billingData,
    };
  }, [
    normalizedPersistedBilling,
    normalizedDraftBilling,
    paymentMethods,
    backendBillingMeta,
    additionalNotes,
    receiptNumber,
    activeVisit,
    activePatient,
    renderableChargeItems,
    facilityData,
    status,
    discount,
  ]);

  const serverBillingView = useMemo<NormalizedBillingView | null>(() => {
    if (!serverBillingItem) return null;
    return normalizeServerBillingItem(serverBillingItem, status, facilityData);
  }, [serverBillingItem, status, facilityData]);

  const activeBillingView = serverBillingView ?? draftBillingView;

  const cashChangeByIndex = useMemo(() => {
    const result: Record<number, { dueBefore: number; change: number }> = {};

    if (isServerMode) return result;

    const currentMethods = safeArray(paymentMethods);
    const dueBeforeAnyPayment = roundCurrency(draftBillingView.billingData.grandTotal);

    currentMethods.forEach((method, index) => {
      if (method?.type !== 'cash') return;

      const otherPaymentsTotal = roundCurrency(
        currentMethods.reduce((sum, currentMethod, i) => {
          if (i === index) return sum;
          return sum + safeNumber(currentMethod?.amount);
        }, 0)
      );

      const dueBefore = roundCurrency(
        Math.max(0, dueBeforeAnyPayment - otherPaymentsTotal)
      );

      const tendered = roundCurrency(safeNumber(method?.amount));
      const change = roundCurrency(Math.max(0, tendered - dueBefore));

      result[index] = { dueBefore, change };
    });

    return result;
  }, [
    paymentMethods,
    draftBillingView.billingData.grandTotal,
    isServerMode,
  ]);

  const colors = useMemo(
    () => getBillingSummaryColors(theme === 'dark'),
    [theme]
  );

  const canFinalize =
    !isProcessing &&
    !isSubmitting &&
    !isReadOnly &&
    hasAnyBillableContext &&
    activeBillingView.derivedFinancials.netPaid > 0 &&
    hasRequiredIds;

  const canPrint =
    (isFinalized || isServerMode) &&
    (!!receiptNumber || !!serverBillingItem?.receipt_number) &&
    !isProcessing &&
    !isSubmitting;

  const shouldHideDiscountControls =
    isServerMode && safeNumber(activeBillingView.billingData.totalPaid) > 0;

  const getDisplayAmount = (index: number, amount: number) => {
    const isFocused = focusedAmountInputs[index];
    const isZero = amount === 0;
    return !isFocused && isZero ? '' : String(amount);
  };

  return {
    normalizedPersistedBilling,
    normalizedDraftBilling,
    draftDiscountBase,
    draftBillingView,
    serverBillingView,
    activeBillingView,
    cashChangeByIndex,
    colors,
    canFinalize,
    canPrint,
    shouldHideDiscountControls,
    getDisplayAmount,
  };
};
