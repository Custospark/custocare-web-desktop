import {
  setDiscount,
  setPaymentMethods,
  setAdditionalNotes,
  setProcessing,
} from '../billingSlice';

import type { PaymentMethod as ReduxPaymentMethod } from '../billing-types';
import type { BillingSubmissionPayload } from '../../../../api/billable-items/BillingItemsTypes';
import {
  DiscountType,
  type PaymentMethod,
} from '../../../../api/billing-review/BillingReviewTypes';

import {
  clamp,
  onlyDigits,
  roundCurrency,
  safeArray,
  safeNumber,
} from './helpers';

interface UseBillingSummaryActionsParams {
  dispatch: any;
  isReadOnly: boolean;
  canFinalize: boolean;
  hasRequiredIds: boolean;
  visitId?: number | null;
  patientId?: number | null;
  status: 'draft' | 'ready' | 'settled';
  discount: any;
  setLocalDiscount: React.Dispatch<React.SetStateAction<any>>;
  discountInputValue: string;
  setDiscountInputValue: React.Dispatch<React.SetStateAction<string>>;
  draftDiscountBase: number;
  paymentMethods: PaymentMethod[];
  setLocalPaymentMethods: React.Dispatch<React.SetStateAction<PaymentMethod[]>>;
  additionalNotes: string;
  setLocalAdditionalNotes: React.Dispatch<React.SetStateAction<string>>;
  focusedAmountInputs: Record<number, boolean>;
  setFocusedAmountInputs: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
  draftBillingView: any;
  activeBillingView: any;
  draftChargeItems: any[];
  submitBilling: (payload: BillingSubmissionPayload) => void;
}

export const useBillingSummaryActions = ({
  dispatch,
  isReadOnly,
  canFinalize,
  hasRequiredIds,
  visitId,
  patientId,
  status,
  discount,
  setLocalDiscount,
  discountInputValue,
  setDiscountInputValue,
  draftDiscountBase,
  paymentMethods,
  setLocalPaymentMethods,
  additionalNotes,
  setLocalAdditionalNotes,
  focusedAmountInputs,
  setFocusedAmountInputs,
  draftBillingView,
  activeBillingView,
  draftChargeItems,
  submitBilling,
}: UseBillingSummaryActionsParams) => {
  const handleDiscountValueChange = (rawValue: string) => {
    if (isReadOnly) return;

    setDiscountInputValue(rawValue);

    if (rawValue.trim() === '') {
      const clearedDiscount = {
        ...discount,
        value: 0,
      };

      setLocalDiscount(clearedDiscount);
      dispatch(setDiscount(clearedDiscount));
      return;
    }

    const numericValue = safeNumber(rawValue, 0);
    const maxValue = discount.type === 'percentage' ? 100 : draftDiscountBase;
    const clampedValue = roundCurrency(clamp(numericValue, 0, maxValue));

    const updatedDiscount = {
      ...discount,
      value: clampedValue,
    };

    setLocalDiscount(updatedDiscount);
    dispatch(setDiscount(updatedDiscount));
  };

  const handleDiscountTypeChange = (type: 'percentage' | 'fixed') => {
    if (isReadOnly) return;

    const currentRawValue = discountInputValue.trim();
    const numericValue = currentRawValue === '' ? 0 : safeNumber(currentRawValue, 0);
    const maxValue = type === 'percentage' ? 100 : draftDiscountBase;
    const clampedValue = roundCurrency(clamp(numericValue, 0, maxValue));

    const updatedDiscount = {
      ...discount,
      type,
      value: clampedValue,
    };

    setLocalDiscount(updatedDiscount);
    setDiscountInputValue(clampedValue > 0 ? String(clampedValue) : '');
    dispatch(setDiscount(updatedDiscount));
  };

  const syncPaymentMethodsToRedux = (updatedMethods: PaymentMethod[]) => {
    if (isReadOnly) return;

    setLocalPaymentMethods(updatedMethods);
    dispatch(
      setPaymentMethods(updatedMethods as ReduxPaymentMethod[])
    );
  };

  const handlePaymentTypeChange = (index: number, newType: string) => {
    if (isReadOnly) return;

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = {
      ...updatedMethods[index],
      type: newType as PaymentMethod['type'],
      details: updatedMethods[index]?.details || '',
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handlePaymentAmountChange = (index: number, rawValue: string) => {
    if (isReadOnly) return;

    const numericValue = Number(rawValue);
    const updatedMethods = [...paymentMethods];

    updatedMethods[index] = {
      ...updatedMethods[index],
      amount: Number.isFinite(numericValue)
        ? roundCurrency(Math.max(0, numericValue))
        : 0,
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAutoFillRemaining = (index: number) => {
    if (isReadOnly) return;

    const dueBeforeAnyPayment = roundCurrency(draftBillingView.billingData.grandTotal);

    const otherPaymentsTotal = paymentMethods.reduce(
      (sum, method, i) => (i === index ? sum : sum + safeNumber(method?.amount)),
      0
    );

    const remainingBalance = roundCurrency(
      Math.max(0, dueBeforeAnyPayment - otherPaymentsTotal)
    );

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = {
      ...updatedMethods[index],
      amount: remainingBalance,
    };

    setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleAddPaymentMethod = () => {
    if (isReadOnly || paymentMethods.length >= 3) return;

    const updatedMethods = [
      ...paymentMethods,
      { type: 'cash' as const, amount: 0, details: '' },
    ];

    setFocusedAmountInputs((prev) => ({
      ...prev,
      [updatedMethods.length - 1]: false,
    }));

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleRemovePaymentMethod = (index: number) => {
    if (isReadOnly || paymentMethods.length <= 1) return;

    const updatedMethods = paymentMethods.filter((_, i) => i !== index);
    const updatedFocusState: Record<number, boolean> = {};

    updatedMethods.forEach((_, i) => {
      updatedFocusState[i] = focusedAmountInputs[i] ?? false;
    });

    setFocusedAmountInputs(updatedFocusState);
    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleMobilePhoneChange = (index: number, rawValue: string) => {
    if (isReadOnly) return;

    const updatedMethods = [...paymentMethods];
    updatedMethods[index] = {
      ...updatedMethods[index],
      details: onlyDigits(rawValue),
    };

    syncPaymentMethodsToRedux(updatedMethods);
  };

  const handleInitiateMobilePayment = async (index: number) => {
    if (isReadOnly) return;

    const method = paymentMethods[index];
    if (method?.type !== 'mobile') return;

    const phoneNumber = (method?.details || '').trim();
    if (phoneNumber.length < 9) {
      alert('Please enter a valid phone number for Mobile Money payment.');
      return;
    }

    dispatch(setProcessing(true));
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      alert(`Payment request initiated to ${phoneNumber} (simulated).`);
    } finally {
      dispatch(setProcessing(false));
    }
  };

  const handleAdditionalNotesChange = (notes: string) => {
    if (isReadOnly) return;
    setLocalAdditionalNotes(notes);
    dispatch(setAdditionalNotes(notes));
  };

  const handleFinalizePayment = async () => {
    if (!canFinalize) {
      if (!hasRequiredIds) {
        alert('Unable to finalize billing. Visit or patient information is missing.');
        return;
      }

      if (activeBillingView.derivedFinancials.netPaid <= 0) {
        alert('Enter a payment amount greater than zero before finalizing.');
        return;
      }

      return;
    }

    if (visitId == null || patientId == null) return;

    dispatch(setProcessing(true));

    try {
      const currentPaymentStatus = activeBillingView.derivedFinancials.status;
      const effectiveDiscountType = activeBillingView.billingData.discountType;
      const effectiveDiscountValue = roundCurrency(
        safeNumber(activeBillingView.billingData.discountValue)
      );
      const exactDiscountAmount = roundCurrency(
        safeNumber(activeBillingView.billingData.discountAmount)
      );

      const billingDataSnapshot = {
        subtotal: roundCurrency(activeBillingView.billingData.subtotal),
        discountAmount: exactDiscountAmount,
        taxableAmount: roundCurrency(activeBillingView.billingData.taxableAmount),
        taxTotal: roundCurrency(activeBillingView.billingData.taxTotal),
        grandTotal: roundCurrency(activeBillingView.billingData.grandTotal),
        totalPaid: roundCurrency(activeBillingView.derivedFinancials.netPaid),
        balance: roundCurrency(activeBillingView.derivedFinancials.balanceDue),
        discountType: effectiveDiscountType,
        discountValue: effectiveDiscountValue,
      } as BillingSubmissionPayload['billing_data'];

      // Build discount object only if value is valid and non-zero
      let discountPayload = undefined;
      const hasActiveDiscount = effectiveDiscountValue !== undefined &&
                                effectiveDiscountValue !== null &&
                                effectiveDiscountValue !== 0;

      if (hasActiveDiscount) {
        discountPayload = {
          type: effectiveDiscountType === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXED,
          value: effectiveDiscountValue,
          reason: discount.reason || additionalNotes || undefined,
        };
      }

      const payload: BillingSubmissionPayload = {
        visit_id: visitId,
        patient_id: patientId,
        charge_items: safeArray(draftChargeItems).map((item) => ({
          service_key: item.serviceKey,
          service: {
            id: item.service.id,
            code: item.service.code,
            name: item.service.name.toUpperCase(),
            unitPrice: item.service.unitPrice,
            category: item.service.category,
          },
          quantity: item.quantity,
          totalAmount: roundCurrency(item.totalAmount),
        })),
        taxes: safeArray(activeBillingView.billingData?.taxes).map((tax: any) => ({
          name: tax.name,
          rate: roundCurrency(safeNumber(tax.rate)),
          amount: roundCurrency(safeNumber(tax.amount)),
        })),
        payment_methods: safeArray(paymentMethods)
          .filter((method) => safeNumber(method?.amount) > 0)
          .map((method) => ({
            type: method.type as 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed',
            amount: roundCurrency(safeNumber(method.amount)),
            reference: method.details || undefined,
            details: method.details || undefined,
          })),
        billing_data: billingDataSnapshot,
        additional_notes: additionalNotes || undefined,
        status,
        payment_status: currentPaymentStatus,
      };

      // Only add discount if it exists
      if (discountPayload) {
        payload.discount = discountPayload;
      }

      submitBilling(payload);
    } catch (error) {
      console.error('Payment processing failed:', error);
      dispatch(setProcessing(false));
    }
  };

  const handleFocusAmountInput = (index: number) => {
    if (isReadOnly) return;

    if (!focusedAmountInputs[index]) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: true }));
    }
  };

  const handleBlurAmountInput = (index: number) => {
    if (isReadOnly) return;

    if (paymentMethods[index]?.amount === 0) {
      setFocusedAmountInputs((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleDiscountFocus = () => {
    if (safeNumber(discount.value) === 0 && discountInputValue === '') {
      setDiscountInputValue('');
    }
  };

  return {
    handleDiscountValueChange,
    handleDiscountTypeChange,
    handlePaymentTypeChange,
    handlePaymentAmountChange,
    handleAutoFillRemaining,
    handleAddPaymentMethod,
    handleRemovePaymentMethod,
    handleMobilePhoneChange,
    handleInitiateMobilePayment,
    handleAdditionalNotesChange,
    handleFinalizePayment,
    handleFocusAmountInput,
    handleBlurAmountInput,
    handleDiscountFocus,
  };
};
