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
  type RenderableChargeItem,
  type BackendChargeItem,
  type Tax,
  generateChargeItemId,
  generateReceiptNumber,
  getDraftStorageKey,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_DISCOUNT,
  makeBillableKey,
  mapRetrievedBillingToBackendState,
  EMPTY_BACKEND_META,
  calculateBillingSnapshot,
} from './billing-types';

import type { BillingRetrievalData } from '../../../api/billable-items/BillingItemsTypes';
import { RootState } from '../../../../../app/store/rootReducer';

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */

const roundCurrency = (value: number): number => Math.round((Number(value) || 0) * 100) / 100;

const cloneDiscount = (discount?: Discount | null): Discount => ({
  type: discount?.type === 'fixed' ? 'fixed' : 'percentage',
  value: Number(discount?.value || 0),
  reason: discount?.reason || '',
});

const cloneTaxes = (taxes?: Tax[] | null): Tax[] => {
  if (!Array.isArray(taxes) || taxes.length === 0) {
    return INITIAL_BILLING_STATE.taxes.map((tax) => ({ ...tax }));
  }

  return taxes.map((tax) => ({
    name: tax.name,
    rate: Number(tax.rate || 0),
    amount: Number(tax.amount || 0),
  }));
};

const getBaselineDiscount = (state: BillingState): Discount => {
  if (state.backendBillingMeta.hasBilling && state.backendDiscount) {
    return cloneDiscount(state.backendDiscount);
  }
  return cloneDiscount(DEFAULT_DISCOUNT);
};

const getBaselineTaxes = (state: BillingState): Tax[] => {
  if (state.backendBillingMeta.hasBilling && state.backendTaxes.length > 0) {
    return cloneTaxes(state.backendTaxes);
  }
  return INITIAL_BILLING_STATE.taxes.map((tax) => ({ ...tax }));
};

const areDiscountsEqual = (left?: Discount | null, right?: Discount | null): boolean => {
  return (
    (left?.type || 'percentage') === (right?.type || 'percentage') &&
    Number(left?.value || 0) === Number(right?.value || 0) &&
    String(left?.reason || '') === String(right?.reason || '')
  );
};

const normalizeTaxKey = (tax: Pick<Tax, 'name' | 'rate'>): string =>
  `${String(tax.name || '').toLowerCase()}|${Number(tax.rate || 0).toFixed(4)}`;

const areTaxesEqual = (left: Tax[] = [], right: Tax[] = []): boolean => {
  if (left.length !== right.length) return false;

  const leftMap = new Map<string, number>();
  const rightMap = new Map<string, number>();

  left.forEach((tax) => leftMap.set(normalizeTaxKey(tax), Number(tax.rate || 0)));
  right.forEach((tax) => rightMap.set(normalizeTaxKey(tax), Number(tax.rate || 0)));

  if (leftMap.size !== rightMap.size) return false;

  for (const [key, rate] of leftMap.entries()) {
    if (!rightMap.has(key) || rightMap.get(key) !== rate) {
      return false;
    }
  }

  return true;
};

const calculateIsDirty = (state: BillingState): boolean => {
  const baselineDiscount = getBaselineDiscount(state);
  const baselineTaxes = getBaselineTaxes(state);

  return (
    state.chargeItems.length > 0 ||
    !areDiscountsEqual(state.discount, baselineDiscount) ||
    !areTaxesEqual(state.taxes, baselineTaxes) ||
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

const subtractTaxes = (
  combined: Array<{ name: string; rate: number; amount: number }> = [],
  base: Array<{ name: string; rate: number; amount: number }> = []
): Array<{ name: string; rate: number; amount: number }> => {
  const baseMap = new Map<string, number>();

  base.forEach((tax) => {
    const key = `${String(tax.name).toLowerCase()}|${Number(tax.rate || 0).toFixed(2)}`;
    const current = baseMap.get(key) || 0;
    baseMap.set(key, Number((current + Number(tax.amount || 0)).toFixed(2)));
  });

  return combined.map((tax) => {
    const key = `${String(tax.name).toLowerCase()}|${Number(tax.rate || 0).toFixed(2)}`;
    const baseAmount = baseMap.get(key) || 0;

    return {
      ...tax,
      amount: Number(Math.max(0, Number(tax.amount || 0) - baseAmount).toFixed(2)),
    };
  });
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
     * Backend data remains intact.
     */
    closeTray: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing billing draft on close:', error);
      }

      state.chargeItems = [];
      state.discount = getBaselineDiscount(state);
      state.taxes = getBaselineTaxes(state);
      state.paymentMethods = DEFAULT_PAYMENT_METHODS.map((method) => ({ ...method }));
      state.additionalNotes = '';
      state.status = 'draft';
      state.receiptNumber = undefined;
      state.isProcessing = false;
      state.currentStep = 'charge_entry';
      state.trayOpen = false;
      state.viewMode = 'expanded';
      state.isDirty = false;

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
      state.discount = cloneDiscount(action.payload);
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

        state.discount = parsed.discount ? cloneDiscount(parsed.discount) : getBaselineDiscount(state);
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
     * Clear ONLY draft data and preserve backend data.
     */
    clearDraft: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing billing draft:', error);
      }

      state.chargeItems = [];
      state.discount = getBaselineDiscount(state);
      state.taxes = getBaselineTaxes(state);
      state.paymentMethods = DEFAULT_PAYMENT_METHODS.map((method) => ({ ...method }));
      state.additionalNotes = '';
      state.isProcessing = false;
      state.currentStep = 'billing_summary';
      state.isDirty = false;

      updateMetadata(state);
    },

    /**
     * Clear ONLY draft charge items.
     * Preserves all other draft data.
     */
    clearDraftChargeItemsOnly: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing billing draft charge items:', error);
      }

      state.chargeItems = [];
      state.lastUpdated = Date.now();
      state.isDirty = calculateIsDirty(state);
    },

    /**
     * Clear ALL draft data after successful payment finalization.
     */
    clearDraftAfterFinalization: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing billing draft after finalization:', error);
      }

      state.chargeItems = [];
      state.discount = getBaselineDiscount(state);
      state.taxes = getBaselineTaxes(state);
      state.paymentMethods = DEFAULT_PAYMENT_METHODS.map((method) => ({ ...method }));
      state.additionalNotes = '';
      state.isProcessing = false;

      state.lastUpdated = Date.now();
      state.isDirty = calculateIsDirty(state);
    },

    /**
     * Completely clear ALL billing data including backend persisted data.
     * Does NOT modify tray state.
     */
    clearAll: (state) => {
      try {
        if (state.visitId) {
          sessionStorage.removeItem(getDraftStorageKey(state.visitId));
        }
      } catch (error) {
        console.error('Error clearing draft on clearAll:', error);
      }

      const preservedVisitId = state.visitId;
      const preservedPatientId = state.patientId;
      const preservedPatientName = state.patientName;
      const preservedTrayOpen = state.trayOpen;
      const preservedCurrentStep = state.currentStep;
      const preservedViewMode = state.viewMode;

      const newState = { ...INITIAL_BILLING_STATE };

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
      state.backendDiscount = cloneDiscount(mapped.backendDiscount);
      state.backendTaxes = cloneTaxes(mapped.backendTaxes);
      state.optimisticPersistedBalanceDelta = 0;

      // Keep working values aligned with persisted basis so discount/taxes apply to combined total.
      state.discount = cloneDiscount(mapped.backendDiscount);
      state.taxes = cloneTaxes(mapped.backendTaxes);

      state.lastUpdated = Date.now();
      state.isDirty = calculateIsDirty(state);
    },

    clearBackendBilling: (state) => {
      state.backendChargeItems = [];
      state.backendBillingMeta = EMPTY_BACKEND_META;
      state.backendBillingData = null;
      state.backendDiscount = null;
      state.backendTaxes = [];
      state.optimisticPersistedBalanceDelta = 0;
      state.discount = cloneDiscount(DEFAULT_DISCOUNT);
      state.taxes = INITIAL_BILLING_STATE.taxes.map((tax) => ({ ...tax }));
      state.lastUpdated = Date.now();
      state.isDirty = calculateIsDirty(state);
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
    return calculateBillingSnapshot({
      chargeItems,
      discount,
      taxes,
      paymentMethods,
    });
  }
);

// ========== COMBINED BILLING DATA SELECTOR ==========
export const selectCombinedBillingData = createSelector(
  [
    (state: RootState) => state.billing.backendChargeItems,
    (state: RootState) => state.billing.chargeItems,
    (state: RootState) => state.billing.discount,
    (state: RootState) => state.billing.taxes,
    (state: RootState) => state.billing.paymentMethods,
    (state: RootState) => state.billing.backendBillingData?.totalPaid ?? 0,
  ],
  (backendChargeItems, draftChargeItems, discount, taxes, paymentMethods, persistedTotalPaid) => {
    return calculateBillingSnapshot({
      chargeItems: [...backendChargeItems, ...draftChargeItems],
      discount,
      taxes,
      paymentMethods,
      carriedPaid: Number(persistedTotalPaid || 0),
    });
  }
);

const selectComparablePersistedBillingData = createSelector(
  [
    (state: RootState) => state.billing.backendChargeItems,
    (state: RootState) => state.billing.discount,
    (state: RootState) => state.billing.taxes,
    (state: RootState) => state.billing.backendBillingData?.totalPaid ?? 0,
  ],
  (backendChargeItems, discount, taxes, persistedTotalPaid) => {
    return calculateBillingSnapshot({
      chargeItems: backendChargeItems,
      discount,
      taxes,
      paymentMethods: [],
      carriedPaid: Number(persistedTotalPaid || 0),
    });
  }
);

// ========== DISPLAY BILLING DATA SELECTOR ==========
export const selectDisplayBillingData = createSelector(
  [
    selectCombinedBillingData,
    selectComparablePersistedBillingData,
    selectPersistedBalance,
    selectBackendBillingData,
    selectBackendChargeItems,
    selectChargeItems,
  ],
  (
    combined,
    comparablePersisted,
    persistedBalance,
    persistedBillingData,
    backendChargeItems,
    draftChargeItems
  ) => {
    const persistedSubtotal = backendChargeItems.reduce(
      (sum, item) => sum + (Number(item.totalAmount) || 0),
      0
    );

    const draftSubtotal = draftChargeItems.reduce(
      (sum, item) => sum + (Number(item.totalAmount) || 0),
      0
    );

    const persistedGrandTotal = persistedBillingData?.grandTotal ?? comparablePersisted.grandTotal;
    const persistedTotalPaid = persistedBillingData?.totalPaid ?? comparablePersisted.totalPaid;
    const persistedTaxes = persistedBillingData?.taxes ?? comparablePersisted.taxes ?? [];

    const draftGrandTotal = roundCurrency(
      Math.max(0, combined.grandTotal - comparablePersisted.grandTotal)
    );

    const draftTotalPaid = roundCurrency(
      Math.max(0, combined.totalPaid - persistedTotalPaid)
    );

    const draftTaxes = subtractTaxes(combined.taxes ?? [], comparablePersisted.taxes ?? []);

    const draftBalance = roundCurrency(
      Math.max(0, combined.balance - persistedBalance)
    );

    return {
      // Persisted values
      persistedSubtotal,
      persistedGrandTotal,
      persistedTotalPaid,
      persistedBalance,
      persistedTaxes,

      // Draft values
      draftSubtotal,
      draftGrandTotal,
      draftTotalPaid,
      draftBalance,
      draftTaxes,

      // Displayed values (combined)
      displayedSubtotal: combined.subtotal,
      displayedGrandTotal: combined.grandTotal,
      displayedTotalPaid: combined.totalPaid,
      displayedBalance: combined.balance,
      displayedTaxes: mergeTaxes([], combined.taxes ?? []),

      // Extra combined values
      displayedDiscountAmount: combined.discountAmount,
      displayedTaxableAmount: combined.taxableAmount,
      displayedTaxTotal: combined.taxTotal,
    };
  }
);

// ========== BILLING DATA LOADED SELECTOR ==========
export const selectBillingDataLoaded = (state: RootState, visitId: string): boolean =>
  state.billing.billingDataLoaded?.[visitId] || false;