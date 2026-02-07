/**
 * ============================================================================
 * BILLING TYPES AND INTERFACES
 * ============================================================================
 * 
 * Comprehensive type definitions for the hospital billing system
 */

// ============================================================================
// SERVICE & CHARGE TYPES
// ============================================================================

export interface ServiceItem {
  id: number;
  code: string;
  name: string;
  unitPrice: number;
  category: string;
}

export interface ChargeItem {
  service: ServiceItem;
  quantity: number;
  totalAmount: number;
}

// ============================================================================
// BILLING ADJUSTMENTS
// ============================================================================

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
// Billing Step Type
export type BillingStep = 'charge_entry' | 'billing_summary';
// ============================================================================
// PAYMENT TYPES
// ============================================================================

export type PaymentMethodType = 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed';

export interface PaymentMethod {
  type: PaymentMethodType;
  amount: number;
  reference?: string;
  details?: string;
}

// ============================================================================
// BILLING STATUS
// ============================================================================

export type BillingStatus = 'draft' | 'ready' | 'settled' | 'cancelled';

// ============================================================================
// COMPLETE BILLING DATA
// ============================================================================

export interface BillingData {
  chargeItems: ChargeItem[];
  subtotal: number;
  discount: Discount;
  taxes: Tax[];
  grandTotal: number;
  paymentMethods: PaymentMethod[];
  balance: number;
  receiptNumber: string;
  additionalNotes: string;
  status: BillingStatus;
}

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_SERVICES: ServiceItem[] = [
  { id: 1, code: 'CONSULT001', name: 'General Consultation', unitPrice: 50000, category: 'Consultation' },
  { id: 2, code: 'LAB001', name: 'Blood Test - Complete', unitPrice: 150000, category: 'Laboratory' },
  { id: 3, code: 'MED001', name: 'Paracetamol 500mg', unitPrice: 2000, category: 'Medication' },
  { id: 4, code: 'MED002', name: 'Amoxicillin 500mg', unitPrice: 4500, category: 'Medication' },
  { id: 5, code: 'PROC001', name: 'Minor Procedure', unitPrice: 250000, category: 'Procedure' },
  { id: 6, code: 'XRAY001', name: 'Chest X-Ray', unitPrice: 80000, category: 'Radiology' },
  { id: 7, code: 'ECG001', name: 'ECG Test', unitPrice: 120000, category: 'Cardiology' },
  { id: 8, code: 'WARD001', name: 'Ward Admission (per day)', unitPrice: 150000, category: 'Ward' },
  { id: 9, code: 'THE001', name: 'Physiotherapy Session', unitPrice: 70000, category: 'Therapy' },
  { id: 10, code: 'EMER001', name: 'Emergency Care', unitPrice: 200000, category: 'Emergency' },
  { id: 11, code: 'LAB002', name: 'Urine Analysis', unitPrice: 35000, category: 'Laboratory' },
  { id: 12, code: 'MED003', name: 'Ibuprofen 400mg', unitPrice: 1500, category: 'Medication' },
  { id: 13, code: 'XRAY002', name: 'Abdominal X-Ray', unitPrice: 90000, category: 'Radiology' },
  { id: 14, code: 'CONSULT002', name: 'Specialist Consultation', unitPrice: 100000, category: 'Consultation' },
  { id: 15, code: 'LAB003', name: 'Liver Function Test', unitPrice: 180000, category: 'Laboratory' },
];

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_TAXES: Tax[] = [
  { name: 'VAT (16%)', rate: 16, amount: 0 },
  { name: 'Service Charge', rate: 2, amount: 0 },
];

export const DEFAULT_DISCOUNT: Discount = {
  type: 'percentage',
  value: 0,
  reason: ''
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const generateReceiptNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REC-${year}${month}${day}-${random}`;
};

export const calculateBillingData = (
  chargeItems: ChargeItem[],
  discount: Discount,
  taxes: Tax[],
  paymentMethods: PaymentMethod[]
): Omit<BillingData, 'receiptNumber' | 'additionalNotes' | 'status'> => {
  // Calculate subtotal
  const subtotal = chargeItems.reduce((sum, item) => sum + item.totalAmount, 0);
  
  // Calculate discount amount
  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = subtotal * (discount.value / 100);
  } else {
    discountAmount = discount.value;
  }
  
  // Ensure discount doesn't exceed subtotal
  discountAmount = Math.min(discountAmount, subtotal);
  
  // Calculate taxable amount
  const taxableAmount = subtotal - discountAmount;
  
  // Calculate taxes
  const updatedTaxes = taxes.map(tax => ({
    ...tax,
    amount: taxableAmount * (tax.rate / 100),
  }));
  
  // Calculate tax total
  const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
  
  // Calculate grand total
  const grandTotal = taxableAmount + taxTotal;
  
  // Calculate total paid and balance
  const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  const balance = Math.max(0, grandTotal - totalPaid);
  
  return {
    chargeItems,
    subtotal,
    discount,
    taxes: updatedTaxes,
    grandTotal,
    paymentMethods,
    balance,
  };
};