import type { Tax, PaymentMethod, PaymentStatus } from '../../../../api/billing-review/BillingReviewTypes';
import type { RenderableChargeItem } from '../billing-types';

export interface ReceiptBillingDataShape {
  servicesSubtotal?: number;
  existingBalance?: number;
  newItemsSubtotal?: number;
  newItemsDiscountAmount?: number;
  newItemsTaxableAmount?: number;
  newItemsTaxTotal?: number;
  newItemsGrandTotal?: number;

  subtotal: number;
  discountAmount: number;
  discountValue?: number;
  discountType?: 'percentage' | 'fixed' | null;
  taxableAmount: number;
  taxTotal: number;
  grandTotal: number;
  totalPaid: number;
  balance: number;
  taxes: Tax[];
}

export interface ReceiptTransactionShape {
  receipt_number: string | null;
  patient_name: string;
  patient_number: string;
  created_at: string;
  charge_items: RenderableChargeItem[];
  billing_data: ReceiptBillingDataShape;
  payment_methods: PaymentMethod[];
  additional_notes?: string;
  facilityData?: any;
  payment_status?: PaymentStatus | string;
  billing_status?: string;
  attending_staff_display?: string | null;
  attending_staff_name?: string | null;
  attending_staff_role?: string | null;
  [key: string]: any;
}

export interface DerivedFinancials {
  status: PaymentStatus;
  refunded: number;
  netPaid: number;
  balanceDue: number;
  grandTotal: number;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountType: 'percentage' | 'fixed' | null;
  taxTotal: number;
  totalPaidFromMethods: number;
  cashTendered: number;
  changeAmount: number;
  hasCashPayment: boolean;
  nonCashTotal: number;
}

export interface CashBreakdown {
  tendered: number;
  change: number;
  netCash: number;
}

export interface NormalizedBillingView {
  transaction: ReceiptTransactionShape;
  derivedFinancials: DerivedFinancials;
  cashBreakdown: CashBreakdown | null;
  billingData: ReceiptBillingDataShape;
}

export interface BillingSummaryStepProps {
  theme?: 'light' | 'dark';
  visitId?: number;
  patientId?: number;
}

export interface ComputedDiscountSnapshot {
  discountType: 'percentage' | 'fixed' | null;
  rawDiscountValue: number;
  discountPercent: number;
  discountAmount: number;
}

export type BillingSummaryTheme = 'light' | 'dark';
