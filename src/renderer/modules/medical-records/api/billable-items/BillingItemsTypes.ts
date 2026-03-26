/**
 * BillableItemTypes.ts
 * ============================================================================
 * BILLING ITEMS TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript type declarations for billable items
 * (inventory items and services) operations in the healthcare billing system.
 * 
 * @module billingItemsTypes
 */

/* -------------------------------------------------------------------------- */
/*                                   ENUMS                                    */
/* -------------------------------------------------------------------------- */
import { PaymentStatus } from '../billing-review/BillingReviewTypes';
export enum BillableItemType {
  INVENTORY = 'inventory',
  SERVICE = 'service',
  ALL = 'all',
}

export enum ItemStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum CodeSystem {
  CPT = 'cpt',
  ICD10 = 'icd10',
  CDT = 'cdt',
  HCPCS = 'hcpcs',
  LOCAL = 'local',
}

/* -------------------------------------------------------------------------- */
/*                              NESTED TYPES                                  */
/* -------------------------------------------------------------------------- */

export interface InventoryStock {
  available_packages: number;
  available_units: number;
  units_per_package: number;
  has_stock: boolean;
  is_low_stock: boolean;
}

export interface ServiceStock {
  has_stock: true;
  available: 'unlimited';
}

export type ItemStock = InventoryStock | ServiceStock;

export interface BaseBillableItem {
  id: number;
  code: string;
  name: string;
  unitPrice: number;
  category: string;
  _type: BillableItemType;
  _uuid: string;
  status: ItemStatus;
  is_active: boolean;
}

export interface InventoryItem extends BaseBillableItem {
  _type: BillableItemType.INVENTORY;
  description: string;
  subcategory: string | null;
  generic_name: string | null;
  brand_name: string | null;
  dosage_form: string | null;
  strength: string | null;
  unit_of_measure: string;
  package_quantity: number;
  requires_prescription: boolean;
  currency: string;
  stock: InventoryStock;
}

export interface ServiceItem extends BaseBillableItem {
  _type: BillableItemType.SERVICE;
  currency: string;
  code_system: CodeSystem;
  default_duration_minutes: number | null;
  risk_level: RiskLevel | null;
  requires_consent: boolean;
  stock: ServiceStock;
}

export type BillableItem = InventoryItem | ServiceItem;

export interface ServiceItemCore {
  id: number;
  code: string;
  name: string;
  unitPrice: number;
  category: string;
}

export interface GroupedCategoryItems {
  category: string;
  items: ServiceItemCore[];
  count: number;
}

export type LowStockItem = InventoryItem;



/* -------------------------------------------------------------------------- */
/*                        BILLING SUBMISSION TYPES                            */
/* -------------------------------------------------------------------------- */
export interface BillingSubmissionPayload {
  visit_id: number;
  patient_id: number;
  charge_items: Array<{
    service_key: string;
    service: ServiceItemCore;
    quantity: number;
    totalAmount: number;
  }>;
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  taxes: Array<{
    name: string;
    rate: number;
    amount: number;
  }>;
  payment_methods: Array<{
    type: 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed';
    amount: number;
    reference?: string;
    details?: string;
  }>;
  billing_data: {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxTotal: number;
    grandTotal: number;
    totalPaid: number;
    balance: number;
  };
  additional_notes?: string;

  /**
   * UI/workflow billing state.
   * For saved-but-unpaid billing records we keep this as `ready`.
   * `settled` should only be used after successful payment completion.
   */
  status: 'draft' | 'ready' | 'settled';

  /**
   * Explicit payment lifecycle state sent to the backend.
   * For Save & Exit and Forward Patient flows this must always be `pending`.
   */
  payment_status?: PaymentStatus;
}


export interface BillingSubmissionResponse {
  success: boolean;
  message: string;
  data: {
    billing_cycle_id: number;
    billing_cycle_uuid: string;
    receipt_number: string;
    billing_status: string;
    net_amount: number;
    created_at: string;
    line_items_count: number;
  };
}


export type UiBillingStatus = 'draft' | 'ready' | 'settled';
export type BillingAdjustmentAction = 'increase' | 'decrease' | 'remove';

export interface BillingChargeItemPermissions {
  entered_by_staff_id?: number | null;
  current_staff_id?: number | null;
  requires_reason_on_cross_staff_edit: boolean;
  reason_required: boolean;
  can_edit_without_reason: boolean;
}

export interface BillingRetrievedChargeItem {
  id: string;
  source: 'backend';
  persisted: true;

  line_item_id: number;
  line_item_uuid?: string;
  billing_cycle_id?: number;

  service_key: string;
  serviceKey?: string;

  service: ServiceItemCore;
  quantity: number;
  totalAmount: number;

  line_item_status?: string;

  entered_by_staff_id?: number | null;
  entered_by_staff_name?: string | null;

  permissions: BillingChargeItemPermissions;
  audit?: {
    originated_by_staff_id?: number | null;
    last_adjusted_by_staff_id?: number | null;
    last_appended_by_staff_id?: number | null;
    last_adjusted_at?: string | null;
  };
}

export interface BillingRetrievalData {
  has_billing: boolean;
  visit_id: number;
  visit_uuid?: string;
  patient_id: number;
  patient_number?: string;
  patient_name: string;

  billing_cycle_id?: number;
  billing_cycle_uuid?: string;
  receipt_number?: string;

  attending_staff_id?: number | null;
  attending_staff_name?: string | null;
  attending_staff_role?: string | null;
  attending_staff_display?: string | null;

  charge_items?: BillingRetrievedChargeItem[];
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string | null;
  };
  taxes?: Array<{
    name: string;
    rate: number;
    amount: number;
  }>;
  payment_methods?: Array<{
    type: 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed';
    amount: number;
    reference?: string;
    details?: string;
  }>;
  additional_notes?: string;

  status?: UiBillingStatus;
  billing_status?: string;
  payment_status?: string;

  billing_data?: {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxTotal: number;
    grandTotal: number;
    totalPaid: number;
    balance: number;
    isPaid?: boolean;
  };

  billed_at?: string;
  created_at?: string;
  updated_at?: string;
  last_updated?: number;
  is_dirty?: boolean;
  is_processing?: boolean;
}

export interface BillingAdjustmentPayload {
  line_item_id: number;
  action: BillingAdjustmentAction;
  quantity?: number;
  reason?: string;
}

export interface BillingAdjustmentResponse {
  success: boolean;
  message: string;
  data: {
    billing_cycle_id: number;
    billing_cycle_uuid: string;
    line_item_id: number;
    line_item_uuid: string;
    billing_status: string;
    total_paid: number;
    balance: number;
  };
}


export interface BillingRetrievalResponse {
  success: boolean;
  message: string;
  data: BillingRetrievalData;
}



/* -------------------------------------------------------------------------- */
/*                          REQUEST/RESPONSE TYPES                            */
/* -------------------------------------------------------------------------- */

export interface BillableItemsFilters {
  category?: string | null;
  search?: string | null;
  limit?: number | null;
  include_inactive?: boolean | null;
  type?: BillableItemType | null;
}

export interface BillableItemsSummary {
  total_items: number;
  total_inventory: number;
  total_services: number;
  categories: string[];
  total_value: number;
  average_price: number;
}

export interface BillableItemsMeta {
  facility_id: number;
  filters_applied: Partial<BillableItemsFilters>;
  timestamp: string;
}

export interface BillableItemsData {
  services: ServiceItemCore[];
  items_full: BillableItem[];
  grouped_by_category: GroupedCategoryItems[];
  low_stock_items: LowStockItem[];
}

export interface BillableItemsResponse {
  success: boolean;
  message: string;
  data: BillableItemsData;
  summary: BillableItemsSummary;
  meta: BillableItemsMeta;
}
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error?: string; // Debug error message (only in development)
}
/* -------------------------------------------------------------------------- */
/*                              UTILITY TYPES                                 */
/* -------------------------------------------------------------------------- */

export type FacilityId = number;

export function isInventoryItem(item: BillableItem): item is InventoryItem {
  return item._type === BillableItemType.INVENTORY;
}

export function isServiceItem(item: BillableItem): item is ServiceItem {
  return item._type === BillableItemType.SERVICE;
}

export function isInventoryStock(stock: ItemStock): stock is InventoryStock {
  return 'available_packages' in stock;
}

export interface MutationCallbacks<TData, TError = Error> {
  onSuccess?: (data: TData) => void;
  onError?: (error: TError) => void;
}

/* -------------------------------------------------------------------------- */
/*                            CONSTANTS & DEFAULTS                            */
/* -------------------------------------------------------------------------- */

export const DEFAULT_CURRENCY = 'UGX';
export const DEFAULT_ITEM_LIMIT = 500;
export const MAX_ITEM_LIMIT = 500;

export function getAvailableQuantity(item: InventoryItem): number {
  return item.stock.available_units;
}

export function hasSufficientStock(item: InventoryItem, requiredQuantity: number): boolean {
  return item.stock.available_units >= requiredQuantity;
}

export function formatItemDisplayName(item: BillableItem): string {
  if (isInventoryItem(item)) {
    const parts = [item.name];
    if (item.strength) parts.push(item.strength);
    if (item.dosage_form) parts.push(item.dosage_form);
    if (item.brand_name && item.brand_name !== item.generic_name) {
      parts.push(`(${item.brand_name})`);
    }
    return parts.join(' ');
  }
  return item.name;
}