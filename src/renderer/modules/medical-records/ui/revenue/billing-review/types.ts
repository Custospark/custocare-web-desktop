// types.ts
// All TypeScript interfaces and types for the billing system

export interface MockPatient {
  id: number;
  name: string;
  patient_number: string;
  email?: string;
  phone?: string;
}

export interface MockChargeItem {
  id: number;
  service: {
    id: number;
    name: string;
    code: string;
    unitPrice: number;
    category: string;
  };
  quantity: number;
  totalAmount: number;
}

export type PaymentType = 'cash' | 'card' | 'insurance' | 'mobile';

export interface MockPaymentMethod {
  id: string;
  type: PaymentType;
  amount: number;
  details?: string;
  reference?: string;
  status?: 'completed' | 'pending' | 'failed';
}

export type RefundStatus = 'processed' | 'reversed' | 'failed';

export interface RefundLineItem {
  charge_item_id: number;
  service_name: string;
  service_code: string;
  unitPrice: number;
  quantity_refunded: number;
  amount: number; // unitPrice * quantity_refunded
}

export interface RefundRecord {
  id: string;
  refund_receipt_number: string;
  created_at: string; // ISO
  processed_by: string;
  method: PaymentType;
  reference?: string;
  reason: string;
  status: RefundStatus;
  items: RefundLineItem[];
  total_amount: number; // sum(items.amount)
}

export interface VoidRecord {
  voided_at: string; // ISO
  voided_by: string;
  reason: string;
}

export type BaseTransactionStatus = 'settled' | 'ready' | 'draft';
export type DerivedStatus =
  | BaseTransactionStatus
  | 'partially_refunded'
  | 'refunded'
  | 'voided';

export interface MockTransaction {
  id: number;
  visit_id: number;
  receipt_number: string;
  date: string; // YYYY-MM-DD
  time: string; // display
  patient: MockPatient;
  charge_items: MockChargeItem[];
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
  payment_methods: MockPaymentMethod[];
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
  status: BaseTransactionStatus;
  settled_by?: string;
  settled_at?: string;
  refunds?: RefundRecord[];
  voided?: VoidRecord;
}

export interface DerivedFinancials {
  refunded: number;
  netPaid: number;
  balanceDue: number;
  refundableMax: number;
  status: DerivedStatus;
}

export interface FilterState {
  searchTerm: string;
  statusFilter: DerivedStatus | 'all';
  dateRange: { start: string; end: string };
  sortBy: 'date' | 'amount' | 'patient';
  sortOrder: 'asc' | 'desc';
  showAdvancedFilters: boolean;
}

export interface RefundFormState {
  method: PaymentType;
  reference: string;
  reason: string;
  processedBy: string;
  qtyByItem: Record<number, number>;
}

export interface EmailFormState {
  to: string;
  subject: string;
  note: string;
  sending: boolean;
}

export interface VoidFormState {
  reason: string;
  voidedBy: string;
}

export interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Theme colors interface for consistent styling
export interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    elevated: string;
    hover: string;
    selected: string;
  };
  border: {
    primary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  ring: string;
}