import { useCallback, useEffect, useState } from 'react';
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
import { PaymentStatus } from '../../../../api/billing-review/BillingReviewTypes';

import { safeArray, safeNumber } from './helpers';
import type { BillingSummaryStepProps } from './types';

interface UseBillingSummaryControllerParams {
  visitId?: BillingSummaryStepProps['visitId'];
  patientId?: BillingSummaryStepProps['patientId'];
}

type SliceBillingStatus = 'pending' | 'settled';

const deriveSliceBillingStatus = (item: BillingReviewItem | null): SliceBillingStatus => {
  if (!item) return 'pending';

  if (
    item.payment_status === PaymentStatus.PAID_IN_FULL ||
    item.billing_data?.isPaid ||
    safeNumber(item.billing_data?.balance) <= 0
  ) {
    return 'settled';
  }

  return 'pending';
};

/**
 * Adapts BillingReviewItem into the payload shape expected by hydrateBackendBilling.
 * This mirrors the persisted-billing shape used by charge entry.
 */
const mapBillingReviewItemToHydrationPayload = (
  item: BillingReviewItem | null,
  visitId: string
) => {
  if (!item || !item.has_billing) {
    return {
      has_billing: false,
      visit_id: visitId,
      status: 'pending' as SliceBillingStatus,
      items: [],
      billing: null,
    };
  }

  const mappedItems = safeArray(item.charge_items).map((chargeItem) => {
    const unitPrice = safeNumber(chargeItem?.service?.unitPrice);
    const quantity = safeNumber(chargeItem?.quantity) || 1;
    const totalAmount =
      safeNumber(chargeItem?.totalAmount) || unitPrice * quantity;

    return {
      line_item_id: String(chargeItem.id),
      service_key: chargeItem.service_key,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      service: {
        id: chargeItem.service.id,
        code: chargeItem.service.code,
        name: chargeItem.service.name,
        unitPrice,
        category: chargeItem.service.category,
      },
      permissions: {
        can_increase: true,
        can_decrease: true,
        can_remove: true,
        requires_reason: false,
      },
    };
  });

  return {
    has_billing: item.has_billing,
    visit_id: item.visit_id,
    status: deriveSliceBillingStatus(item),
    items: mappedItems,
    billing: {
      subtotal: safeNumber(item.billing_data?.subtotal),
      discount_amount: safeNumber(item.billing_data?.discountAmount),
      taxable_amount: safeNumber(item.billing_data?.taxableAmount),
      taxes: safeArray(item.taxes),
      tax_total: safeNumber(item.billing_data?.taxTotal),
      grand_total: safeNumber(item.billing_data?.grandTotal),
      amount_paid: safeNumber(item.billing_data?.totalPaid),
      balance: safeNumber(item.billing_data?.balance),
      is_paid: !!item.billing_data?.isPaid,
      receipt_number: item.receipt_number ?? '',
      notes: item.additional_notes ?? '',
      payment_methods: safeArray(item.payment_methods),
      discount: item.discount,
      billing_cycle_id: item.billing_cycle_id,
      billing_cycle_uuid: item.billing_cycle_uuid,
      payment_status: item.payment_status,
      billing_status: item.billing_status,
      billed_at: item.billed_at,
      updated_at: item.updated_at,
      last_updated: item.last_updated,
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
   * This pair replaces the fragile "enabled boolean only" pattern.
   *
   * - shouldFetchAfterFinalization tells us a post-submit sync is pending
   * - postSubmitFetchNonce guarantees each successful submit creates a fresh fetch cycle
   */
  const [shouldFetchAfterFinalization, setShouldFetchAfterFinalization] = useState(false);
  const [postSubmitFetchNonce, setPostSubmitFetchNonce] = useState(0);

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
   * Keep the hook mounted, but disable automatic fetching on mount.
   * We trigger it ourselves automatically after successful billing submit.
   */
  const {
    data: fetchedVisitBillingData,
    isSuccess: isBillingFetchSuccess,
    isLoading: isBillingFetchLoading,
    refetch: refetchBillingAfterSubmit,
  } = useGetBillingByVisitForFacility(visitId ?? null, {
    enabled: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const hydrateBillingSliceFromReviewItem = useCallback((item: BillingReviewItem | null) => {
    if (!visitIdString) {
      dispatch(clearBackendBilling());
      return;
    }

    const payload = mapBillingReviewItemToHydrationPayload(item, visitIdString);

    if (payload.has_billing) {
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
  }, [dispatch, visitIdString]);

  const { mutate: submitBilling, isPending: isSubmitting } = useSubmitBilling({
    onSuccess: (response) => {
      const generatedReceiptNumber =
        response?.data?.receipt_number ?? `REC-${Date.now().toString().slice(-8)}`;

      setReceiptNumber(generatedReceiptNumber);

      /**
       * Automatic post-submit sync trigger.
       * The nonce guarantees a brand new fetch cycle every successful submit.
       */
      setShouldFetchAfterFinalization(true);
      setPostSubmitFetchNonce((prev) => prev + 1);
    },
    onError: (error) => {
      dispatch(setProcessing(false));
      console.error('Failed to finalize billing:', error);
    },
  });

  /**
   * Automatic post-submit facility fetch.
   *
   * Why this is more reliable than relying on `enabled` alone:
   * - it runs after every successful submit
   * - it does not depend on "true -> true" state transitions
   * - it avoids missing the request when payment completion causes rapid UI changes
   */
  useEffect(() => {
    if (!shouldFetchAfterFinalization) return;
    if (postSubmitFetchNonce === 0) return;

    if (!visitId) {
      dispatch(clearDraftAfterFinalization());
      dispatch(finalizePayment());
      dispatch(setProcessing(false));
      setShouldFetchAfterFinalization(false);
      return;
    }

    let cancelled = false;

    const runPostSubmitBillingRefresh = async () => {
      try {
        const result = await refetchBillingAfterSubmit();

        if (cancelled) return;

        const items = result.data?.data?.items;
        const authoritativeBillingItem =
          Array.isArray(items) && items.length > 0 ? items[0] : null;

        setServerBillingItem(authoritativeBillingItem);

        if (authoritativeBillingItem?.receipt_number) {
          setReceiptNumber(authoritativeBillingItem.receipt_number);
        }

        hydrateBillingSliceFromReviewItem(authoritativeBillingItem);
      } catch (error) {
        if (cancelled) return;

        console.error(
          'Billing submit succeeded, but post-submit billing fetch failed:',
          error
        );
      } finally {
        if (cancelled) return;

        dispatch(clearDraftAfterFinalization());
        dispatch(finalizePayment());
        dispatch(setProcessing(false));
        setShouldFetchAfterFinalization(false);
      }
    };

    void runPostSubmitBillingRefresh();

    return () => {
      cancelled = true;
    };
  }, [
    shouldFetchAfterFinalization,
    postSubmitFetchNonce,
    visitId,
    refetchBillingAfterSubmit,
    dispatch,
    hydrateBillingSliceFromReviewItem,
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
