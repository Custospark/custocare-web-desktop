/**
 * Billing Types and Mock Data
 * Centralized type definitions and mock data for billing components
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Service/Item that can be charged
 */
export interface ServiceItem {
  id: number;
  code: string;
  name: string;
  unitPrice: number;
  category: string;
}

/**
 * Charge item with quantity and total
 */
export interface ChargeItem {
  service: ServiceItem;
  quantity: number;
  totalAmount: number;
}

/**
 * Discount configuration
 */
export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}

/**
 * Tax configuration
 */
export interface Tax {
  name: string;
  rate: number;
  amount: number;
}

/**
 * Payment method details
 */
export interface PaymentMethod {
  type: 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed';
  amount: number;
  reference?: string;
  details?: string;
}

/**
 * Billing session data shared between components
 */
export interface BillingSession {
  chargeItems: ChargeItem[];
  subtotal: number;
  discount: Discount;
  taxes: Tax[];
  grandTotal: number;
  paymentMethods: PaymentMethod[];
  balance: number;
  receiptNumber: string;
  additionalNotes: string;
  timestamp: number;
}

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';

/**
 * Color configuration
 */
export interface ColorConfig {
  bg: {
    primary: string;
    secondary: string;
    elevated: string;
    hover: string;
  };
  border: {
    primary: string;
    secondary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  accent: {
    primary: string;
    hover: string;
    text: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

/**
 * Mock services/items available for billing
 */
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
  { id: 11, code: 'LAB002', name: 'Urine Analysis', unitPrice: 3500, category: 'Laboratory' },
  { id: 12, code: 'MED003', name: 'Ibuprofen 400mg', unitPrice: 250, category: 'Medication' },
  { id: 13, code: 'XRAY002', name: 'Abdominal X-Ray', unitPrice: 9000, category: 'Radiology' },
  { id: 14, code: 'CONSULT002', name: 'Specialist Consultation', unitPrice: 10000, category: 'Consultation' },
  { id: 15, code: 'LAB003', name: 'HIV Test', unitPrice: 2500, category: 'Laboratory' },
];

/**
 * Default tax rates
 */
export const DEFAULT_TAXES: Tax[] = [
  { name: 'VAT (16%)', rate: 16, amount: 0 },
  { name: 'Service Charge', rate: 2, amount: 0 },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Generate unique receipt number
 */
export const generateReceiptNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REC-${year}${month}${day}-${random}`;
};

/**
 * Calculate discount amount
 */
export const calculateDiscountAmount = (subtotal: number, discount: Discount): number => {
  if (discount.type === 'percentage') {
    return subtotal * (discount.value / 100);
  }
  return Math.min(discount.value, subtotal);
};

/**
 * Calculate taxes on taxable amount
 */
export const calculateTaxes = (taxableAmount: number, taxes: Tax[]): Tax[] => {
  return taxes.map(tax => ({
    ...tax,
    amount: taxableAmount * (tax.rate / 100),
  }));
};

/**
 * Calculate grand total from components
 */
export const calculateGrandTotal = (
  subtotal: number,
  discount: Discount,
  taxes: Tax[]
): number => {
  const discountAmount = calculateDiscountAmount(subtotal, discount);
  const taxableAmount = subtotal - discountAmount;
  const taxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0);
  return taxableAmount + taxTotal;
};

/**
 * Calculate balance
 */
export const calculateBalance = (
  grandTotal: number,
  paymentMethods: PaymentMethod[]
): number => {
  const totalPaid = paymentMethods.reduce((sum, method) => sum + method.amount, 0);
  return grandTotal - totalPaid;
};

/**
 * Get theme-based color configuration
 */
export const getColorConfig = (theme: Theme): ColorConfig => {
  const isDark = theme === 'dark';
  
  return {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: isDark ? 'bg-blue-600' : 'bg-blue-600',
      hover: isDark ? 'hover:bg-blue-700' : 'hover:bg-blue-700',
      text: 'text-white',
    },
    status: {
      success: isDark ? 'text-green-400' : 'text-green-600',
      warning: isDark ? 'text-yellow-400' : 'text-yellow-600',
      error: isDark ? 'text-red-400' : 'text-red-600',
      info: isDark ? 'text-blue-400' : 'text-blue-600',
    },
  };
};

/**
 * Create initial billing session
 */
export const createInitialBillingSession = (): BillingSession => {
  return {
    chargeItems: [],
    subtotal: 0,
    discount: { type: 'percentage', value: 0 },
    taxes: DEFAULT_TAXES,
    grandTotal: 0,
    paymentMethods: [{ type: 'cash', amount: 0, details: '' }],
    balance: 0,
    receiptNumber: generateReceiptNumber(),
    additionalNotes: '',
    timestamp: Date.now(),
  };
};

/**
 * Validate billing session
 */
export const validateBillingSession = (session: BillingSession): boolean => {
  return (
    session.chargeItems.length > 0 &&
    session.grandTotal > 0 &&
    session.balance === 0
  );
};

/**
 * Search services by term
 */
export const searchServices = (term: string, limit: number = 8): ServiceItem[] => {
  if (term.trim() === '') return [];
  
  const searchTerm = term.toLowerCase();
  return MOCK_SERVICES.filter(service =>
    service.name.toLowerCase().includes(searchTerm) ||
    service.code.toLowerCase().includes(searchTerm) ||
    service.category.toLowerCase().includes(searchTerm)
  ).slice(0, limit);
};