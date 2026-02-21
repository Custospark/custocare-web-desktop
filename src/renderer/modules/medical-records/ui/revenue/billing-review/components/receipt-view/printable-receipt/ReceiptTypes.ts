// ReceiptTypes.ts
import type {ChargeItem, Tax, PaymentMethod, BillingData } from  '../../../../../../api/billing-review/BillingReviewTypes';
import { PaymentStatus } from '../../../../../../api/billing-review/BillingReviewTypes';

/* -------------------------------------------------------------------------- */
/*                              CONSTANTS                                     */
/* -------------------------------------------------------------------------- */

export const WATERMARK_OPACITY = 0.5;
export const Z_INDEX = {
  BACKGROUND: 0,
  WATERMARK: 1,
  CONTENT: 2,
};

/* -------------------------------------------------------------------------- */
/*                              TYPE DEFINITIONS                              */
/* -------------------------------------------------------------------------- */

export interface DerivedFinancials {
  status: any;
  refunded: number;
  netPaid: number;
  balanceDue: number;
  grandTotal: number;
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  discountType: any;
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

export interface ReceiptTransactionShape {
  receipt_number: string | null;
  patient_name: string;
  patient_number: string;
  created_at: string;
  charge_items: ChargeItem[];
  billing_data: BillingData;
  payment_methods: PaymentMethod[];
  additional_notes?: string;
  facilityData?: any;
  attending_staff_id?: number | null;
  attending_staff_name?: string | null;
  attending_staff_role?: string | null;
  attending_staff_display?: string | null;
  discount?: any;
  taxes?: Tax[];
  payment_status?: PaymentStatus;
  [key: string]: any;
}

export interface WatermarkConfig {
  text: string;
  colorClass: string;
}

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

export const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const formatDisplayDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDisplayTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const shouldShowDiscountPercentage = (discountAmount: number, subtotal: number): number | null => {
  if (!discountAmount || !subtotal || subtotal === 0) return null;
  
  const percentage = (discountAmount / subtotal) * 100;
  const roundedPercentage = Math.round(percentage * 10) / 10;
  
  const MIN_PERCENTAGE_TO_SHOW = 0.5;
  const MIN_DISCOUNT_AMOUNT = 100;
  
  if (roundedPercentage >= MIN_PERCENTAGE_TO_SHOW && discountAmount >= MIN_DISCOUNT_AMOUNT) {
    return roundedPercentage;
  }
  
  return null;
};

export const getWatermarkConfig = (derivedFinancials: DerivedFinancials): WatermarkConfig | null => {
  const { status, balanceDue, grandTotal, changeAmount } = derivedFinancials;
  const isPaymentFinalized = status === PaymentStatus.PAID_IN_FULL || balanceDue === 0 || changeAmount > 0;
  if (!isPaymentFinalized) return null;

  if (changeAmount > 0) {
    return { text: 'CHANGE GIVEN', colorClass: 'text-blue-600' };
  }
  if (status === PaymentStatus.PAID_IN_FULL || balanceDue === 0) {
    return { text: 'PAID', colorClass: 'text-green-600' };
  }
  if (balanceDue > 0 && balanceDue < grandTotal) {
    return { text: 'PARTIAL', colorClass: 'text-amber-600' };
  }
  if (balanceDue === grandTotal && grandTotal > 0) {
    return { text: 'DUE', colorClass: 'text-red-600' };
  }
  return null;
};

export const getWatermarkFontSize = (text: string): string => {
  if (text === 'CHANGE GIVEN') {
    return 'clamp(1.5rem, 12cqw, 4rem)';
  }
  if (text === 'PARTIAL') {
    return 'clamp(2rem, 16cqw, 5rem)';
  }
  return 'clamp(2.5rem, 20cqw, 6rem)';
};
