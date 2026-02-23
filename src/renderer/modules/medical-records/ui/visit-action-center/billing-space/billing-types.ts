// billing-types.ts
// Types and shared data for hospital billing workflow
// Single source of truth for billing-item/service shapes is BillingItemsTypes.ts (API types).
// Mock data removed. Components should fetch via BillingItemsQueries.ts and search client-side.

import type { ServiceItemCore } from  '../../../api/billable-items/BillingItemsTypes';
import { DEFAULT_CURRENCY as API_DEFAULT_CURRENCY } from '../../../api/billable-items/BillingItemsTypes';

/* -------------------------------------------------------------------------- */
/*                         BILLABLE SERVICE TYPES (API)                        */
/* -------------------------------------------------------------------------- */

/**
 * Service item used by billing UI.
 * This is derived from BillingItemsTypes.ts as the single source of truth.
 */
export type ServiceItem = ServiceItemCore;

/**
 * A stable composite key for billable/service items.
 * Your backend may merge multiple tables that can share numeric IDs,
 * so we MUST NOT rely on `id` alone for uniqueness.
 */
export type BillableKey = string;

export const makeBillableKey = (s: Pick<ServiceItem, 'id' | 'code' | 'category'>): BillableKey => {
  // code+category are typically stable across tables; id helps when code overlaps.
  // Normalize to avoid accidental key splits.
  const code = String(s.code ?? '').trim().toLowerCase();
  const category = String(s.category ?? '').trim().toLowerCase();
  const id = Number(s.id ?? 0);
  return `${code}::${category}::${id}`;
};

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface ChargeItem {
  id: string; // internal UI id (unique per line item)
  /**
   * Stable key for the underlying billable item (used for merging duplicates).
   * This is how we avoid collisions when backend IDs overlap across tables.
   */
  serviceKey: BillableKey;
  service: ServiceItem;

  quantity: number;
  totalAmount: number;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}

export interface Tax {
  name: string;
  rate: number;
  amount: number;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed';
  amount: number;
  reference?: string;
  details?: string;
}

export type BillingStatus = 'draft' | 'ready' | 'settled';
export type BillingStep = 'charge_entry' | 'billing_summary';

export interface BillingState {
  // Core state
  chargeItems: ChargeItem[];
  discount: Discount;
  taxes: Tax[];
  paymentMethods: PaymentMethod[];
  additionalNotes: string;
  status: BillingStatus;
  receiptNumber?: string;

  // UI state
  trayOpen: boolean;
  currentStep: BillingStep;

  // Patient context
  visitId?: string;
  patientId?: string;
  patientName?: string;

  // Metadata
  lastUpdated: number;
  isDirty: boolean;
  isProcessing: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                 DEFAULTS                                   */
/* -------------------------------------------------------------------------- */

export const DEFAULT_TAXES: Tax[] = [
  { name: 'VAT', rate: 2, amount: 0 },
  { name: 'Service Charge', rate: 1, amount: 0 },
];

export const DEFAULT_DISCOUNT: Discount = {
  type: 'percentage',
  value: 0,
  reason: '',
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [{ type: 'cash', amount: 0, details: '' }];

export const INITIAL_BILLING_STATE: BillingState = {
  chargeItems: [],
  discount: DEFAULT_DISCOUNT,
  taxes: DEFAULT_TAXES,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  additionalNotes: '',
  status: 'draft',
  trayOpen: false,
  currentStep: 'charge_entry',
  lastUpdated: Date.now(),
  isDirty: false,
  isProcessing: false,
};

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

export const formatCurrency = (amount: number, currency: string = API_DEFAULT_CURRENCY): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const generateReceiptNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `REC-${year}${month}${day}-${random}`;
};

export const generateChargeItemId = (serviceKey: BillableKey): string => {
  // serviceKey is stable and prevents cross-table collisions, add time+rand to keep line item unique
  return `charge::${serviceKey}::${Date.now()}::${Math.random().toString(36).slice(2, 10)}`;
};

export const calculateBillingData = (
  chargeItems: ChargeItem[],
  discount: Discount,
  taxes: Tax[],
  paymentMethods: PaymentMethod[]
) => {
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

  const totalPaid = paymentMethods.reduce((sum, method) => sum + (Number(method.amount) || 0), 0);
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

// Storage key for drafts
export const getDraftStorageKey = (visitId?: string) => `billing_draft_${visitId || 'global'}`;

// Re-export the default currency if you want a single import point in UI
export const DEFAULT_CURRENCY = API_DEFAULT_CURRENCY;
