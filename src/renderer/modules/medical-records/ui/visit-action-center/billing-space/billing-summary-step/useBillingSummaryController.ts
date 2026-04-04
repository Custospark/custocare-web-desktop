import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  finalizePayment,
  clearDraftAfterFinalization,
  selectDraftChargeItems,
  selectRenderableChargeItems,
  selectBackendChargeItems,
  selectEffectiveBillingStatus,
  selectIsProcessing,
  selectBillingData,
  selectBilling,
  selectBackendBillingMeta,
  selectBackendBillingData,
  selectCurrentStep,
  setProcessing,
  setStep,
} from '../billingSlice';

import {
  DEFAULT_DISCOUNT,
  DEFAULT_PAYMENT_METHODS,
} from '../billing-types';

import {
  selectActiveVisitId,
  selectActivePatient,
  selectActiveVisit,
} from '../../../../../../app/store/slices/visitSlice';

import { useSubmitBilling } from '../../../../api/billable-items/BillableItemsQueries';
import { useGetBillingByVisitForFacility } from '../../../../api/billing-review/BillingReviewQueries';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';

import type { BillingReviewItem, PaymentMethod } from '../../../../api/billing-review/BillingReviewTypes';
import { safeArray, safeNumber } from './helpers';
import type { BillingSummaryStepProps } from './types';

interface UseBillingSummaryControllerParams {
  visitId?: BillingSummaryStepProps['visitId'];
  patientId?: BillingSummaryStepProps['patientId'];
}

export const useBillingSummaryController = ({
  visitId: propVisitId,
  patientId: propPatientId,
}: UseBillingSummaryControllerParams) => {
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
    console.log("Items");
    console.log(items);
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

  return {
    dispatch,
    activeVisit,
    activeVisitId,
    activePatient,
    currentStep,
    draftChargeItems,
    renderableChargeItems,
    backendChargeItems,
    draftBillingData,
    backendBillingData,
    backendBillingMeta,
    billingState,
    status,
    isProcessing,
    facilityData,
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
    paymentMethods,
    setLocalPaymentMethods,
    additionalNotes,
    setLocalAdditionalNotes,
    receiptNumber,
    setReceiptNumber,
    focusedAmountInputs,
    setFocusedAmountInputs,
    serverBillingItem,
    setServerBillingItem,
    shouldFetchAfterFinalization,
    setShouldFetchAfterFinalization,
    fetchedVisitBillingData,
    isBillingFetchSuccess,
    isBillingFetchLoading,
    submitBilling,
    isSubmitting,
  };
};
