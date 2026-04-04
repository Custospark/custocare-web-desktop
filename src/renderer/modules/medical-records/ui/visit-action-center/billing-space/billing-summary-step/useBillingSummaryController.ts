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
  hydrateBackendBilling,
  clearBackendBilling,
  setBillingDataLoaded,
  clearBillingDataLoaded,
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

import type {
  BillingReviewItem,
  PaymentMethod,
} from '../../../../api/billing-review/BillingReviewTypes';
import { safeArray, safeNumber } from './helpers';
import type { BillingSummaryStepProps } from './types';

interface UseBillingSummaryControllerParams {
  visitId?: BillingSummaryStepProps['visitId'];
  patientId?: BillingSummaryStepProps['patientId'];
}

/**
 * Converts facility billing-review payload into the billing slice hydration shape.
 *
 * IMPORTANT:
 * If your facility response field names differ, only adjust this adapter.
 * The rest of the hook can stay unchanged.
 */
const buildHydrationPayloadFromFacilityBilling = (
  billingItem: BillingReviewItem | null,
  visitId: string
) => {
  if (!billingItem || !visitId) {
    return {
      has_billing: false,
      visit_id: visitId,
      status: 'pending',
      items: [],
      billing: null,
    };
  }

  const raw = billingItem as any;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];

  const normalizedItems = rawItems.map((item: any, index: number) => {
    const quantity = Number(item?.quantity ?? item?.qty ?? 1);
    const unitPrice = Number(item?.unit_price ?? item?.unitPrice ?? item?.price ?? 0);
    const totalAmount = Number(
      item?.total_amount ??
        item?.totalAmount ??
        item?.line_total ??
        item?.subtotal ??
        quantity * unitPrice
    );

    const serviceId =
      item?.service_id ??
      item?.billable_item_id ??
      item?.item_id ??
      item?.id ??
      null;

    const serviceCode = item?.code ?? item?.service_code ?? item?.item_code ?? '';
    const serviceName = item?.name ?? item?.service_name ?? item?.description ?? 'Unnamed item';
    const serviceCategory = item?.category ?? item?.service_category ?? '';

    return {
      line_item_id: String(item?.line_item_id ?? item?.lineItemId ?? item?.id ?? `line-${index}`),
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      source: 'backend',
      service: {
        id: serviceId,
        code: serviceCode,
        name: serviceName,
        category: serviceCategory,
        unitPrice,
      },
      permissions: {
        can_increase: item?.permissions?.can_increase ?? true,
        can_decrease: item?.permissions?.can_decrease ?? true,
        can_remove: item?.permissions?.can_remove ?? true,
        requires_reason: item?.permissions?.requires_reason ?? false,
      },
      audit: item?.audit
        ? {
            ...item.audit,
          }
        : undefined,
    };
  });

  const subtotal = Number(raw?.subtotal ?? raw?.sub_total ?? 0);
  const discountAmount = Number(raw?.discount_amount ?? raw?.discountAmount ?? 0);
  const grandTotal = Number(
    raw?.grand_total ?? raw?.grandTotal ?? raw?.total ?? subtotal - discountAmount
  );
  const amountPaid = Number(raw?.amount_paid ?? raw?.amountPaid ?? grandTotal);
  const balance = Number(raw?.balance ?? Math.max(grandTotal - amountPaid, 0));
  const status = raw?.status ?? (balance <= 0 ? 'settled' : 'pending');

  return {
    has_billing: true,
    visit_id: visitId,
    status,
    items: normalizedItems,
    billing: {
      subtotal,
      discount_amount: discountAmount,
      grand_total: grandTotal,
      amount_paid: amountPaid,
      balance,
      receipt_number: raw?.receipt_number ?? raw?.receiptNumber ?? '',
      notes: raw?.notes ?? raw?.additional_notes ?? '',
      payment_methods: Array.isArray(raw?.payment_methods)
        ? raw.payment_methods
        : Array.isArray(raw?.paymentMethods)
        ? raw.paymentMethods
        : [],
    },
  };
};

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

  const visitIdString = visitId != null ? String(visitId) : '';

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

  /**
   * This flag turns on the facility billing fetch only
   * after billing submission succeeds.
   */
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

  /**
   * Automatic post-submit fetch:
   * enabled only after submitBilling succeeds.
   */
  const {
    data: fetchedVisitBillingData,
    isSuccess: isBillingFetchSuccess,
    isLoading: isBillingFetchLoading,
    isError: isBillingFetchError,
    error: billingFetchError,
  } = useGetBillingByVisitForFacility(
    shouldFetchAfterFinalization ? (visitId ?? null) : null,
    {
      enabled: shouldFetchAfterFinalization && !!visitId,
      refetchOnWindowFocus: false,
      staleTime: 0,
    }
  );

  const hydrateBillingSliceFromFacilityItem = (billingItem: BillingReviewItem | null) => {
    if (!visitIdString) {
      dispatch(clearBackendBilling());
      return;
    }

    const payload = buildHydrationPayloadFromFacilityBilling(billingItem, visitIdString);

    if (payload?.has_billing) {
      dispatch(hydrateBackendBilling(payload as any));
    } else {
      dispatch(clearBackendBilling());
    }

    dispatch(
      setBillingDataLoaded({
        visitId: visitIdString,
        loaded: true,
      })
    );
  };

  const { mutate: submitBilling, isPending: isSubmitting } = useSubmitBilling({
    onSuccess: (response) => {
      const generatedReceiptNumber =
        response?.data?.receipt_number ?? `REC-${Date.now().toString().slice(-8)}`;

      setReceiptNumber(generatedReceiptNumber);

      /**
       * Do not finalize immediately.
       * First let the authoritative facility billing query run automatically,
       * then hydrate the slice from that response.
       */
      setShouldFetchAfterFinalization(true);
    },
    onError: (error) => {
      dispatch(setProcessing(false));
      console.error('Failed to finalize billing:', error);
    },
  });

  /**
   * When the automatic post-submit facility fetch succeeds:
   * - store authoritative billing item locally
   * - hydrate redux slice
   * - clear drafts
   * - finalize payment state
   * - stop processing
   */
  useEffect(() => {
    if (!shouldFetchAfterFinalization || !isBillingFetchSuccess) return;

    const items = fetchedVisitBillingData?.data?.items;
    const authoritativeBillingItem =
      Array.isArray(items) && items.length > 0 ? items[0] : null;

    setServerBillingItem(authoritativeBillingItem);

    if (authoritativeBillingItem) {
      const raw = authoritativeBillingItem as any;
      setReceiptNumber(
        raw?.receipt_number ||
          raw?.receiptNumber ||
          receiptNumber ||
          `REC-${Date.now().toString().slice(-8)}`
      );
    }

    hydrateBillingSliceFromFacilityItem(authoritativeBillingItem);

    dispatch(clearDraftAfterFinalization());
    dispatch(finalizePayment());
    dispatch(setProcessing(false));

    setShouldFetchAfterFinalization(false);
  }, [
    shouldFetchAfterFinalization,
    isBillingFetchSuccess,
    fetchedVisitBillingData,
    dispatch,
    receiptNumber,
  ]);

  /**
   * If submit succeeded but the automatic billing fetch fails,
   * stop processing so the UI does not hang.
   *
   * We still finalize payment because submission itself already succeeded.
   * The only failed step is the follow-up read.
   */
  useEffect(() => {
    if (!shouldFetchAfterFinalization || !isBillingFetchError) return;

    console.error('Billing submit succeeded, but post-submit facility fetch failed:', billingFetchError);

    dispatch(clearDraftAfterFinalization());
    dispatch(finalizePayment());
    dispatch(setProcessing(false));

    setShouldFetchAfterFinalization(false);
  }, [
    shouldFetchAfterFinalization,
    isBillingFetchError,
    billingFetchError,
    dispatch,
  ]);

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
  }, [
    billingState?.discount,
    billingState?.paymentMethods,
    billingState?.additionalNotes,
  ]);

  useEffect(() => {
    if (status === 'settled' && !receiptNumber) {
      setReceiptNumber(`REC-${Date.now().toString().slice(-8)}`);
    }
  }, [status, receiptNumber]);

  useEffect(() => {
    return () => {
      if (visitIdString) {
        dispatch(clearBillingDataLoaded(visitIdString));
      }
    };
  }, [dispatch, visitIdString]);

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
