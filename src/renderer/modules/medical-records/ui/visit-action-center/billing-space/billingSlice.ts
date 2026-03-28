// billingSlice.ts
import { createSlice, type PayloadAction, createSelector } from '@reduxjs/toolkit';
import {
  type BillingState,
  INITIAL_BILLING_STATE,
  type ServiceItem,
  type ChargeItem,
  type Discount,
  type PaymentMethod,
  type BillingStep,
  type BillingTrayViewMode,
  generateChargeItemId,
  generateReceiptNumber,
  getDraftStorageKey,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_DISCOUNT,
  makeBillableKey,
  mapRetrievedBillingToBackendState,
  type RenderableChargeItem,
  EMPTY_BACKEND_META,
  BackendChargeItem,
} from './billing-types';

import type { BillingRetrievalData } from '../../../api/billable-items/BillingItemsTypes';
import { RootState } from '../../../../../app/store/rootReducer';

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

const calculateIsDirty = (state: BillingState): boolean => {
  return (
    state.chargeItems.length > 0 ||
    state.discount.value > 0 ||
    state.paymentMethods.some((m) => m.amount > 0) ||
    state.additionalNotes.trim().length > 0 ||
    state.status !== 'draft'
  );
};

const updateMetadata = (state: BillingState): void => {
  state.lastUpdated = Date.now();
  state.isDirty = calculateIsDirty(state);
};

const mergeTaxes = (
  existing: Array<{ name: string; rate: number; amount: number }> = [],
  incoming: Array<{ name: string; rate: number; amount: number }> = []
): Array<{ name: string; rate: number; amount: number }> => {
  const merged = new Map<string, { name: string; rate: number; amount: number }>();

  [...existing, ...incoming].forEach((tax) => {
    const key = `${String(tax.name).toLowerCase()}|${Number(tax.rate || 0).toFixed(2)}`;
    const current = merged.get(key);

    if (!current) {
      merged.set(key, {
        name: tax.name,
        rate: Number(tax.rate || 0),
        amount: Number(tax.amount || 0),
      });
    } else {
      current.amount = Number((current.amount + Number(tax.amount || 0)).toFixed(2));
      merged.set(key, current);
    }
  });

  return Array.from(merged.values());
};

/* -------------------------------------------------------------------------- */
/*                               SLICE                                        */
/* -------------------------------------------------------------------------- */

const billingSlice = createSlice({
  name: 'billing',
  initialState: INITIAL_BILLING_STATE,
  reducers: {
    // ========== UI ACTIONS ==========
    openTray: (
      state,
      action: PayloadAction<{ step?: BillingStep; visitId?: string; patientId?: string; patientName?: string }>
    ) => {
      state.trayOpen = true;
      state.currentStep = action.payload.step || 'charge_entry';
      state.viewMode = 'expanded';

      if (action.payload.visitId) state.visitId = action.payload.visitId;
      if (action.payload.patientId) state.patientId = action.payload.patientId;
      if (action.payload.patientName) state.patientName = action.payload.patientName;

      updateMetadata(state);
    },

    closeTray: (state) => {
      state.trayOpen = false;
      state.viewMode = 'expanded';
      updateMetadata(state);
    },

    setStep: (state, action: PayloadAction<BillingStep>) => {
      state.currentStep = action.payload;
      updateMetadata(state);
    },

    setViewMode: (state, action: PayloadAction<BillingTrayViewMode>) => {
      state.viewMode = action.payload;
      updateMetadata(state);
    },

    minimizeTray: (state) => {
      state.viewMode = 'minimized';
      updateMetadata(state);
    },

    maximizeTray: (state) => {
      state.viewMode = 'expanded';
      updateMetadata(state);
    },

    // ========== CHARGE ITEMS ACTIONS ==========
    addChargeItem: (state, action: PayloadAction<ServiceItem>) => {
      const service = action.payload;
      const serviceKey = makeBillableKey(service);
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
          source: 'slice',
          persisted: false,
        };
        state.chargeItems.push(newItem);
      }

      if (state.chargeItems.length > 0 && state.status === 'draft') {
        state.status = 'ready';
      }

      updateMetadata(state);
    },

    increaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.chargeItems.find((x) => x.id === action.payload);
      if (!item) return;

      item.quantity += 1;
      item.totalAmount = item.quantity * item.service.unitPrice;
      updateMetadata(state);
    },

    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.chargeItems.find((x) => x.id === action.payload);
      if (!item) return;

      if (item.quantity === 1) {
        state.chargeItems = state.chargeItems.filter((x) => x.id !== action.payload);
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

      if (state.chargeItems.length === 0) {
        state.status = 'draft';
      } else if (state.status === 'draft') {
        state.status = 'ready';
      }

      updateMetadata(state);
    },

    clearCharges: (state) => {
      state.chargeItems = [];
      state.status = 'draft';
      updateMetadata(state);
    },

    // ========== DISCOUNT ACTIONS ==========
    setDiscount: (state, action: PayloadAction<Discount>) => {
      state.discount = action.payload;
      updateMetadata(state);
    },

    // ========== PAYMENT METHODS ACTIONS ==========
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

    // ========== OTHER ACTIONS ==========
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

    // ========== RESET ACTIONS ==========
    resetBilling: (state) => {
      const { visitId, patientId, patientName } = state;
      Object.assign(state, { ...INITIAL_BILLING_STATE, visitId, patientId, patientName });
    },

    // ========== DRAFT ACTIONS ==========
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

        state.chargeItems = parsed.chargeItems.map((ci: any) => {
          const service: ServiceItem = ci.service;
          const serviceKey = ci.serviceKey || makeBillableKey(service);
          const quantity = Math.max(1, Math.min(9999, Math.floor(Number(ci.quantity) || 1)));
          return {
            ...ci,
            serviceKey,
            quantity,
            totalAmount: quantity * (service?.unitPrice || 0),
            source: 'slice',
            persisted: false,
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
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing billing draft:', error);
      }
    },

    clearAll: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing draft on clearAll:', error);
      }
      return { ...INITIAL_BILLING_STATE };
    },

    // ========== PATIENT INFO ACTIONS ==========
    setPatientInfo: (state, action: PayloadAction<{ visitId?: string; patientId?: string; patientName?: string }>) => {
      const { visitId, patientId, patientName } = action.payload;
      if (visitId !== undefined) state.visitId = visitId;
      if (patientId !== undefined) state.patientId = patientId;
      if (patientName !== undefined) state.patientName = patientName;
      updateMetadata(state);
    },

    // ========== BACKEND SYNC ACTIONS ==========
    hydrateBackendBilling: (state, action: PayloadAction<BillingRetrievalData>) => {
      const mapped = mapRetrievedBillingToBackendState(action.payload);
      state.backendChargeItems = mapped.backendChargeItems;
      state.backendBillingMeta = mapped.backendBillingMeta;
      state.backendBillingData = mapped.backendBillingData;
      state.optimisticPersistedBalanceDelta = 0;
      state.lastUpdated = Date.now();
    },

    clearBackendBilling: (state) => {
      state.backendChargeItems = [];
      state.backendBillingMeta = EMPTY_BACKEND_META;
      state.backendBillingData = null;
      state.optimisticPersistedBalanceDelta = 0;
      state.lastUpdated = Date.now();
    },

    optimisticAdjustBackendItem: (
      state,
      action: PayloadAction<{
        lineItemId: number;
        action: 'increase' | 'decrease' | 'remove';
        quantity: number;
      }>
    ) => {
      const { lineItemId, action: adjustmentAction, quantity } = action.payload;
      const itemIndex = state.backendChargeItems.findIndex((item) => item.lineItemId === lineItemId);

      if (itemIndex === -1) return;

      const item = state.backendChargeItems[itemIndex];
      const safeQuantity = Math.max(0, Number(quantity) || 0);

      if (safeQuantity === 0 && adjustmentAction !== 'remove') return;

      const unitPrice = item.quantity > 0 ? item.totalAmount / item.quantity : item.service.unitPrice;
      let balanceDelta = 0;

      if (adjustmentAction === 'increase') {
        const amountDelta = roundCurrency(unitPrice * safeQuantity);
        item.quantity += safeQuantity;
        item.totalAmount = roundCurrency(item.totalAmount + amountDelta);
        balanceDelta = amountDelta;
      }

      if (adjustmentAction === 'decrease') {
        const allowedDecrease = Math.min(safeQuantity, item.quantity);
        const amountDelta = roundCurrency(unitPrice * allowedDecrease);
        const nextQuantity = item.quantity - allowedDecrease;

        if (nextQuantity <= 0) {
          state.backendChargeItems.splice(itemIndex, 1);
        } else {
          item.quantity = nextQuantity;
          item.totalAmount = roundCurrency(item.totalAmount - amountDelta);
        }

        balanceDelta = -amountDelta;
      }

      if (adjustmentAction === 'remove') {
        balanceDelta = -roundCurrency(item.totalAmount);
        state.backendChargeItems.splice(itemIndex, 1);
      }

      state.optimisticPersistedBalanceDelta = roundCurrency(state.optimisticPersistedBalanceDelta + balanceDelta);
      state.lastUpdated = Date.now();
    },

    rollbackOptimisticBackendAdjustment: (
      state,
      action: PayloadAction<{
        previousBackendChargeItems: BackendChargeItem[];
        previousOptimisticPersistedBalanceDelta: number;
      }>
    ) => {
      state.backendChargeItems = action.payload.previousBackendChargeItems;
      state.optimisticPersistedBalanceDelta = action.payload.previousOptimisticPersistedBalanceDelta;
      state.lastUpdated = Date.now();
    },
  },
});

/* -------------------------------------------------------------------------- */
/*                               EXPORT ACTIONS                               */
/* -------------------------------------------------------------------------- */

export const {
  openTray,
  closeTray,
  setStep,
  setViewMode,
  minimizeTray,
  maximizeTray,
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
  hydrateBackendBilling,
  clearBackendBilling,
  optimisticAdjustBackendItem,
  rollbackOptimisticBackendAdjustment,
} = billingSlice.actions;

export default billingSlice.reducer;

/* -------------------------------------------------------------------------- */
/*                               SELECTORS                                    */
/* -------------------------------------------------------------------------- */

// ========== BASE SELECTORS ==========
export const selectBilling = (state: RootState) => state.billing;
export const selectIsTrayOpen = (state: RootState) => state.billing.trayOpen;
export const selectCurrentStep = (state: RootState) => state.billing.currentStep;
export const selectBillingViewMode = (state: RootState) => state.billing.viewMode;
export const selectBillingStatus = (state: RootState) => state.billing.status;
export const selectIsDirty = (state: RootState) => state.billing.isDirty;
export const selectIsProcessing = (state: RootState) => state.billing.isProcessing;
export const selectBackendBillingMeta = (state: RootState) => state.billing.backendBillingMeta;
export const selectBackendBillingData = (state: RootState) => state.billing.backendBillingData;

// ========== CHARGE ITEMS SELECTORS ==========
export const selectChargeItems = (state: RootState) => state.billing.chargeItems;
export const selectDraftChargeItems = (state: RootState) => state.billing.chargeItems;
export const selectBackendChargeItems = (state: RootState) => state.billing.backendChargeItems;

export const selectRenderableChargeItems = (state: RootState): RenderableChargeItem[] => [
  ...state.billing.backendChargeItems,
  ...state.billing.chargeItems,
];

// ========== PERSISTED BALANCE SELECTOR ==========
export const selectPersistedBalance = createSelector(
  [
    (state: RootState) => state.billing.backendBillingData?.balance ?? 0,
    (state: RootState) => state.billing.optimisticPersistedBalanceDelta ?? 0,
  ],
  (serverBalance, optimisticDelta) => Math.max(0, serverBalance + optimisticDelta)
);

// ========== PATIENT INFO SELECTORS ==========
export const selectPatientInfo = (state: RootState) => ({
  visitId: state.billing.visitId,
  patientId: state.billing.patientId,
  patientName: state.billing.patientName,
});

// ========== EFFECTIVE STATUS SELECTOR ==========
export const selectEffectiveBillingStatus = createSelector(
  [
    (state: RootState) => state.billing.backendBillingMeta.status,
    (state: RootState) => state.billing.status,
  ],
  (backendStatus, draftStatus) => {
    if (backendStatus === 'settled') return 'settled';
    if (draftStatus === 'settled') return 'settled';
    if (draftStatus === 'ready') return 'ready';
    return backendStatus || draftStatus || 'draft';
  }
);

// ========== CAN PROCEED SELECTOR ==========
export const selectCanProceed = createSelector(
  [
    (state: RootState) => state.billing.chargeItems.length,
    selectEffectiveBillingStatus,
  ],
  (hasDraftItems, effectiveStatus) => hasDraftItems > 0 && effectiveStatus !== 'settled'
);

// ========== DRAFT BILLING DATA SELECTOR ==========
export const selectBillingData = createSelector(
  [
    (state: RootState) => state.billing.chargeItems,
    (state: RootState) => state.billing.discount,
    (state: RootState) => state.billing.taxes,
    (state: RootState) => state.billing.paymentMethods,
  ],
  (chargeItems, discount, taxes, paymentMethods) => {
    const subtotal = chargeItems.reduce((sum, item) => sum + item.totalAmount, 0);

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = subtotal * (discount.value / 100);
    } else {
      discountAmount = discount.value;
    }
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
  }
);

// ========== DISPLAY BILLING DATA SELECTOR ==========
export const selectDisplayBillingData = createSelector(
  [
    selectBillingData,
    selectPersistedBalance,
    selectBackendBillingData,
    selectBackendChargeItems,
    selectChargeItems,
  ],
  (draft, persistedBalance, persistedBillingData, backendChargeItems, draftChargeItems) => {
    const displayedSubtotal = [...backendChargeItems, ...draftChargeItems].reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const draftGrandTotal = draft.grandTotal;
    const displayedBalance = persistedBalance + draftGrandTotal;
    const displayedGrandTotal = (persistedBillingData?.grandTotal ?? 0) + draftGrandTotal;
    const displayedTotalPaid = (persistedBillingData?.totalPaid ?? 0) + draft.totalPaid;

    const displayedTaxes = mergeTaxes(persistedBillingData?.taxes ?? [], draft.taxes ?? []);

    return {
      // Persisted values
      persistedSubtotal: persistedBillingData?.subtotal ?? 0,
      persistedGrandTotal: persistedBillingData?.grandTotal ?? 0,
      persistedTotalPaid: persistedBillingData?.totalPaid ?? 0,
      persistedBalance,
      persistedTaxes: persistedBillingData?.taxes ?? [],

      // Draft values
      draftSubtotal: draft.subtotal,
      draftGrandTotal,
      draftTotalPaid: draft.totalPaid,
      draftBalance: draft.balance,
      draftTaxes: draft.taxes ?? [],

      // Displayed values (combined)
      displayedSubtotal,
      displayedGrandTotal,
      displayedTotalPaid,
      displayedBalance,
      displayedTaxes,
    };
  }
);