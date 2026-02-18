// billingSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  type BillingState,
  INITIAL_BILLING_STATE,
  type ServiceItem,
  type ChargeItem,
  type Discount,
  type PaymentMethod,
  type BillingStep,
  generateChargeItemId,
  generateReceiptNumber,
  getDraftStorageKey,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_DISCOUNT,
  makeBillableKey,
} from './billing-types';

// Helper to check if state is dirty
const calculateIsDirty = (state: BillingState): boolean => {
  return (
    state.chargeItems.length > 0 ||
    state.discount.value > 0 ||
    state.paymentMethods.some((m) => m.amount > 0) ||
    state.additionalNotes.trim().length > 0 ||
    state.status !== 'draft'
  );
};

// Helper to update metadata
const updateMetadata = (state: BillingState) => {
  state.lastUpdated = Date.now();
  state.isDirty = calculateIsDirty(state);
};

const billingSlice = createSlice({
  name: 'billing',
  initialState: INITIAL_BILLING_STATE,
  reducers: {
    // UI Actions
    openTray: (
      state,
      action: PayloadAction<{ step?: BillingStep; visitId?: string; patientId?: string; patientName?: string }>
    ) => {
      state.trayOpen = true;
      state.currentStep = action.payload.step || 'charge_entry';

      if (action.payload.visitId) state.visitId = action.payload.visitId;
      if (action.payload.patientId) state.patientId = action.payload.patientId;
      if (action.payload.patientName) state.patientName = action.payload.patientName;

      updateMetadata(state);
    },

    closeTray: (state) => {
      state.trayOpen = false;
      updateMetadata(state);
    },

    setStep: (state, action: PayloadAction<BillingStep>) => {
      state.currentStep = action.payload;
      updateMetadata(state);
    },

    // Charge Items Actions
    addChargeItem: (state, action: PayloadAction<ServiceItem>) => {
      const service = action.payload;
      const serviceKey = makeBillableKey(service);

      // Merge by composite key (NOT numeric id)
      const existingItem = state.chargeItems.find((item) => item.serviceKey === serviceKey);

      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.totalAmount = existingItem.quantity * existingItem.service.unitPrice;
      } else {
        const newItem: ChargeItem = {
          id: generateChargeItemId(serviceKey),
          serviceKey,
          service,
          quantity: 1,
          totalAmount: service.unitPrice,
        };
        state.chargeItems.push(newItem);
      }

      if (state.chargeItems.length > 0 && state.status === 'draft') state.status = 'ready';

      updateMetadata(state);
    },

    increaseQuantity: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const item = state.chargeItems.find((x) => x.id === itemId);
      if (!item) return;

      item.quantity += 1;
      item.totalAmount = item.quantity * item.service.unitPrice;
      updateMetadata(state);
    },

    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const itemId = action.payload;
      const item = state.chargeItems.find((x) => x.id === itemId);
      if (!item) return;

      if (item.quantity === 1) {
        state.chargeItems = state.chargeItems.filter((x) => x.id !== itemId);
        if (state.chargeItems.length === 0) state.status = 'draft';
      } else {
        item.quantity -= 1;
        item.totalAmount = item.quantity * item.service.unitPrice;
      }

      updateMetadata(state);
    },

    removeChargeItem: (state, action: PayloadAction<string>) => {
      state.chargeItems = state.chargeItems.filter((item) => item.id !== action.payload);
      if (state.chargeItems.length === 0) state.status = 'draft';
      updateMetadata(state);
    },

    setQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const { itemId, quantity } = action.payload;
      const item = state.chargeItems.find((x) => x.id === itemId);
      if (!item) return;

      const q = Math.max(1, Math.min(9999, Math.floor(quantity || 1)));
      item.quantity = q;
      item.totalAmount = q * item.service.unitPrice;

      if (state.chargeItems.length === 0) state.status = 'draft';
      else if (state.status === 'draft') state.status = 'ready';

      updateMetadata(state);
    },

    clearCharges: (state) => {
      state.chargeItems = [];
      state.status = 'draft';
      updateMetadata(state);
    },

    // Discount Actions
    setDiscount: (state, action: PayloadAction<Discount>) => {
      state.discount = action.payload;
      updateMetadata(state);
    },

    // Payment Methods Actions
    setPaymentMethods: (state, action: PayloadAction<PaymentMethod[]>) => {
      state.paymentMethods = action.payload;
      updateMetadata(state);
    },

    updatePaymentMethod: (state, action: PayloadAction<{ index: number; method: Partial<PaymentMethod> }>) => {
      const { index, method } = action.payload;
      if (!state.paymentMethods[index]) return;

      state.paymentMethods[index] = { ...state.paymentMethods[index], ...method };
      updateMetadata(state);
    },

    addPaymentMethod: (state) => {
      if (state.paymentMethods.length < 3) {
        state.paymentMethods.push({ type: 'cash', amount: 0, details: '' });
        updateMetadata(state);
      }
    },

    removePaymentMethod: (state, action: PayloadAction<number>) => {
      if (state.paymentMethods.length > 1) {
        state.paymentMethods.splice(action.payload, 1);
        updateMetadata(state);
      }
    },

    // Other Actions
    setAdditionalNotes: (state, action: PayloadAction<string>) => {
      state.additionalNotes = action.payload;
      updateMetadata(state);
    },

    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
      updateMetadata(state);
    },

    finalizePayment: (state) => {
      state.receiptNumber = generateReceiptNumber();
      state.status = 'settled';
      updateMetadata(state);
    },

    printReceipt: (state) => {
      updateMetadata(state);
    },

    // Reset Actions
    resetBilling: (state) => {
      const { visitId, patientId, patientName } = state;
      Object.assign(state, { ...INITIAL_BILLING_STATE, visitId, patientId, patientName });
    },

    // Draft Actions
    saveDraft: (state) => {
      try {
        if (!state.visitId) return;

        const draft = {
          chargeItems: state.chargeItems,
          discount: state.discount,
          paymentMethods: state.paymentMethods,
          additionalNotes: state.additionalNotes,
          status: state.status,
          receiptNumber: state.receiptNumber,
          visitId: state.visitId,
          patientId: state.patientId,
          patientName: state.patientName,
          lastUpdated: Date.now(),
        };

        sessionStorage.setItem(getDraftStorageKey(state.visitId), JSON.stringify(draft));
      } catch (error) {
        console.error('Error saving billing draft:', error);
      }
    },

    loadDraft: (state, action: PayloadAction<string>) => {
      try {
        const saved = sessionStorage.getItem(getDraftStorageKey(action.payload));
        if (!saved) return;

        const parsed = JSON.parse(saved);
        if (!parsed.chargeItems || !Array.isArray(parsed.chargeItems)) return;

        // Backward/forward safe hydrate:
        // Ensure every line item has serviceKey; if missing (older drafts), derive it.
        state.chargeItems = parsed.chargeItems.map((ci: any) => {
          const service: ServiceItem = ci.service;
          const serviceKey = ci.serviceKey || makeBillableKey(service);
          return {
            ...ci,
            serviceKey,
            // keep totals consistent if missing/incorrect
            quantity: Math.max(1, Math.min(9999, Math.floor(Number(ci.quantity) || 1))),
            totalAmount: (Math.max(1, Math.min(9999, Math.floor(Number(ci.quantity) || 1))) || 1) * (service?.unitPrice || 0),
          } as ChargeItem;
        });

        state.discount = parsed.discount || DEFAULT_DISCOUNT;
        state.paymentMethods = parsed.paymentMethods || DEFAULT_PAYMENT_METHODS;
        state.additionalNotes = parsed.additionalNotes || '';
        state.status = parsed.status || 'draft';
        state.receiptNumber = parsed.receiptNumber;

        state.visitId = parsed.visitId;
        state.patientId = parsed.patientId;
        state.patientName = parsed.patientName;

        state.lastUpdated = parsed.lastUpdated || Date.now();
        state.isDirty = calculateIsDirty(state);
      } catch (error) {
        console.error('Error loading billing draft:', error);
      }
    },

    clearDraft: (state) => {
      try {
        if (state.visitId) sessionStorage.removeItem(getDraftStorageKey(state.visitId));
      } catch (error) {
        console.error('Error clearing billing draft:', error);
      }
    },
  //     clearAll: () => {
  //   return { ...INITIAL_BILLING_STATE };
  // },
    clearAll: (state) => {
    try {
      if (state.visitId) sessionStorage.removeItem(getDraftStorageKey(state.visitId));
    } catch (error) {
      console.error('Error clearing draft on clearAll:', error);
    }
    return { ...INITIAL_BILLING_STATE };
  },

    // Patient Info Actions
    setPatientInfo: (state, action: PayloadAction<{ visitId?: string; patientId?: string; patientName?: string }>) => {
      const { visitId, patientId, patientName } = action.payload;
      if (visitId !== undefined) state.visitId = visitId;
      if (patientId !== undefined) state.patientId = patientId;
      if (patientName !== undefined) state.patientName = patientName;
      updateMetadata(state);
    },
  },
});

export const {
  openTray,
  closeTray,
  setStep,
  addChargeItem,
  increaseQuantity,
  decreaseQuantity,
  removeChargeItem,
  clearCharges,
  setDiscount,
  setPaymentMethods,
  updatePaymentMethod,
  addPaymentMethod,
  removePaymentMethod,
  setAdditionalNotes,
  setProcessing,
  finalizePayment,
  printReceipt,
  resetBilling,
  saveDraft,
  loadDraft,
  clearDraft,
  setQuantity,
  setPatientInfo,
  clearAll,
} = billingSlice.actions;

export default billingSlice.reducer;

// Selectors (unchanged shape)
export const selectBilling = (state: { billing: BillingState }) => state.billing;
export const selectIsTrayOpen = (state: { billing: BillingState }) => state.billing.trayOpen;
export const selectCurrentStep = (state: { billing: BillingState }) => state.billing.currentStep;
export const selectChargeItems = (state: { billing: BillingState }) => state.billing.chargeItems;
export const selectBillingStatus = (state: { billing: BillingState }) => state.billing.status;
export const selectIsDirty = (state: { billing: BillingState }) => state.billing.isDirty;
export const selectIsProcessing = (state: { billing: BillingState }) => state.billing.isProcessing;
export const selectBillingState = (state: { billing: BillingState }) => state.billing;

export const selectPatientInfo = (state: { billing: BillingState }) => ({
  visitId: state.billing.visitId,
  patientId: state.billing.patientId,
  patientName: state.billing.patientName,
});

export const selectCanProceed = (state: { billing: BillingState }) => {
  const { chargeItems, status } = state.billing;
  return chargeItems.length > 0 && status !== 'settled';
};

export const selectBillingData = (state: { billing: BillingState }) => {
  const { chargeItems, discount, taxes, paymentMethods } = state.billing;

  const subtotal = chargeItems.reduce((sum, item) => sum + item.totalAmount, 0);

  let discountAmount = 0;
  if (discount.type === 'percentage') discountAmount = subtotal * (discount.value / 100);
  else discountAmount = discount.value;

  discountAmount = Math.min(discountAmount, subtotal);

  const taxableAmount = subtotal - discountAmount;

  const updatedTaxes = taxes.map((tax) => ({
    ...tax,
    amount: taxableAmount * (tax.rate / 100),
  }));

  const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
  const grandTotal = taxableAmount + taxTotal;

  const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  const balance = Math.max(0, grandTotal - totalPaid);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxes: updatedTaxes,
    taxTotal,
    grandTotal,
    totalPaid,
    balance,
    isPaid: balance === 0,
  };
};
