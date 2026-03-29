// billingSlice.ts - Updated clearDraft action
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

    /**
     * Close the billing tray but preserve backend persisted data.
     * Only clears UI draft data (chargeItems, discount, paymentMethods, etc.)
     * Backend data (backendChargeItems, backendBillingMeta, backendBillingData) remains intact.
     */
    closeTray: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing billing draft on close:', error);
      }

      // Clear only draft/UI state
      state.chargeItems = [];
      state.discount = { ...DEFAULT_DISCOUNT };
      state.taxes = INITIAL_BILLING_STATE.taxes.map((tax) => ({ ...tax }));
      state.paymentMethods = DEFAULT_PAYMENT_METHODS.map((method) => ({ ...method }));
      state.additionalNotes = '';
      state.status = 'draft';
      state.receiptNumber = undefined;
      state.isProcessing = false;
      state.currentStep = 'charge_entry';
      state.trayOpen = false;
      state.viewMode = 'expanded';
      state.isDirty = false;

      // Preserve backend persisted data:
      // state.backendChargeItems
      // state.backendBillingMeta
      // state.backendBillingData
      // state.optimisticPersistedBalanceDelta

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

    /**
     * Clear ONLY draft data (chargeItems, discount, paymentMethods, notes)
     * PRESERVE backend data (backendChargeItems, backendBillingMeta, backendBillingData)
     * 
     * This should be called after successful billing finalization to clear
     * temporary draft data while keeping the persisted billing data for display.
     */
    clearDraft: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing billing draft:', error);
      }

      // Clear ONLY draft/UI state
      state.chargeItems = [];
      state.discount = { ...DEFAULT_DISCOUNT };
      state.taxes = INITIAL_BILLING_STATE.taxes.map((tax) => ({ ...tax }));
      state.paymentMethods = DEFAULT_PAYMENT_METHODS.map((method) => ({ ...method }));
      state.additionalNotes = '';
      state.isProcessing = false;
      state.currentStep = 'billing_summary';
      state.isDirty = false;
      
      // DO NOT clear status, receiptNumber, or backend data
      // Keep status as 'settled' if it was settled
      // Keep receiptNumber for printing
      // Keep backendChargeItems, backendBillingMeta, backendBillingData

      updateMetadata(state);
    },
    /**
     * Clear ONLY draft charge items.
     * Preserves all other draft data (discount, paymentMethods, taxes, additionalNotes, status, receiptNumber)
     * This is used after successful billing finalization when we want to keep the draft data that was
     * submitted (like payment methods, discount) but clear the charge items since they're now persisted.
     */
    clearDraftChargeItemsOnly: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing billing draft charge items:', error);
      }

      // Clear ONLY draft charge items
      state.chargeItems = [];
      
      // Preserve everything else:
      // - discount (kept as is)
      // - taxes (kept as is)
      // - paymentMethods (kept as is)
      // - additionalNotes (kept as is)
      // - status (kept as is - should be 'settled')
      // - receiptNumber (kept for printing)
      // - isProcessing (kept)
      // - currentStep (kept)
      
      // Update metadata manually without calling updateMetadata which would recalculate isDirty
      state.lastUpdated = Date.now();
      state.isDirty = calculateIsDirty(state);
    },

    /**
     * Clear ALL draft data after successful payment finalization.
     * This dedicated reducer is specifically for use after a billing has been
     * successfully finalized and the server data has been fetched.
     * 
     * Clears:
     *   - chargeItems (draft charge items)
     *   - discount (reset to default)
     *   - taxes (reset to default)
     *   - paymentMethods (reset to default)
     *   - additionalNotes (cleared)
     *   - isProcessing (reset)
     * 
     * Preserves:
     *   - status ('settled')
     *   - receiptNumber (from finalizePayment)
     *   - backendChargeItems, backendBillingData, backendBillingMeta
     *   - visitId, patientId, patientName (context)
     *   - trayOpen state
     *   - viewMode
     * 
     * This ensures the receipt displays only the server-persisted data without
     * any leftover draft data from the just-completed transaction.
     */
        clearDraftAfterFinalization: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing billing draft after finalization:', error);
      }

      // Clear ALL draft/UI state that should not persist after finalization
      state.chargeItems = [];
      state.discount = { ...DEFAULT_DISCOUNT };
      state.taxes = INITIAL_BILLING_STATE.taxes.map((tax) => ({ ...tax }));
      state.paymentMethods = DEFAULT_PAYMENT_METHODS.map((method) => ({ ...method }));
      state.additionalNotes = '';
      state.isProcessing = false;
      // Keep currentStep as 'billing_summary' (don't reset to charge_entry)
      // state.currentStep remains unchanged (should be 'billing_summary')
      
      // Update metadata
      state.lastUpdated = Date.now();
      state.isDirty = calculateIsDirty(state);
    },

    /**
     * Completely clear ALL billing data including backend persisted data.
     * Use this only when explicitly needed (e.g., after successful finalization).
     * 
     * This reducer ONLY clears billing data and does NOT modify tray state.
     * Tray state (trayOpen, currentStep, viewMode) should be managed separately.
     */
    clearAll: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing draft on clearAll:', error);
      }
      
      // Preserve visit/patient context and tray state
      const preservedVisitId = state.visitId;
      const preservedPatientId = state.patientId;
      const preservedPatientName = state.patientName;
      const preservedTrayOpen = state.trayOpen;
      const preservedCurrentStep = state.currentStep;
      const preservedViewMode = state.viewMode;
      
      // Reset to initial state
      const newState = { ...INITIAL_BILLING_STATE };
      
      // Restore preserved values
      newState.visitId = preservedVisitId;
      newState.patientId = preservedPatientId;
      newState.patientName = preservedPatientName;
      newState.trayOpen = preservedTrayOpen;
      newState.currentStep = preservedCurrentStep;
      newState.viewMode = preservedViewMode;
      
      return newState;
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

    // ========== BOTTOM DISPLAY ACTIONS ==========
    setBillingDataLoaded: (state, action: PayloadAction<{ visitId: string; loaded: boolean }>) => {
      const { visitId, loaded } = action.payload;
      if (!state.billingDataLoaded) {
        state.billingDataLoaded = {};
      }
      state.billingDataLoaded[visitId] = loaded;
      updateMetadata(state);
    },

    clearBillingDataLoaded: (state, action: PayloadAction<string>) => {
      const visitId = action.payload;
      if (state.billingDataLoaded && state.billingDataLoaded[visitId]) {
        delete state.billingDataLoaded[visitId];
      }
      updateMetadata(state);
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
  clearDraftChargeItemsOnly,  
  clearDraftAfterFinalization, 
  setQuantity,
  setPatientInfo,
  clearAll,
  hydrateBackendBilling,
  clearBackendBilling,
  optimisticAdjustBackendItem,
  rollbackOptimisticBackendAdjustment,
  setBillingDataLoaded,
  clearBillingDataLoaded,
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

// ========== DISPLAYED DISCOUNT/TAX BILLING DATA SELECTOR ==========
// This selector computes discount + tax against the DISPLAYED subtotal
// (backend persisted items + draft items), while keeping the original
// draft selectors intact for other parts of the app.
export const selectDisplayedDiscountTaxBillingData = createSelector(
  [
    selectRenderableChargeItems,
    (state: RootState) => state.billing.discount,
    (state: RootState) => state.billing.taxes,
    (state: RootState) => state.billing.paymentMethods,
  ],
  (renderableChargeItems, discount, taxes, paymentMethods) => {
    const subtotal = roundCurrency(
      renderableChargeItems.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
    );

    const rawDiscountAmount =
      discount.type === 'percentage'
        ? subtotal * (Number(discount.value || 0) / 100)
        : Number(discount.value || 0);

    const discountAmount = roundCurrency(
      Math.min(Math.max(0, rawDiscountAmount), subtotal)
    );

    const taxableAmount = roundCurrency(Math.max(0, subtotal - discountAmount));

    const computedTaxes = taxes.map((tax) => ({
      ...tax,
      amount: roundCurrency(taxableAmount * (Number(tax.rate || 0) / 100)),
    }));

    const taxTotal = roundCurrency(
      computedTaxes.reduce((sum, tax) => sum + Number(tax.amount || 0), 0)
    );

    const grandTotal = roundCurrency(taxableAmount + taxTotal);

    const totalPaid = roundCurrency(
      paymentMethods.reduce((sum, method) => sum + Number(method.amount || 0), 0)
    );

    const balance = roundCurrency(Math.max(0, grandTotal - totalPaid));

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      taxes: computedTaxes,
      taxTotal,
      grandTotal,
      totalPaid,
      balance,
      isPaid: balance === 0,
    };
  }
);

// ========== BILLING DATA LOADED SELECTOR ==========
export const selectBillingDataLoaded = (state: RootState, visitId: string): boolean =>
  state.billing.billingDataLoaded?.[visitId] || false;