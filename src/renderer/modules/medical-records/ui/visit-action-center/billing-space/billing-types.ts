// billing-types.ts
// ============================================================================
// Shared billing types for enterprise healthcare billing workflow
// Supports dual-source rendering:
// 1) Persisted backend billing items
// 2) Unsaved Redux slice draft items
// ============================================================================

import type {
  ServiceItemCore,
  BackendChargeItem as APIBackendChargeItem,
  BillingRetrievalData,
} from '../../../api/billable-items/BillingItemsTypes';
import { DEFAULT_CURRENCY as API_DEFAULT_CURRENCY } from '../../../api/billable-items/BillingItemsTypes';
import type { AuditLogEntry, AuditLogSummary } from '../../../api/billing-review/BillingReviewTypes';
import { store } from '../../../../../app/store/store'; // Adjust path as needed
import { selectActiveFacilityCurrency } from '../../../../../app/store/slices/activeContextSlice'; // Adjust path as needed

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

export type BillingSource = 'slice' | 'backend' | 'refund';
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
   * - a refunded item
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

/* -------------------------------------------------------------------------- */
/*                    REFUNDED ITEM QUANTITY AND AMOUNTS TYPES               */
/* -------------------------------------------------------------------------- */

/**
 * Quantity structure for refunded items
 */
export interface RefundedItemQuantity {
  original: number;
  refunded: number;
  remaining: number;
}

/**
 * Amounts structure for refunded items
 */
export interface RefundedItemAmounts {
  original_subtotal: number;
  refund_subtotal: number;
  remaining_subtotal: number;
}

/**
 * Matched reference for refunded items
 */
export interface RefundedItemMatchedReference {
  id: number | null;
  type: string | null;
}

/* -------------------------------------------------------------------------- */
/*                          BACKEND CHARGE ITEM TYPES                         */
/* -------------------------------------------------------------------------- */

/**
 * Base interface for backend charge items (common fields)
 */
interface BaseBackendChargeItemFields {
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
    adjustment_history?: any[];
    discount_scope?: string;
  };

  /**
   * Full audit log entries for this line item
   * Used by LineItemHistoryModal to display the audit trail
   */
  audit_logs?: AuditLogEntry[];
  
  /**
   * Summary of audit logs (count and last event)
   */
  audit_logs_summary?: AuditLogSummary;
}

/**
 * Persisted billing item retrieved from backend (regular, non-refunded)
 */
export interface BackendChargeItem extends BaseRenderableChargeItem, BaseBackendChargeItemFields {
  source: 'backend';
  persisted: true;
  quantity: number; // Simple number for regular items
}

/**
 * Refunded billing item retrieved from backend
 * This represents a charge item that has been partially or fully refunded
 */
export interface RefundedChargeItem
  extends Omit<BaseRenderableChargeItem, 'quantity' | 'source' | 'persisted'>,
    BaseBackendChargeItemFields {
  source: 'refund';
  persisted: true;
  refunded: true;
  quantity: RefundedItemQuantity;
  adjustment_id?: number;
  adjustment_reference?: string;
  adjustment_type?: string;
  adjustment_created_at?: string;
  amounts?: {
    original_subtotal: number;
    refund_subtotal: number;
    remaining_subtotal: number;
  };
  matched_reference?: {
    id: number | null;
    type: string | null;
  };
}

/**
 * Union type for all backend charge items (regular or refunded)
 */
export type AnyBackendChargeItem = BackendChargeItem | RefundedChargeItem;

export type RenderableChargeItem = ChargeItem | AnyBackendChargeItem;

/* -------------------------------------------------------------------------- */
/*                          BILLING FINANCIAL TYPES                           */
/* -------------------------------------------------------------------------- */

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
  backendChargeItems: AnyBackendChargeItem[];
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

function normalizeDiscount(discount: any) {
  if (!discount) return discount;
  return {
    type: discount.type,
    value: discount.value,
    reason: discount.reason === null ? undefined : discount.reason
  };
}

export const isRefundedItemQuantity = (
  quantity: number | RefundedItemQuantity
): quantity is RefundedItemQuantity => {
  return typeof quantity === 'object' && quantity !== null;
};

export const getChargeItemQuantity = (
  item: { quantity: number | RefundedItemQuantity }
): number => {
  return isRefundedItemQuantity(item.quantity) ? item.quantity.remaining : item.quantity;
};

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

/**
 * Get the current facility currency from Redux store
 * Falls back to 'USD' if not available
 */
import { formatCurrency as sharedFormatCurrency, formatCurrencyWithCustomCurrency as sharedFormatCurrencyWithCustom } from '../../../../../shared/utils/formatCurrency';

/**
 * Format currency using facility's configured currency
 * Falls back to USD if no facility currency is set
 */
export const formatCurrency = (amount: number, currency?: string): string => {
  return sharedFormatCurrency(amount, currency);
};

/**
 * Format currency with custom currency parameter (overrides facility config)
 */
export const formatCurrencyWithCustomCurrency = (amount: number, currencyCode: string): string => {
  return sharedFormatCurrencyWithCustom(amount, currencyCode);
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

/* -------------------------------------------------------------------------- */
/*                          TYPE GUARD FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

/**
 * Check if a backend charge item is a refunded item
 */
export const isRefundedChargeItem = (item: AnyBackendChargeItem): item is RefundedChargeItem => {
  return item.source === 'refund';
};

/**
 * Check if a backend charge item is a regular (non-refunded) item
 */
export const isRegularBackendChargeItem = (item: AnyBackendChargeItem): item is BackendChargeItem => {
  return item.source === 'backend';
};

/**
 * Get numeric quantity from any charge item
 * For regular items: returns the quantity number
 * For refunded items: returns the remaining quantity
 */
export const getNumericQuantity = (item: AnyBackendChargeItem | ChargeItem): number => {
  if (isRefundedChargeItem(item as AnyBackendChargeItem)) {
    return (item as RefundedChargeItem).quantity.remaining;
  }
  return getChargeItemQuantity(item);
};

/**
 * Get original quantity (for refunded items)
 * For regular items: returns the quantity
 */
export const getOriginalQuantity = (item: AnyBackendChargeItem | ChargeItem): number => {
  if (isRefundedChargeItem(item as AnyBackendChargeItem)) {
    return (item as RefundedChargeItem).quantity.original;
  }
  return getChargeItemQuantity(item);
};

/**
 * Get refunded quantity (for refunded items)
 * For regular items: returns 0
 */
export const getRefundedQuantity = (item: AnyBackendChargeItem | ChargeItem): number => {
  if (isRefundedChargeItem(item as AnyBackendChargeItem)) {
    return (item as RefundedChargeItem).quantity.refunded;
  }
  return 0;
};

/* -------------------------------------------------------------------------- */
/*                          MAPPING FUNCTIONS                                 */
/* -------------------------------------------------------------------------- */

/**
 * Maps backend-retrieved line item into the exact UI render shape expected by the list.
 * Handles both regular and refunded items appropriately.
 * Now includes audit_logs and audit_logs_summary for history modal support.
 */
export const mapRetrievedChargeItemToBackendChargeItem = (
  item: APIBackendChargeItem
): AnyBackendChargeItem => {
  const serviceKey = item.serviceKey || item.service_key || makeBillableKey(item.service);
  
  // Type-safe quantity extraction
  let quantityValue: number | RefundedItemQuantity;
  let isRefunded = false;
  
  // Check if this is a refunded item
  if (item.refunded === true || item.source === 'refund') {
    isRefunded = true;
    // It's a refunded item - quantity should be an object
    if (typeof item.quantity === 'object' && item.quantity !== null && 'remaining' in item.quantity) {
      quantityValue = item.quantity as RefundedItemQuantity;
    } else {
      // Fallback: create a default refunded quantity object
      quantityValue = {
        original: typeof item.quantity === 'number' ? item.quantity : 0,
        refunded: 0,
        remaining: typeof item.quantity === 'number' ? item.quantity : 0,
      };
    }
  } else {
    // Regular item - quantity should be a number
    if (typeof item.quantity === 'number') {
      quantityValue = item.quantity;
    } else if (typeof item.quantity === 'object' && item.quantity !== null && 'remaining' in item.quantity) {
      // If it's an object but not marked as refunded, extract remaining
      quantityValue = (item.quantity as RefundedItemQuantity).remaining;
    } else {
      quantityValue = 0;
    }
  }
  
  const baseFields = {
    id: item.id,
    serviceKey,
    service: item.service,
    totalAmount: Number(item.totalAmount || 0),
    
    persisted: true as const,
    
    lineItemId: Number(item.line_item_id),
    lineItemUuid: item.line_item_uuid,
    billingCycleId: item.billing_cycle_id,
    lineItemStatus: item.line_item_status,
    
    enteredByStaffId: item.entered_by_staff_id,
    enteredByStaffName: item.entered_by_staff_name,
    
    permissions: item.permissions,
    audit: item.audit,
    
    // Include audit logs for history modal
    audit_logs: item.audit_logs,
    audit_logs_summary: item.audit_logs_summary,
  };
  
  if (isRefunded) {
    // Handle refunded item
    return {
      ...baseFields,
      source: 'refund' as const,
      quantity: quantityValue as RefundedItemQuantity,
      refunded: true,
      adjustment_id: (item as any).adjustment_id,
      adjustment_reference: (item as any).adjustment_reference,
      adjustment_type: (item as any).adjustment_type,
      adjustment_created_at: (item as any).adjustment_created_at,
      amounts: (item as any).amounts,
      matched_reference: (item as any).matched_reference,
    } as RefundedChargeItem;
  } else {
    // Handle regular item
    return {
      ...baseFields,
      source: 'backend' as const,
      quantity: quantityValue as number,
    } as BackendChargeItem;
  }
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

// Re-export DEFAULT_CURRENCY for backward compatibility
// This now dynamically gets the facility currency
export const DEFAULT_CURRENCY = (() => {
  try {
    return getCurrentFacilityCurrency();
  } catch {
    return API_DEFAULT_CURRENCY;
  }
})();

// For static imports that need a constant, also export the original API default
export { API_DEFAULT_CURRENCY };