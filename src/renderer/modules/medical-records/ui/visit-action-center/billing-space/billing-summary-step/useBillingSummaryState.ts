import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  clearDraftAfterFinalization,
  finalizePayment,
  selectBackendBillingData,
  selectBackendBillingMeta,
  selectBackendChargeItems,
  selectBilling,
  selectBillingData,
  selectCurrentStep,
  selectDraftChargeItems,
  selectEffectiveBillingStatus,
  selectIsProcessing,
  selectRenderableChargeItems,
  setProcessing,
  setStep,
} from '../billingSlice';

import {
  DEFAULT_DISCOUNT,
  DEFAULT_PAYMENT_METHODS,
} from '../billing-types';

import {
  selectActivePatient,
  selectActiveVisit,
  selectActiveVisitId,
} from '../../../../../../app/store/slices/visitSlice';

import { useSubmitBilling } from '../../../../api/billable-items/BillableItemsQueries';
import { useGetBillingByVisitForFacility } from '../../../../api/billing-review/BillingReviewQueries';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';

import type {
  BillingReviewItem,
  PaymentMethod,
} from '../../../../api/billing-review/BillingReviewTypes';

import { computeDiscountSnapshot, getPaymentStatusFromNumbers, roundCurrency, safeArray, safeNumber, buildCashBreakdown } from './helpers';
import { normalizeBackendBillingData, normalizeDraftBillingData, normalizeServerBillingItem } from './normalizers';
import type { BillingSummaryStepProps, NormalizedBillingView, ReceiptBillingDataShape, ReceiptTransactionShape } from './types';

export const useBillingSummaryState = ({
  visitId: propVisitId,
  patientId: propPatientId,
}: BillingSummaryStepProps) => {
  const dispatch = useDispatch();

  const activeVisit = useSelector(selectActiveVisit);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatient = useSelector(selectActivePatient);
  const currentStep = useSelector(selectCurrentStep);

  const draftChargeItems = useSelector(selectDraftChargeItems);
  const renderableChargeItems = useSelector(selectRenderableChargeItems);
  const backendChargeItems = useSelector(selectBackendChargeItems);
  const draftBillingData = useSelector(selectBillingData);
  const backendBillingData = useSelector(selectBackendBillingData);
  const backendBillingMeta = useSelector(selectBackendBillingMeta);
  const billingState = useSelector(selectBilling);

  const status = useSelector(selectEffectiveBillingStatus);
  const isProcessing = useSelector(selectIsProcessing);

  const { data: facilityData } = useGetFacilityIdentity();

  const resolvedVisitId = propVisitId ?? activeVisitId ?? activeVisit?.visit_id;
  const resolvedPatientId = propPatientId ?? activeVisit?.patient_id;

  const visitId = resolvedVisitId;
  const patientId = resolvedPatientId;

  const isReadOnly = status === 'settled';
  const isFinalized = status === 'settled';

  const [discount, setLocalDiscount] = useState(DEFAULT_DISCOUNT);
  const [discountInputValue, setDiscountInputValue] = useState(
    DEFAULT_DISCOUNT.value > 0 ? String(DEFAULT_DISCOUNT.value) : ''
  );
  const [paymentMethods, setLocalPaymentMethods] =
    useState<PaymentMethod[]>(DEFAULT_PAYMENT_METHODS);
  const [additionalNotes, setLocalAdditionalNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [focusedAmountInputs, setFocusedAmountInputs] = useState<Record<number, boolean>>({});

  const [serverBillingItem, setServerBillingItem] = useState<BillingReviewItem | null>(null);
  const [shouldFetchAfterFinalization, setShouldFetchAfterFinalization] = useState(false);

  const hasRequiredIds = visitId != null && patientId != null;
  const hasPersistedBalance = safeNumber(backendBillingData?.balance) > 0;
  const hasPersistedGrandTotal = safeNumber(backendBillingData?.grandTotal) > 0;
  const hasDraftItems = safeArray(draftChargeItems).length > 0;
  const hasAnyBillableContext =
    hasPersistedBalance || hasPersistedGrandTotal || hasDraftItems;

  const isServerMode = !!serverBillingItem;

  useEffect(() => {
    if (status === 'settled' && currentStep !== 'billing_summary') {
      dispatch(setStep('billing_summary'));
    }
  }, [status, currentStep, dispatch]);

  const {
    data: fetchedVisitBillingData,
    isSuccess: isBillingFetchSuccess,
    isLoading: isBillingFetchLoading,
  } = useGetBillingByVisitForFacility(
    shouldFetchAfterFinalization ? (visitId ?? null) : null,
    {
      enabled: shouldFetchAfterFinalization && !!visitId,
    }
  );

  const { mutate: submitBilling, isPending: isSubmitting } = useSubmitBilling({
    onSuccess: (response) => {
      const generatedReceiptNumber =
        response?.data?.receipt_number ?? `REC-${Date.now().toString().slice(-8)}`;

      setReceiptNumber(generatedReceiptNumber);
      dispatch(finalizePayment());
      dispatch(setProcessing(false));
      setShouldFetchAfterFinalization(true);
    },
    onError: (error) => {
      dispatch(setProcessing(false));
      console.error('Failed to finalize billing:', error);
    },
  });

  useEffect(() => {
    const items = fetchedVisitBillingData?.data?.items;
    const hasValidData =
      isBillingFetchSuccess && Array.isArray(items) && items.length > 0;

    if (!hasValidData) return;

    const authoritativeBillingItem = items[0];
    if (!authoritativeBillingItem) return;

    setServerBillingItem(authoritativeBillingItem);
    setReceiptNumber(
      (authoritativeBillingItem as any)?.receipt_number ||
        receiptNumber ||
        `REC-${Date.now().toString().slice(-8)}`
    );
    setShouldFetchAfterFinalization(false);

    dispatch(clearDraftAfterFinalization());
  }, [isBillingFetchSuccess, fetchedVisitBillingData, dispatch, receiptNumber]);

  useEffect(() => {
    const nextDiscount = billingState?.discount || DEFAULT_DISCOUNT;

    setLocalDiscount(nextDiscount);
    setDiscountInputValue(
      safeNumber(nextDiscount?.value) > 0 ? String(nextDiscount.value) : ''
    );

    setLocalPaymentMethods(
      billingState?.paymentMethods?.length
        ? (billingState.paymentMethods as PaymentMethod[])
        : DEFAULT_PAYMENT_METHODS
    );

    setLocalAdditionalNotes(billingState?.additionalNotes || '');
  }, [billingState?.discount, billingState?.paymentMethods, billingState?.additionalNotes]);

  useEffect(() => {
    if (status === 'settled' && !receiptNumber) {
      setReceiptNumber(`REC-${Date.now().toString().slice(-8)}`);
    }
  }, [status, receiptNumber]);

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

    return {
      transaction,
      derivedFinancials: {
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
      },
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

  const shouldHideDiscountControls =
    isServerMode && safeNumber(activeBillingView.billingData.totalPaid) > 0;

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

  return {
    activeVisit,
    activePatient,
    draftChargeItems,
    backendBillingMeta,
    status,
    isProcessing,
    isSubmitting,
    isBillingFetchLoading,

    visitId,
    patientId,
    hasRequiredIds,
    hasAnyBillableContext,
    isReadOnly,
    isFinalized,
    isServerMode,

    discount,
    setLocalDiscount,
    discountInputValue,
    setDiscountInputValue,
    draftDiscountBase,

    paymentMethods,
    setLocalPaymentMethods,
    additionalNotes,
    setLocalAdditionalNotes,
    receiptNumber,
    setReceiptNumber,
    focusedAmountInputs,
    setFocusedAmountInputs,

    serverBillingItem,
    activeBillingView,
    cashChangeByIndex,
    shouldHideDiscountControls,

    canFinalize,
    canPrint,

    submitBilling,
  };
};
