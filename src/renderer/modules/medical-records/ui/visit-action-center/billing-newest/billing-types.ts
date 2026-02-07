// billing-types.ts
// Types and shared data for hospital billing workflow

// Service Item Type
export interface ServiceItem {
  id: number;
  code: string;
  name: string;
  unitPrice: number;
  category: string;
}

// Charge Item Type
export interface ChargeItem {
  id: string;
  service: ServiceItem;
  quantity: number;
  totalAmount: number;
}

// Discount Type
export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}

// Tax Type
export interface Tax {
  name: string;
  rate: number;
  amount: number;
}

// Payment Method Type
export interface PaymentMethod {
  type: 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed';
  amount: number;
  reference?: string;
  details?: string;
}

// Billing Status
export type BillingStatus = 'draft' | 'ready' | 'settled';

// Billing Step
export type BillingStep = 'charge_entry' | 'billing_summary';

// Billing State
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

// Mock Services Data
export const MOCK_SERVICES: ServiceItem[] = [
  { id: 1, code: 'CONSULT001', name: 'General Consultation', unitPrice: 5000, category: 'Consultation' },
  { id: 2, code: 'LAB001', name: 'Blood Test - Complete', unitPrice: 15000, category: 'Laboratory' },
  { id: 3, code: 'MED001', name: 'Paracetamol 500mg', unitPrice: 200, category: 'Medication' },
  { id: 4, code: 'MED002', name: 'Amoxicillin 500mg', unitPrice: 450, category: 'Medication' },
  { id: 5, code: 'PROC001', name: 'Minor Procedure', unitPrice: 25000, category: 'Procedure' },
  { id: 6, code: 'XRAY001', name: 'Chest X-Ray', unitPrice: 8000, category: 'Radiology' },
  { id: 7, code: 'ECG001', name: 'ECG Test', unitPrice: 12000, category: 'Cardiology' },
  { id: 8, code: 'WARD001', name: 'Ward Admission (per day)', unitPrice: 15000, category: 'Ward' },
  { id: 9, code: 'THE001', name: 'Physiotherapy Session', unitPrice: 7000, category: 'Therapy' },
  { id: 10, code: 'EMER001', name: 'Emergency Care', unitPrice: 20000, category: 'Emergency' },
];

// Default Taxes
export const DEFAULT_TAXES: Tax[] = [
  { name: 'VAT (16%)', rate: 16, amount: 0 },
  { name: 'Service Charge', rate: 2, amount: 0 },
];

// Default Discount
export const DEFAULT_DISCOUNT: Discount = {
  type: 'percentage',
  value: 0,
  reason: ''
};

// Default Payment Method
export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { type: 'cash', amount: 0, details: '' },
];

// Initial Billing State
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

// Helper Functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
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
) => {
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

export const generateChargeItemId = (serviceId: number): string => {
  return `charge-${serviceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Storage key for drafts
export const getDraftStorageKey = (visitId?: string) => {
  return `billing_draft_${visitId || 'global'}`;
};