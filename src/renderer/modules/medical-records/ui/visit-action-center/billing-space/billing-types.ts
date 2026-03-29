// billing-types.ts
// ============================================================================
// Shared billing types for enterprise healthcare billing workflow
// Supports dual-source rendering:
// 1) Persisted backend billing items
// 2) Unsaved Redux slice draft items
// ============================================================================

import type {
  ServiceItemCore,
  BillingRetrievedChargeItem,
  BillingRetrievalData,
} from '../../../api/billable-items/BillingItemsTypes';
import { DEFAULT_CURRENCY as API_DEFAULT_CURRENCY } from '../../../api/billable-items/BillingItemsTypes';

/* -------------------------------------------------------------------------- */
/*                         BILLABLE SERVICE TYPES (API)                        */
/* -------------------------------------------------------------------------- */

export type ServiceItem = ServiceItemCore;

/**
 * Stable key used to identify the underlying billable item.
 * We do NOT rely on numeric ID alone because backend sources may overlap.
 */
export type BillableKey = string;

export const makeBillableKey = (s: Pick<ServiceItem, 'id' | 'code' | 'category'>): BillableKey => {
  const code = String(s.code ?? '').trim().toLowerCase();
  const category = String(s.category ?? '').trim().toLowerCase();
  const id = Number(s.id ?? 0);
  return `${code}::${category}::${id}`;
};

export const createDefaultDiscount = (): Discount => ({
  type: 'percentage',
  value: 0,
  reason: '',
});

export const createDefaultTaxes = (): Tax[] => [
  { name: 'VAT', rate: 0, amount: 0 },
  { name: 'Service Charge', rate: 0, amount: 0 },
];

export const createDefaultPaymentMethods = (): PaymentMethod[] => [
  { type: 'cash', amount: 0, details: '' },
];

/* -------------------------------------------------------------------------- */
/*                              SOURCE / POLICY TYPES                         */
/* -------------------------------------------------------------------------- */

export type BillingSource = 'slice' | 'backend';
export type BillingStatus = 'draft' | 'ready' | 'settled';
export type BillingStep = 'charge_entry' | 'billing_summary';
export type BillingAdjustmentAction = 'increase' | 'decrease' | 'remove';
export type BillingTrayViewMode = 'expanded' | 'minimized';

export interface LineItemEditPermissions {
  entered_by_staff_id?: number | null;
  current_staff_id?: number | null;
  requires_reason_on_cross_staff_edit: boolean;
  reason_required: boolean;
  can_edit_without_reason: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                CORE TYPES                                  */
/* -------------------------------------------------------------------------- */

export interface BaseRenderableChargeItem {
  id: string;
  serviceKey: BillableKey;
  service: ServiceItem;
  quantity: number;
  totalAmount: number;

  /**
   * Source tells the UI whether this row is:
   * - a persisted backend item
   * - a draft slice item
   */
  source: BillingSource;

  /**
   * Convenience flag for enterprise edit behavior.
   */
  persisted: boolean;
}

/**
 * Draft item held only in Redux until user saves billing.
 */
export interface ChargeItem extends BaseRenderableChargeItem {
  source: 'slice';
  persisted: false;
}

/**
 * Persisted billing item retrieved from backend.
 * This must carry audit/edit metadata.
 */
export interface BackendChargeItem extends BaseRenderableChargeItem {
  source: 'backend';
  persisted: true;

  lineItemId: number;
  lineItemUuid?: string;
  billingCycleId?: number;
  lineItemStatus?: string;

  enteredByStaffId?: number | null;
  enteredByStaffName?: string | null;

  permissions: LineItemEditPermissions;

  audit?: {
    originated_by_staff_id?: number | null;
    last_adjusted_by_staff_id?: number | null;
    last_appended_by_staff_id?: number | null;
    last_adjusted_at?: string | null;
  };
}

export type RenderableChargeItem = ChargeItem | BackendChargeItem;

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

export interface BillingDataSnapshot {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxTotal: number;
  grandTotal: number;
  totalPaid: number;
  balance: number;
  isPaid?: boolean;
  taxes?: Tax[];
}

export interface BackendBillingMeta {
  loaded: boolean;
  hasBilling: boolean;

  billingCycleId?: number;
  billingCycleUuid?: string;
  receiptNumber?: string;

  status?: BillingStatus;
  billingStatus?: string;
  paymentStatus?: string;

  attendingStaffId?: number | null;
  attendingStaffName?: string | null;
  attendingStaffRole?: string | null;
  attendingStaffDisplay?: string | null;

  billedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingState {
  // ----------------------------
  // Draft slice data (unsaved)
  // ----------------------------
  chargeItems: ChargeItem[];
  discount: Discount;
  taxes: Tax[];
  paymentMethods: PaymentMethod[];
  additionalNotes: string;
  status: BillingStatus;
  receiptNumber?: string;

  // ----------------------------
  // Persisted backend data
  // ----------------------------
  backendChargeItems: BackendChargeItem[];
  backendBillingMeta: BackendBillingMeta;
  backendBillingData: BillingDataSnapshot | null;

  // Persisted billing basis for discount/tax calculations
  backendDiscount: Discount | null;
  backendTaxes: Tax[];

  // ----------------------------
  // Optimistic persisted billing state
  // ----------------------------
  optimisticPersistedBalanceDelta: number;

  // ----------------------------
  // UI state
  // ----------------------------
  trayOpen: boolean;
  currentStep: BillingStep;
  viewMode: BillingTrayViewMode;

  // ----------------------------
  // Patient context
  // ----------------------------
  visitId?: string;
  patientId?: string;
  patientName?: string;

  // ----------------------------
  // Metadata
  // ----------------------------
  lastUpdated: number;
  isDirty: boolean;
  isProcessing: boolean;

  billingDataLoaded?: Record<string, boolean>;
}

/* -------------------------------------------------------------------------- */
/*                                 DEFAULTS                                   */
/* -------------------------------------------------------------------------- */

export const DEFAULT_TAXES: Tax[] = [
  { name: 'VAT', rate: 0, amount: 0 },
  { name: 'Service Charge', rate: 0, amount: 0 },
];

export const DEFAULT_DISCOUNT: Discount = {
  type: 'percentage',
  value: 0,
  reason: '',
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [{ type: 'cash', amount: 0, details: '' }];

export const EMPTY_BACKEND_META: BackendBillingMeta = {
  loaded: false,
  hasBilling: false,
};

export const INITIAL_BILLING_STATE: BillingState = {
  chargeItems: [],
  discount: createDefaultDiscount(),
  taxes: createDefaultTaxes(),
  paymentMethods: createDefaultPaymentMethods(),
  additionalNotes: '',
  status: 'draft',
  receiptNumber: undefined,

  backendChargeItems: [],
  backendBillingMeta: EMPTY_BACKEND_META,
  backendBillingData: null,
  backendDiscount: null,
  backendTaxes: [],

  optimisticPersistedBalanceDelta: 0,

  trayOpen: false,
  currentStep: 'charge_entry',
  viewMode: 'expanded',

  visitId: undefined,
  patientId: undefined,
  patientName: undefined,

  lastUpdated: Date.now(),
  isDirty: false,
  isProcessing: false,
};

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

const roundCurrencyValue = (value: number): number => Math.round((Number(value) || 0) * 100) / 100;

const normalizeDiscount = (discount?: Partial<Discount> | null): Discount => ({
  type: discount?.type === 'fixed' ? 'fixed' : 'percentage',
  value: Number(discount?.value || 0),
  reason: discount?.reason ?? '',
});

const normalizeTaxes = (taxes?: Array<Partial<Tax>> | null): Tax[] => {
  if (!Array.isArray(taxes) || taxes.length === 0) {
    return createDefaultTaxes();
  }

  return taxes.map((tax) => ({
    name: String(tax.name || ''),
    rate: Number(tax.rate || 0),
    amount: roundCurrencyValue(Number(tax.amount || 0)),
  }));
};

const getDiscountAmount = (subtotal: number, discount: Discount): number => {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const safeValue = Math.max(0, Number(discount?.value) || 0);

  const rawDiscount =
    discount?.type === 'percentage'
      ? safeSubtotal * (safeValue / 100)
      : safeValue;

  return roundCurrencyValue(Math.min(rawDiscount, safeSubtotal));
};

export const calculateBillingSnapshot = ({
  chargeItems,
  discount,
  taxes,
  paymentMethods,
  carriedPaid = 0,
}: {
  chargeItems: Array<{ totalAmount: number }>;
  discount: Discount;
  taxes: Tax[];
  paymentMethods: PaymentMethod[];
  carriedPaid?: number;
}): BillingDataSnapshot => {
  const subtotal = roundCurrencyValue(
    chargeItems.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0)
  );

  const discountAmount = getDiscountAmount(subtotal, discount);
  const taxableAmount = roundCurrencyValue(Math.max(0, subtotal - discountAmount));

  const updatedTaxes = taxes.map((tax) => ({
    ...tax,
    rate: Number(tax.rate) || 0,
    amount: roundCurrencyValue(taxableAmount * ((Number(tax.rate) || 0) / 100)),
  }));

  const taxTotal = roundCurrencyValue(
    updatedTaxes.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0)
  );

  const grandTotal = roundCurrencyValue(taxableAmount + taxTotal);

  const draftPaid = roundCurrencyValue(
    paymentMethods.reduce((sum, method) => sum + (Number(method.amount) || 0), 0)
  );

  const totalPaid = roundCurrencyValue((Number(carriedPaid) || 0) + draftPaid);
  const balance = roundCurrencyValue(Math.max(0, grandTotal - totalPaid));

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxTotal,
    grandTotal,
    totalPaid,
    balance,
    isPaid: balance === 0,
    taxes: updatedTaxes,
  };
};

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
  return `charge::${serviceKey}::${Date.now()}::${Math.random().toString(36).slice(2, 10)}`;
};

export const calculateBillingData = (
  chargeItems: ChargeItem[],
  discount: Discount,
  taxes: Tax[],
  paymentMethods: PaymentMethod[]
): BillingDataSnapshot => {
  return calculateBillingSnapshot({
    chargeItems,
    discount,
    taxes,
    paymentMethods,
  });
};

/**
 * Maps backend-retrieved line item into the exact UI render shape expected by the list.
 */
export const mapRetrievedChargeItemToBackendChargeItem = (
  item: BillingRetrievedChargeItem
): BackendChargeItem => {
  const serviceKey = item.serviceKey || item.service_key || makeBillableKey(item.service);

  return {
    id: item.id,
    serviceKey,
    service: item.service,
    quantity: Number(item.quantity || 0),
    totalAmount: Number(item.totalAmount || 0),

    source: 'backend',
    persisted: true,

    lineItemId: Number(item.line_item_id),
    lineItemUuid: item.line_item_uuid,
    billingCycleId: item.billing_cycle_id,
    lineItemStatus: item.line_item_status,

    enteredByStaffId: item.entered_by_staff_id,
    enteredByStaffName: item.entered_by_staff_name,

    permissions: item.permissions,
    audit: item.audit,
  };
};

/**
 * Maps backend retrieval payload into frontend backend state bucket.
 */
export const mapRetrievedBillingToBackendState = (data: BillingRetrievalData) => {
  const backendDiscount = normalizeDiscount(data.discount);
  const backendTaxes = normalizeTaxes(data.taxes);

  return {
    backendChargeItems: (data.charge_items ?? []).map(mapRetrievedChargeItemToBackendChargeItem),
    backendBillingMeta: {
      loaded: true,
      hasBilling: !!data.has_billing,
      billingCycleId: data.billing_cycle_id,
      billingCycleUuid: data.billing_cycle_uuid,
      receiptNumber: data.receipt_number,
      status: data.status,
      billingStatus: data.billing_status,
      paymentStatus: data.payment_status,
      attendingStaffId: data.attending_staff_id,
      attendingStaffName: data.attending_staff_name,
      attendingStaffRole: data.attending_staff_role,
      attendingStaffDisplay: data.attending_staff_display,
      billedAt: data.billed_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } as BackendBillingMeta,
    backendBillingData: data.billing_data
      ? {
          ...data.billing_data,
          taxes: backendTaxes,
        }
      : null,
    backendDiscount,
    backendTaxes,
  };
};

// Storage key for drafts
export const getDraftStorageKey = (visitId?: string) => `billing_draft_${visitId || 'global'}`;

export const DEFAULT_CURRENCY = API_DEFAULT_CURRENCY;