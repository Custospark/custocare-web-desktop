// billingSlice.ts
// Redux slice for billing state management with slices pattern

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChargeItem, ServiceItem, Discount, Tax, PaymentMethod, BillingStep } from '../billing/billing-types';
import { DEFAULT_DISCOUNT, DEFAULT_TAXES } from '../billing/billing-types';

interface BillingState {
  // Tray state
  isTrayOpen: boolean;
  currentStep: BillingStep;
  
  // Charge items
  charges: ChargeItem[];
  
  // Billing adjustments
  discount: Discount;
  taxes: Tax[];
  paymentMethods: PaymentMethod[];
  
  // Patient context
  visitId: string | null;
  patientName: string | null;
  patientNumber: string | null;
  
  // Dirty tracking
  isDirty: boolean;
}

const initialState: BillingState = {
  isTrayOpen: false,
  currentStep: 'charge_entry',
  charges: [],
  discount: DEFAULT_DISCOUNT,
  taxes: DEFAULT_TAXES,
  paymentMethods: [{ type: 'cash', amount: 0 }],
  visitId: null,
  patientName: null,
  patientNumber: null,
  isDirty: false,
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    // Tray actions
    openTray: (state, action: PayloadAction<BillingStep | undefined>) => {
      state.isTrayOpen = true;
      if (action.payload) {
        state.currentStep = action.payload;
      }
    },
    
    closeTray: (state) => {
      state.isTrayOpen = false;
    },
    
    setStep: (state, action: PayloadAction<BillingStep>) => {
      state.currentStep = action.payload;
    },
    
    // Charge actions
    addCharge: (state, action: PayloadAction<ServiceItem>) => {
      const existing = state.charges.find(c => c.service.id === action.payload.id);
      
      if (existing) {
        existing.quantity += 1;
        existing.totalAmount = existing.quantity * existing.service.unitPrice;
      } else {
        state.charges.push({
          id: `charge-${Date.now()}-${action.payload.id}`,
          service: action.payload,
          quantity: 1,
          totalAmount: action.payload.unitPrice,
        });
      }
      
      state.isDirty = true;
    },
    
    increaseQty: (state, action: PayloadAction<string>) => {
      const item = state.charges.find(c => c.id === action.payload);
      if (item) {
        item.quantity += 1;
        item.totalAmount = item.quantity * item.service.unitPrice;
        state.isDirty = true;
      }
    },
    
    decreaseQty: (state, action: PayloadAction<string>) => {
      const item = state.charges.find(c => c.id === action.payload);
      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
          item.totalAmount = item.quantity * item.service.unitPrice;
        } else {
          state.charges = state.charges.filter(c => c.id !== action.payload);
        }
        state.isDirty = true;
      }
    },
    
    removeLine: (state, action: PayloadAction<string>) => {
      state.charges = state.charges.filter(c => c.id !== action.payload);
      state.isDirty = state.charges.length > 0;
    },
    
    clearCharges: (state) => {
      state.charges = [];
      state.isDirty = false;
    },
    
    // Billing adjustments
    setDiscount: (state, action: PayloadAction<Discount>) => {
      state.discount = action.payload;
      state.isDirty = true;
    },
    
    setPaymentMethods: (state, action: PayloadAction<PaymentMethod[]>) => {
      state.paymentMethods = action.payload;
      state.isDirty = true;
    },
    
    // Patient context
    setPatientContext: (state, action: PayloadAction<{
      visitId: string;
      patientName: string;
      patientNumber: string;
    }>) => {
      state.visitId = action.payload.visitId;
      state.patientName = action.payload.patientName;
      state.patientNumber = action.payload.patientNumber;
    },
    
    // Reset
    resetBilling: () => initialState,
    
    // Mark as clean (after save)
    markClean: (state) => {
      state.isDirty = false;
    },
  },
});

// Selectors
export const selectBillingState = (state: { billing: BillingState }) => state.billing;
export const selectCharges = (state: { billing: BillingState }) => state.billing.charges;
export const selectSubtotal = (state: { billing: BillingState }) => {
  // Using optional chaining and nullish coalescing
  const charges = state?.billing?.charges ?? [];
  
  if (!Array.isArray(charges)) return 0;
  
  return charges.reduce((sum, item) => {
    const amount = item?.totalAmount ?? 0;
    return sum + (typeof amount === 'number' ? amount : 0);
  }, 0);
};
export const selectIsDirty = (state: { billing: BillingState }) => state.billing.isDirty;
export const selectCanProceed = (state: { billing: BillingState }) => {
  // Provide default empty array if charges is undefined
  const charges = state?.billing?.charges ?? [];
  
  // Ensure it's an array before checking length
  return Array.isArray(charges) && charges.length > 0;
};
export const {
  openTray,
  closeTray,
  setStep,
  addCharge,
  increaseQty,
  decreaseQty,
  removeLine,
  clearCharges,
  setDiscount,
  setPaymentMethods,
  setPatientContext,
  resetBilling,
  markClean,
} = billingSlice.actions;

export default billingSlice.reducer;