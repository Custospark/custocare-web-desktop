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
  type AnyBackendChargeItem,
} from './billing-types';

import type { BillingRetrievalData } from '../../../api/billable-items/BillingItemsTypes';
import type { RootState } from '../../../../../app/store/rootReducer';

/* -------------------------------------------------------------------------- */
/*                               HELPERS                                      */
/* -------------------------------------------------------------------------- */

const roundCurrency = (value: number): number =>
  Math.round(((Number.isFinite(value) ? value : 0) + Number.EPSILON) * 100) / 100;

const clamp = (value: number, min = 0, max = Number.POSITIVE_INFINITY) =>
  Math.max(min, Math.min(max, value));

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const isValidDiscountType = (value: unknown): value is Discount['type'] =>
  value === 'percentage' || value === 'fixed';

const isValidPaymentType = (
  value: unknown
): value is PaymentMethod['type'] =>
  value === 'cash' ||
  value === 'card' ||
  value === 'insurance' ||
  value === 'mobile' ||
  value === 'mixed';

const cloneDefaultDiscount = (): Discount => ({
  ...DEFAULT_DISCOUNT,
});

const cloneDefaultPaymentMethods = (): PaymentMethod[] =>
  DEFAULT_PAYMENT_METHODS.map((method) => ({ ...method }));

const cloneInitialTaxes = () =>
  INITIAL_BILLING_STATE.taxes.map((tax) => ({ ...tax }));

const sanitizeDiscount = (discount: Partial<Discount> | null | undefined): Discount => {
  const type = isValidDiscountType(discount?.type)
    ? discount!.type
    : DEFAULT_DISCOUNT.type;

  const value = roundCurrency(Math.max(0, toFiniteNumber(discount?.value, 0)));

  const reason =
    typeof discount?.reason === 'string' && discount.reason.trim().length > 0
      ? discount.reason
      : undefined;

  return {
    type,
    value,
    ...(reason ? { reason } : {}),
  };
};

const sanitizePaymentMethod = (
  method: Partial<PaymentMethod> | null | undefined
): PaymentMethod => {
  const type = isValidPaymentType(method?.type) ? method!.type : 'cash';

  return {
    type,
    amount: roundCurrency(Math.max(0, toFiniteNumber(method?.amount, 0))),
    details: typeof method?.details === 'string' ? method.details : '',
  };
};

const sanitizePaymentMethods = (
  methods: Partial<PaymentMethod>[] | PaymentMethod[] | null | undefined
): PaymentMethod[] => {
  const sanitized = Array.isArray(methods)
    ? methods.map(sanitizePaymentMethod)
    : [];

  return sanitized.length > 0 ? sanitized.slice(0, 3) : cloneDefaultPaymentMethods();
};

const mergeTaxes = (
  existing: Array<{ name: string; rate: number; amount: number }> = [],
  incoming: Array<{ name: string; rate: number; amount: number }> = []
): Array<{ name: string; rate: number; amount: number }> => {
  const merged = new Map<string, { name: string; rate: number; amount: number }>();

  [...existing, ...incoming].forEach((tax) => {
    const key = `${String(tax.name).toLowerCase()}|${toFiniteNumber(tax.rate).toFixed(4)}`;
    const current = merged.get(key);

    if (!current) {
      merged.set(key, {
        name: tax.name,
        rate: roundCurrency(toFiniteNumber(tax.rate)),
        amount: roundCurrency(toFiniteNumber(tax.amount)),
      });
      return;
    }

    merged.set(key, {
      ...current,
      amount: roundCurrency(toFiniteNumber(current.amount) + toFiniteNumber(tax.amount)),
    });
  });

  return Array.from(merged.values());
};

const calculateIsDirty = (state: BillingState): boolean => {
  return (
    state.chargeItems.length > 0 ||
    state.discount.value > 0 ||
    state.paymentMethods.some((method) => toFiniteNumber(method.amount) > 0) ||
    state.additionalNotes.trim().length > 0 ||
    state.status !== 'draft'
  );
};

const updateMetadata = (state: BillingState): void => {
  state.lastUpdated = Date.now();
  state.isDirty = calculateIsDirty(state);
};

const normalizeDraftChargeItem = (raw: any): ChargeItem | null => {
  const service: ServiceItem | undefined = raw?.service;
  if (!service) return null;

  const serviceKey = raw?.serviceKey || makeBillableKey(service);
  const quantity = clamp(Math.floor(toFiniteNumber(raw?.quantity, 1)), 1, 9999);
  const unitPrice = roundCurrency(toFiniteNumber(service?.unitPrice, 0));
  const totalAmount = roundCurrency(quantity * unitPrice);

  return {
    id: raw?.id || generateChargeItemId(serviceKey),
    serviceKey,
    service,
    quantity,
    totalAmount,
    source: 'slice',
    persisted: false,
  };
};

const clearDraftStateOnly = (state: BillingState) => {
  state.chargeItems = [];
  state.discount = cloneDefaultDiscount();
  state.taxes = cloneInitialTaxes();
  state.paymentMethods = cloneDefaultPaymentMethods();
  state.additionalNotes = '';
  state.isProcessing = false;
};

const removePersistedDraftFromSessionStorage = (visitId?: string) => {
  try {
    if (visitId) {
      sessionStorage.removeItem(getDraftStorageKey(visitId));
    }
  } catch (error) {
    console.error('Error clearing billing draft:', error);
  }
};

/* -------------------------------------------------------------------------- */
/*                               SLICE                                        */
/* -------------------------------------------------------------------------- */

const billingSlice = createSlice({
  name: 'billing',
  initialState: INITIAL_BILLING_STATE,
  reducers: {
    /* ------------------------------- UI STATE ------------------------------ */
    openTray: (
      state,
      action: PayloadAction<{
        step?: BillingStep;
        visitId?: string;
        patientId?: string;
        patientName?: string;
      }>
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
      removePersistedDraftFromSessionStorage(state.visitId);

      clearDraftStateOnly(state);
      state.status = 'draft';
      state.receiptNumber = undefined;
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

    /* ---------------------------- CHARGE ITEMS ----------------------------- */
    addChargeItem: (state, action: PayloadAction<ServiceItem>) => {
      const service = action.payload;
      const serviceKey = makeBillableKey(service);
      const existingItem = state.chargeItems.find((item) => item.serviceKey === serviceKey);

      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.totalAmount = roundCurrency(
          existingItem.quantity * toFiniteNumber(existingItem.service.unitPrice, 0)
        );
      } else {
        const unitPrice = roundCurrency(toFiniteNumber(service.unitPrice, 0));
        const newItem: ChargeItem = {
          id: generateChargeItemId(serviceKey),
          serviceKey,
          service,
          quantity: 1,
          totalAmount: unitPrice,
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
      item.totalAmount = roundCurrency(item.quantity * toFiniteNumber(item.service.unitPrice, 0));
      updateMetadata(state);
    },

    decreaseQuantity: (state, action: PayloadAction<string>) => {
      const item = state.chargeItems.find((x) => x.id === action.payload);
      if (!item) return;

      if (item.quantity <= 1) {
        state.chargeItems = state.chargeItems.filter((x) => x.id !== action.payload);
      } else {
        item.quantity -= 1;
        item.totalAmount = roundCurrency(item.quantity * toFiniteNumber(item.service.unitPrice, 0));
      }

      if (state.chargeItems.length === 0 && state.status !== 'settled') {
        state.status = 'draft';
      }

      updateMetadata(state);
    },

    removeChargeItem: (state, action: PayloadAction<string>) => {
      state.chargeItems = state.chargeItems.filter((item) => item.id !== action.payload);

      if (state.chargeItems.length === 0 && state.status !== 'settled') {
        state.status = 'draft';
      }

      updateMetadata(state);
    },

    setQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      const { itemId, quantity } = action.payload;
      const item = state.chargeItems.find((x) => x.id === itemId);
      if (!item) return;

      const sanitizedQuantity = clamp(Math.floor(toFiniteNumber(quantity, 1)), 1, 9999);
      item.quantity = sanitizedQuantity;
      item.totalAmount = roundCurrency(
        sanitizedQuantity * toFiniteNumber(item.service.unitPrice, 0)
      );

      if (state.chargeItems.length === 0 && state.status !== 'settled') {
        state.status = 'draft';
      } else if (state.chargeItems.length > 0 && state.status === 'draft') {
        state.status = 'ready';
      }

      updateMetadata(state);
    },

    clearCharges: (state) => {
      state.chargeItems = [];
      if (state.status !== 'settled') {
        state.status = 'draft';
      }
      updateMetadata(state);
    },

    /* ------------------------------ DISCOUNT ------------------------------- */
    setDiscount: (state, action: PayloadAction<Discount>) => {
      state.discount = sanitizeDiscount(action.payload);
      updateMetadata(state);
    },

    /* --------------------------- PAYMENT METHODS --------------------------- */
    setPaymentMethods: (state, action: PayloadAction<PaymentMethod[]>) => {
      state.paymentMethods = sanitizePaymentMethods(action.payload);
      updateMetadata(state);
    },

    updatePaymentMethod: (
      state,
      action: PayloadAction<{ index: number; method: Partial<PaymentMethod> }>
    ) => {
      const { index, method } = action.payload;
      if (!state.paymentMethods[index]) return;

      state.paymentMethods[index] = sanitizePaymentMethod({
        ...state.paymentMethods[index],
        ...method,
      });

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

    /* ------------------------------- OTHER -------------------------------- */
    setAdditionalNotes: (state, action: PayloadAction<string>) => {
      state.additionalNotes = typeof action.payload === 'string' ? action.payload : '';
      updateMetadata(state);
    },

    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = !!action.payload;
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

    /* ------------------------------- RESET -------------------------------- */
    resetBilling: (state) => {
      const { visitId, patientId, patientName } = state;

      Object.assign(state, {
        ...INITIAL_BILLING_STATE,
        visitId,
        patientId,
        patientName,
      });
    },

    /* ----------------------------- DRAFT STATE ---------------------------- */
    saveDraft: (state) => {
      try {
        if (!state.visitId) return;

        const draft = {
          chargeItems: state.chargeItems,
          discount: sanitizeDiscount(state.discount),
          paymentMethods: sanitizePaymentMethods(state.paymentMethods),
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
        const normalizedChargeItems = Array.isArray(parsed?.chargeItems)
          ? parsed.chargeItems
              .map(normalizeDraftChargeItem)
              .filter(Boolean) as ChargeItem[]
          : [];

        state.chargeItems = normalizedChargeItems;
        state.discount = sanitizeDiscount(parsed?.discount);
        state.paymentMethods = sanitizePaymentMethods(parsed?.paymentMethods);
        state.additionalNotes =
          typeof parsed?.additionalNotes === 'string' ? parsed.additionalNotes : '';
        state.status = parsed?.status || (normalizedChargeItems.length > 0 ? 'ready' : 'draft');
        
        state.receiptNumber = typeof parsed?.receiptNumber === 'string' ? parsed.receiptNumber : undefined;
        
        state.visitId =
          typeof parsed?.visitId === 'string' ? parsed.visitId : state.visitId;
        state.patientId =
          typeof parsed?.patientId === 'string' ? parsed.patientId : state.patientId;
        state.patientName =
          typeof parsed?.patientName === 'string'
            ? parsed.patientName
            : state.patientName;
        state.lastUpdated = toFiniteNumber(parsed?.lastUpdated, Date.now());
        state.isDirty = calculateIsDirty(state);
      } catch (error) {
        console.error('Error loading billing draft:', error);
      }
    },

    clearDraft: (state) => {
      removePersistedDraftFromSessionStorage(state.visitId);

      clearDraftStateOnly(state);
      state.currentStep = 'billing_summary';
      state.isDirty = false;

      // Preserve:
      // - status
      // - receiptNumber
      // - backendChargeItems
      // - backendBillingMeta
      // - backendBillingData
      // - visit/patient context

      updateMetadata(state);
    },

    clearDraftChargeItemsOnly: (state) => {
      removePersistedDraftFromSessionStorage(state.visitId);

      state.chargeItems = [];
      state.lastUpdated = Date.now();
      state.isDirty = calculateIsDirty(state);
    },

    clearDraftAfterFinalization: (state) => {
      removePersistedDraftFromSessionStorage(state.visitId);

      clearDraftStateOnly(state);
      state.lastUpdated = Date.now();
      state.isDirty = calculateIsDirty(state);

      // Preserve:
      // - settled status
      // - receipt number
      // - backend data
      // - tray state / context
    },

    clearAll: (state) => {
      removePersistedDraftFromSessionStorage(state.visitId);

      const preservedVisitId = state.visitId;
      const preservedPatientId = state.patientId;
      const preservedPatientName = state.patientName;
      const preservedTrayOpen = state.trayOpen;
      const preservedCurrentStep = state.currentStep;
      const preservedViewMode = state.viewMode;

      const nextState: BillingState = {
        ...INITIAL_BILLING_STATE,
        visitId: preservedVisitId,
        patientId: preservedPatientId,
        patientName: preservedPatientName,
        trayOpen: preservedTrayOpen,
        currentStep: preservedCurrentStep,
        viewMode: preservedViewMode,
      };

      return nextState;
    },

    /* --------------------------- PATIENT CONTEXT --------------------------- */
    setPatientInfo: (
      state,
      action: PayloadAction<{
        visitId?: string;
        patientId?: string;
        patientName?: string;
      }>
    ) => {
      const { visitId, patientId, patientName } = action.payload;

      if (visitId !== undefined) state.visitId = visitId;
      if (patientId !== undefined) state.patientId = patientId;
      if (patientName !== undefined) state.patientName = patientName;

      updateMetadata(state);
    },

    /* ---------------------------- BACKEND SYNC ----------------------------- */
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
      const {
        lineItemId,
        action: adjustmentAction,
        quantity,
      } = action.payload;

      const itemIndex = state.backendChargeItems.findIndex(
        (item) => item.lineItemId === lineItemId
      );

      if (itemIndex === -1) return;

      const item = state.backendChargeItems[itemIndex];
      const safeQuantity = Math.max(0, Math.floor(toFiniteNumber(quantity, 0)));

      if (safeQuantity === 0 && adjustmentAction !== 'remove') return;

      const currentQuantity = Math.max(1, toFiniteNumber(item.quantity, 1));
      const currentTotalAmount = roundCurrency(toFiniteNumber(item.totalAmount, 0));
      const fallbackUnitPrice = roundCurrency(toFiniteNumber(item.service?.unitPrice, 0));

      const unitPrice =
        currentQuantity > 0
          ? roundCurrency(currentTotalAmount / currentQuantity)
          : fallbackUnitPrice;

      let balanceDelta = 0;

      if (adjustmentAction === 'increase') {
        const amountDelta = roundCurrency(unitPrice * safeQuantity);

        item.quantity = currentQuantity + safeQuantity;
        item.totalAmount = roundCurrency(currentTotalAmount + amountDelta);
        balanceDelta = amountDelta;
      }

      if (adjustmentAction === 'decrease') {
        const allowedDecrease = Math.min(safeQuantity, currentQuantity);
        const amountDelta = roundCurrency(unitPrice * allowedDecrease);
        const nextQuantity = currentQuantity - allowedDecrease;

        if (nextQuantity <= 0) {
          state.backendChargeItems.splice(itemIndex, 1);
        } else {
          item.quantity = nextQuantity;
          item.totalAmount = roundCurrency(currentTotalAmount - amountDelta);
        }

        balanceDelta = -amountDelta;
      }

      if (adjustmentAction === 'remove') {
        balanceDelta = -roundCurrency(currentTotalAmount);
        state.backendChargeItems.splice(itemIndex, 1);
      }

      state.optimisticPersistedBalanceDelta = roundCurrency(
        toFiniteNumber(state.optimisticPersistedBalanceDelta, 0) + balanceDelta
      );

      state.lastUpdated = Date.now();
    },

    rollbackOptimisticBackendAdjustment: (
      state,
      action: PayloadAction<{
        previousBackendChargeItems: AnyBackendChargeItem[];
        previousOptimisticPersistedBalanceDelta: number;
      }>
    ) => {
      state.backendChargeItems = action.payload.previousBackendChargeItems;
      state.optimisticPersistedBalanceDelta = roundCurrency(
        toFiniteNumber(action.payload.previousOptimisticPersistedBalanceDelta, 0)
      );
      state.lastUpdated = Date.now();
    },

    /* ------------------------ BILLING DATA LOADED MAP ---------------------- */
    setBillingDataLoaded: (
      state,
      action: PayloadAction<{ visitId: string; loaded: boolean }>
    ) => {
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

/* ----------------------------- BASE SELECTORS ----------------------------- */
export const selectBilling = (state: RootState) => state.billing;
export const selectIsTrayOpen = (state: RootState) => state.billing.trayOpen;
export const selectCurrentStep = (state: RootState) => state.billing.currentStep;
export const selectBillingViewMode = (state: RootState) => state.billing.viewMode;
export const selectBillingStatus = (state: RootState) => state.billing.status;
export const selectIsDirty = (state: RootState) => state.billing.isDirty;
export const selectIsProcessing = (state: RootState) => state.billing.isProcessing;
export const selectBackendBillingMeta = (state: RootState) => state.billing.backendBillingMeta;
export const selectBackendBillingData = (state: RootState) => state.billing.backendBillingData;

/* -------------------------- CHARGE ITEM SELECTORS ------------------------- */
export const selectChargeItems = (state: RootState) => state.billing.chargeItems;
export const selectDraftChargeItems = (state: RootState) => state.billing.chargeItems;
export const selectBackendChargeItems = (state: RootState) => state.billing.backendChargeItems;

export const selectRenderableChargeItems = createSelector(
  [selectBackendChargeItems, selectChargeItems],
  (backendItems, draftItems): RenderableChargeItem[] => [
    ...backendItems,
    ...draftItems,
  ]
);

/* ----------------------- PERSISTED BALANCE SELECTOR ----------------------- */
export const selectPersistedBalance = createSelector(
  [
    (state: RootState) => toFiniteNumber(state.billing.backendBillingData?.balance, 0),
    (state: RootState) => toFiniteNumber(state.billing.optimisticPersistedBalanceDelta, 0),
  ],
  (serverBalance, optimisticDelta) =>
    roundCurrency(Math.max(0, serverBalance + optimisticDelta))
);

/* -------------------------- PATIENT INFO SELECTOR ------------------------- */
export const selectPatientInfo = (state: RootState) => ({
  visitId: state.billing.visitId,
  patientId: state.billing.patientId,
  patientName: state.billing.patientName,
});

/* ---------------------- EFFECTIVE STATUS SELECTOR ------------------------- */
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

/* -------------------------- CAN PROCEED SELECTOR -------------------------- */
export const selectCanProceed = createSelector(
  [
    (state: RootState) => state.billing.chargeItems.length,
    selectEffectiveBillingStatus,
  ],
  (draftItemCount, effectiveStatus) =>
    draftItemCount > 0 && effectiveStatus !== 'settled'
);

/* ----------------------- CORE DRAFT BILLING SELECTOR ---------------------- */
export const selectBillingData = createSelector(
  [
    (state: RootState) => state.billing.chargeItems,
    (state: RootState) => state.billing.discount,
    (state: RootState) => state.billing.taxes,
    (state: RootState) => state.billing.paymentMethods,
  ],
  (chargeItems, discount, taxes, paymentMethods) => {
    const subtotal = roundCurrency(
      chargeItems.reduce(
        (sum, item) => sum + toFiniteNumber(item.totalAmount, 0),
        0
      )
    );

    const normalizedDiscount = sanitizeDiscount(discount);

    const rawDiscountAmount =
      normalizedDiscount.type === 'percentage'
        ? subtotal * (toFiniteNumber(normalizedDiscount.value, 0) / 100)
        : toFiniteNumber(normalizedDiscount.value, 0);

    const discountAmount = roundCurrency(clamp(rawDiscountAmount, 0, subtotal));

    const taxableAmount = roundCurrency(Math.max(0, subtotal - discountAmount));

    const updatedTaxes = taxes.map((tax) => ({
      ...tax,
      rate: roundCurrency(toFiniteNumber(tax.rate, 0)),
      amount: roundCurrency(
        taxableAmount * (toFiniteNumber(tax.rate, 0) / 100)
      ),
    }));

    const taxTotal = roundCurrency(
      updatedTaxes.reduce((sum, tax) => sum + toFiniteNumber(tax.amount, 0), 0)
    );

    const grandTotal = roundCurrency(taxableAmount + taxTotal);

    const totalPaid = roundCurrency(
      paymentMethods.reduce(
        (sum, method) => sum + toFiniteNumber(method.amount, 0),
        0
      )
    );

    const balance = roundCurrency(Math.max(0, grandTotal - totalPaid));

    return {
      subtotal,
      discountAmount,
      discountType: normalizedDiscount.type,
      discountValue: roundCurrency(toFiniteNumber(normalizedDiscount.value, 0)),
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

/* ---------------------- DISPLAY BILLING DATA SELECTOR --------------------- */
export const selectDisplayBillingData = createSelector(
  [
    selectBillingData,
    selectPersistedBalance,
    selectBackendBillingData,
    selectBackendChargeItems,
    selectChargeItems,
  ],
  (draft, persistedBalance, persistedBillingData, backendChargeItems, draftChargeItems) => {
    const displayedSubtotal = roundCurrency(
      [...backendChargeItems, ...draftChargeItems].reduce(
        (sum, item) => sum + toFiniteNumber(item.totalAmount, 0),
        0
      )
    );

    const persistedGrandTotal = roundCurrency(
      toFiniteNumber(persistedBillingData?.grandTotal, 0)
    );
    const persistedTotalPaid = roundCurrency(
      toFiniteNumber(persistedBillingData?.totalPaid, 0)
    );
    const persistedSubtotal = roundCurrency(
      toFiniteNumber(persistedBillingData?.subtotal, 0)
    );
    const persistedDiscountAmount = roundCurrency(
      toFiniteNumber(
        persistedBillingData?.discountAmount ?? persistedBillingData?.discountAmount,
        0
      )
    );
    const persistedTaxTotal = roundCurrency(
      toFiniteNumber(persistedBillingData?.taxTotal ?? persistedBillingData?.taxTotal, 0)
    );

    const draftGrandTotal = roundCurrency(draft.grandTotal);
    const draftTotalPaid = roundCurrency(draft.totalPaid);
    const draftBalance = roundCurrency(draft.balance);
    const draftDiscountAmount = roundCurrency(draft.discountAmount);
    const draftTaxTotal = roundCurrency(draft.taxTotal);

    const displayedBalance = roundCurrency(persistedBalance + draftGrandTotal);
    const displayedGrandTotal = roundCurrency(persistedGrandTotal + draftGrandTotal);
    const displayedTotalPaid = roundCurrency(persistedTotalPaid + draftTotalPaid);
    const displayedDiscountAmount = roundCurrency(
      persistedDiscountAmount + draftDiscountAmount
    );
    const displayedTaxTotal = roundCurrency(persistedTaxTotal + draftTaxTotal);

    const displayedTaxes = mergeTaxes(
      persistedBillingData?.taxes ?? [],
      draft.taxes ?? []
    );

    return {
      persistedSubtotal,
      persistedGrandTotal,
      persistedTotalPaid,
      persistedBalance,
      persistedDiscountAmount,
      persistedTaxTotal,
      persistedTaxes: persistedBillingData?.taxes ?? [],

      draftSubtotal: roundCurrency(draft.subtotal),
      draftGrandTotal,
      draftTotalPaid,
      draftBalance,
      draftDiscountAmount,
      draftTaxTotal,
      draftTaxes: draft.taxes ?? [],

      displayedSubtotal,
      displayedGrandTotal,
      displayedTotalPaid,
      displayedBalance,
      displayedDiscountAmount,
      displayedTaxTotal,
      displayedTaxes,
    };
  }
);

/* -------- DISPLAYED DISCOUNT + TAX AGAINST RENDERABLE ITEM SUBTOTAL ------- */
export const selectDisplayedDiscountTaxBillingData = createSelector(
  [
    selectRenderableChargeItems,
    (state: RootState) => state.billing.discount,
    (state: RootState) => state.billing.taxes,
    (state: RootState) => state.billing.paymentMethods,
  ],
  (renderableChargeItems, discount, taxes, paymentMethods) => {
    const subtotal = roundCurrency(
      renderableChargeItems.reduce(
        (sum, item) => sum + toFiniteNumber(item.totalAmount, 0),
        0
      )
    );

    const normalizedDiscount = sanitizeDiscount(discount);

    const rawDiscountAmount =
      normalizedDiscount.type === 'percentage'
        ? subtotal * (toFiniteNumber(normalizedDiscount.value, 0) / 100)
        : toFiniteNumber(normalizedDiscount.value, 0);

    const discountAmount = roundCurrency(clamp(rawDiscountAmount, 0, subtotal));

    const taxableAmount = roundCurrency(Math.max(0, subtotal - discountAmount));

    const computedTaxes = taxes.map((tax) => ({
      ...tax,
      rate: roundCurrency(toFiniteNumber(tax.rate, 0)),
      amount: roundCurrency(
        taxableAmount * (toFiniteNumber(tax.rate, 0) / 100)
      ),
    }));

    const taxTotal = roundCurrency(
      computedTaxes.reduce((sum, tax) => sum + toFiniteNumber(tax.amount, 0), 0)
    );

    const grandTotal = roundCurrency(taxableAmount + taxTotal);

    const totalPaid = roundCurrency(
      paymentMethods.reduce(
        (sum, method) => sum + toFiniteNumber(method.amount, 0),
        0
      )
    );

    const balance = roundCurrency(Math.max(0, grandTotal - totalPaid));

    return {
      subtotal,
      discountAmount,
      discountType: normalizedDiscount.type,
      discountValue: roundCurrency(toFiniteNumber(normalizedDiscount.value, 0)),
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

/* ---------------------- BILLING DATA LOADED SELECTOR ---------------------- */
export const selectBillingDataLoaded = (
  state: RootState,
  visitId: string
): boolean => state.billing.billingDataLoaded?.[visitId] || false;