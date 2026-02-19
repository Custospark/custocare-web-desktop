// utils.ts
// Utility functions and helper methods

import {
  DerivedStatus,
  MockTransaction,
  PaymentType,
  RefundLineItem,
  ThemeColors,
} from './types';
import {
  FaCashRegister,
} from 'react-icons/fa';
import {
  CreditCard,
  Shield,
  Wallet,
} from 'lucide-react';
import React from 'react';

// ==================== CLASSNAME UTILITIES ====================

export const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

// ==================== DATE & TIME UTILITIES ====================

export const isoNow = () => new Date().toISOString();

export const formatDisplayDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ==================== CURRENCY FORMATTING ====================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ==================== PAYMENT ICONS ====================

export const paymentIcon = (type: string): React.ReactElement => {
  switch (type) {
    case 'cash':
      return React.createElement(FaCashRegister, { className: 'w-4 h-4 text-green-600' });
    case 'card':
      return React.createElement(CreditCard, { className: 'w-4 h-4 text-blue-600' });
    case 'insurance':
      return React.createElement(Shield, { className: 'w-4 h-4 text-purple-600' });
    case 'mobile':
      return React.createElement(Wallet, { className: 'w-4 h-4 text-amber-600' });
    default:
      return React.createElement(Wallet, { className: 'w-4 h-4 text-gray-500' });
  }
};

// ==================== REFUND CALCULATIONS ====================

/**
 * Handler: Calculate total refunded amount from processed refunds
 * Backend integration point: Replace with API call to get refund totals
 */
export const sumProcessedRefundAmount = (t: MockTransaction): number => {
  return (t.refunds ?? [])
    .filter(r => r.status === 'processed')
    .reduce((s, r) => s + r.total_amount, 0);
};

/**
 * Handler: Get map of refunded quantities per charge item
 * Backend integration point: Replace with API call to get refunded quantities
 */
export const getRefundedQtyMap = (t: MockTransaction): Map<number, number> => {
  const map = new Map<number, number>();
  for (const r of t.refunds ?? []) {
    if (r.status !== 'processed') continue;
    for (const li of r.items) {
      map.set(li.charge_item_id, (map.get(li.charge_item_id) ?? 0) + li.quantity_refunded);
    }
  }
  return map;
};

/**
 * Handler: Compute refund line items and total from quantity selections
 * Backend integration point: This logic should match backend refund calculation
 */
export const computeRefundFromQuantities = (
  transaction: MockTransaction,
  qtyByItem: Record<number, number>
): { items: RefundLineItem[]; total: number } => {
  const items: RefundLineItem[] = [];

  for (const ci of transaction.charge_items) {
    const q = Math.max(0, Math.floor(qtyByItem[ci.id] ?? 0));
    if (q <= 0) continue;

    items.push({
      charge_item_id: ci.id,
      service_name: ci.service.name,
      service_code: ci.service.code,
      unitPrice: ci.service.unitPrice,
      quantity_refunded: q,
      amount: ci.service.unitPrice * q,
    });
  }

  const total = items.reduce((s, it) => s + it.amount, 0);
  return { items, total };
};

// ==================== STATUS DERIVATION ====================

/**
 * Handler: Derive transaction status based on refunds and voids
 * Backend integration point: This logic should match backend status calculation
 */
export const deriveStatus = (t: MockTransaction): DerivedStatus => {
  if (t.voided) return 'voided';

  const refunded = sumProcessedRefundAmount(t);
  if (refunded > 0) {
    const netPaid = Math.max(0, t.billing_data.totalPaid - refunded);
    return netPaid === 0 ? 'refunded' : 'partially_refunded';
  }
  return t.status;
};

export const statusLabel = (s: DerivedStatus): string => {
  switch (s) {
    case 'settled':
      return 'Settled';
    case 'ready':
      return 'Ready';
    case 'draft':
      return 'Draft';
    case 'partially_refunded':
      return 'Partially Refunded';
    case 'refunded':
      return 'Refunded';
    case 'voided':
      return 'Voided';
    default:
      return s;
  }
};

export const statusPillClass = (isDark: boolean, s: DerivedStatus): string => {
  const base = 'text-white';
  if (s === 'draft') return cx('bg-gray-600', base);
  if (s === 'ready') return cx(isDark ? 'bg-blue-500' : 'bg-blue-600', base);
  if (s === 'settled') return cx(isDark ? 'bg-green-500' : 'bg-green-600', base);
  if (s === 'partially_refunded') return cx('bg-amber-600', base);
  if (s === 'refunded') return cx('bg-fuchsia-600', base);
  if (s === 'voided') return cx('bg-red-600', base);
  return cx('bg-gray-600', base);
};

// ==================== WATERMARK ====================

export const watermarkForStatus = (
  status: DerivedStatus,
  balanceDue: number
): { text: string; color: string } => {
  if (status === 'voided') return { text: 'VOIDED', color: 'text-red-600' };
  if (status === 'refunded') return { text: 'REFUNDED', color: 'text-fuchsia-600' };
  if (status === 'partially_refunded') return { text: 'PARTIAL REFUND', color: 'text-amber-600' };
  if (balanceDue > 0) return { text: 'DUE', color: 'text-amber-600' };
  return { text: 'PAID', color: 'text-green-600' };
};

// ==================== THEME COLORS ====================

export const getThemeColors = (isDark: boolean): ThemeColors => {
  return {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-900' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50',
      selected: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    ring: 'focus:ring-2 focus:ring-blue-500',
  };
};

// ==================== MOCK DATA GENERATOR ====================

/**
 * Handler: Generate mock transactions
 * Backend integration point: Replace with API call to fetch transactions
 */
export const generateMockTransactions = (): MockTransaction[] => {
  const patients = [
    {
      id: 1,
      name: 'John Smith',
      patient_number: 'PT-001',
      email: 'john.smith@email.com',
      phone: '+256 701 234567',
    },
    {
      id: 2,
      name: 'Mary Johnson',
      patient_number: 'PT-002',
      email: 'mary.j@email.com',
      phone: '+256 702 345678',
    },
    {
      id: 3,
      name: 'David Ochieng',
      patient_number: 'PT-003',
      email: 'david.ochieng@email.com',
      phone: '+256 703 456789',
    },
    {
      id: 4,
      name: 'Sarah Akello',
      patient_number: 'PT-004',
      email: 'sarah.a@email.com',
      phone: '+256 704 567890',
    },
    {
      id: 5,
      name: 'James Otieno',
      patient_number: 'PT-005',
      email: 'james.otieno@email.com',
      phone: '+256 705 678901',
    },
  ];

  const services = [
    { id: 1, name: 'Consultation', code: 'CONS', unitPrice: 50000, category: 'Consultation' },
    { id: 2, name: 'Malaria Test', code: 'LAB001', unitPrice: 25000, category: 'Laboratory' },
    { id: 3, name: 'Blood Pressure Check', code: 'VIT001', unitPrice: 15000, category: 'Vitals' },
    { id: 4, name: 'Paracetamol', code: 'PHARM001', unitPrice: 5000, category: 'Pharmacy' },
    { id: 5, name: 'Antibiotics', code: 'PHARM002', unitPrice: 35000, category: 'Pharmacy' },
    { id: 6, name: 'X-Ray Chest', code: 'RAD001', unitPrice: 85000, category: 'Radiology' },
    { id: 7, name: 'COVID-19 Test', code: 'LAB002', unitPrice: 75000, category: 'Laboratory' },
    { id: 8, name: 'Follow-up Visit', code: 'CONS002', unitPrice: 35000, category: 'Consultation' },
  ];

  const transactions: MockTransaction[] = [];

  for (let i = 1; i <= 25; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const numItems = Math.floor(Math.random() * 5) + 1;
    const selectedServices: number[] = [];
    const charge_items = [];

    for (let j = 0; j < numItems; j++) {
      let serviceIndex;
      do {
        serviceIndex = Math.floor(Math.random() * services.length);
      } while (selectedServices.includes(serviceIndex));

      selectedServices.push(serviceIndex);
      const service = services[serviceIndex];
      const quantity = Math.floor(Math.random() * 3) + 1;

      charge_items.push({
        id: j + 1,
        service: { ...service },
        quantity,
        totalAmount: service.unitPrice * quantity,
      });
    }

    const subtotal = charge_items.reduce((sum, item) => sum + item.totalAmount, 0);

    const hasDiscount = Math.random() > 0.55;
    const discountType = hasDiscount ? (Math.random() > 0.5 ? 'percentage' : 'fixed') : 'percentage';
    const discountValue = hasDiscount
      ? discountType === 'percentage'
        ? Math.floor(Math.random() * 15) + 5
        : Math.floor(Math.random() * 30000) + 5000
      : 0;

    const discountAmount =
      discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;

    const taxes = [
      { name: 'VAT (18%)', rate: 18, amount: (subtotal - discountAmount) * 0.18 },
      { name: 'Service Charge (5%)', rate: 5, amount: (subtotal - discountAmount) * 0.05 },
    ];

    const taxTotal = taxes.reduce((sum, t) => sum + t.amount, 0);
    const grandTotal = subtotal - discountAmount + taxTotal;

    const numPayments = Math.floor(Math.random() * 2) + 1;
    const payment_methods = [];
    let remaining = grandTotal;

    for (let p = 0; p < numPayments; p++) {
      const isLast = p === numPayments - 1;
      const types: PaymentType[] = ['cash', 'card', 'insurance', 'mobile'];
      const type = types[Math.floor(Math.random() * types.length)];

      const amount = isLast ? remaining : Math.floor(remaining * (Math.random() * 0.6 + 0.2));

      payment_methods.push({
        id: `pm_${i}_${p}`,
        type,
        amount,
        details: type === 'mobile' ? `2567${Math.floor(Math.random() * 10000000)}` : undefined,
        reference:
          type === 'card' ? `TXN${Math.random().toString(36).slice(2, 10).toUpperCase()}` : undefined,
        status: 'completed' as const,
      });

      remaining -= amount;
    }

    const totalPaid = payment_methods.reduce((s, pm) => s + pm.amount, 0);
    const balance = grandTotal - totalPaid;

    const date = new Date();
    const daysAgo = Math.floor(Math.random() * 90);
    date.setDate(date.getDate() - daysAgo);

    transactions.push({
      id: i,
      visit_id: 1000 + i,
      receipt_number: `REC-${2026}${String(i).padStart(4, '0')}`,
      date: date.toISOString().split('T')[0],
      time: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}:${String(
        Math.floor(Math.random() * 60)
      ).padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
      patient,
      charge_items,
      discount: {
        type: discountType,
        value: discountValue,
        reason: hasDiscount ? 'Promotional discount' : undefined,
      },
      taxes,
      payment_methods,
      billing_data: {
        subtotal,
        discountAmount,
        taxableAmount: subtotal - discountAmount,
        taxTotal,
        grandTotal,
        totalPaid,
        balance,
      },
      additional_notes: Math.random() > 0.75 ? 'Patient requested receipt via email' : undefined,
      status: balance === 0 ? 'settled' : Math.random() > 0.7 ? 'draft' : 'ready',
      settled_by: balance === 0 ? 'Admin User' : undefined,
      settled_at: balance === 0 ? new Date().toISOString() : undefined,
      refunds: [],
    });
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};