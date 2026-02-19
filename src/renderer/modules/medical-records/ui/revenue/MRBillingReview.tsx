// MRBillingReview.tsx
// Complete rewrite (bug-safe, item-based refunds, watermark, email, responsive, smooth search, solid printing)
//
// ✅ Enforced refund rules:
// - You MUST select refund items from available charge items
// - Refund can be partial by reducing quantity (per item qty input)
// - Refund amount is AUTO-CALCULATED from selected items (no manual amount entry)
// - Cannot refund more quantity than available (original qty - already refunded qty)
// - Refund total cannot exceed net paid (conservative, safe rule)
//
// ✅ Receipt improvements:
// - Watermark: PAID / DUE / PARTIALLY REFUNDED / REFUNDED / VOIDED (prints too)
// - Services list shows refunded qty and net qty
// - Refund history includes refunded items & quantities
//
// ✅ UX improvements:
// - Mobile tabs (Records / Receipt), desktop split view
// - Smooth search (useDeferredValue + useMemo), plus optional date range + sorting
// - Meaningful cursor-pointer on interactive elements
// - Toast notifications
//
// ✅ Printing:
// - Uses react-to-print (recommended). Prints receipt node only.
//   npm i react-to-print
//
// Email receipt:
// - Mocked “send” flow (replace with API call). Includes modal & validation.

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  Ban,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Filter,
  Mail,
  Printer,
  Receipt,
  Search,
  Shield,
  SlidersHorizontal,
  Undo2,
  Wallet,
  X,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { useReactToPrint } from 'react-to-print';
import { formatCurrency } from '../visit-action-center/billing-space';

/* ---------------------------------- Types --------------------------------- */

interface MockPatient {
  id: number;
  name: string;
  patient_number: string;
  email?: string;
  phone?: string;
}

interface MockChargeItem {
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

type PaymentType = 'cash' | 'card' | 'insurance' | 'mobile';
interface MockPaymentMethod {
  id: string;
  type: PaymentType;
  amount: number;
  details?: string;
  reference?: string;
  status?: 'completed' | 'pending' | 'failed';
}

type RefundStatus = 'processed' | 'reversed' | 'failed';

interface RefundLineItem {
  charge_item_id: number;
  service_name: string;
  service_code: string;
  unitPrice: number;
  quantity_refunded: number;
  amount: number; // unitPrice * quantity_refunded
}

interface RefundRecord {
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

interface VoidRecord {
  voided_at: string; // ISO
  voided_by: string;
  reason: string;
}

type BaseTransactionStatus = 'settled' | 'ready' | 'draft';
type DerivedStatus =
  | BaseTransactionStatus
  | 'partially_refunded'
  | 'refunded'
  | 'voided';

interface MockTransaction {
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
    balance: number; // legacy/mock
  };

  additional_notes?: string;

  status: BaseTransactionStatus;

  settled_by?: string;
  settled_at?: string;

  refunds?: RefundRecord[];
  voided?: VoidRecord;
}

/* ------------------------------ Mock Generator ----------------------------- */

const generateMockTransactions = (): MockTransaction[] => {
  const patients: MockPatient[] = [
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
    {
      id: 1,
      name: 'Consultation',
      code: 'CONS',
      unitPrice: 50000,
      category: 'Consultation',
    },
    {
      id: 2,
      name: 'Malaria Test',
      code: 'LAB001',
      unitPrice: 25000,
      category: 'Laboratory',
    },
    {
      id: 3,
      name: 'Blood Pressure Check',
      code: 'VIT001',
      unitPrice: 15000,
      category: 'Vitals',
    },
    {
      id: 4,
      name: 'Paracetamol',
      code: 'PHARM001',
      unitPrice: 5000,
      category: 'Pharmacy',
    },
    {
      id: 5,
      name: 'Antibiotics',
      code: 'PHARM002',
      unitPrice: 35000,
      category: 'Pharmacy',
    },
    {
      id: 6,
      name: 'X-Ray Chest',
      code: 'RAD001',
      unitPrice: 85000,
      category: 'Radiology',
    },
    {
      id: 7,
      name: 'COVID-19 Test',
      code: 'LAB002',
      unitPrice: 75000,
      category: 'Laboratory',
    },
    {
      id: 8,
      name: 'Follow-up Visit',
      code: 'CONS002',
      unitPrice: 35000,
      category: 'Consultation',
    },
  ];

  const transactions: MockTransaction[] = [];

  for (let i = 1; i <= 25; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const numItems = Math.floor(Math.random() * 5) + 1;
    const selectedServices: number[] = [];
    const charge_items: MockChargeItem[] = [];

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
        service: {
          id: service.id,
          name: service.name,
          code: service.code,
          unitPrice: service.unitPrice,
          category: service.category,
        },
        quantity,
        totalAmount: service.unitPrice * quantity,
      });
    }

    const subtotal = charge_items.reduce((sum, item) => sum + item.totalAmount, 0);

    const hasDiscount = Math.random() > 0.55;
    const discountType = hasDiscount
      ? Math.random() > 0.5
        ? 'percentage'
        : 'fixed'
      : 'percentage';
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
    const payment_methods: MockPaymentMethod[] = [];
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
        status: 'completed',
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

  return transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

/* --------------------------------- Helpers -------------------------------- */

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const isoNow = () => new Date().toISOString();

const formatDisplayDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const paymentIcon = (type: string) => {
  switch (type) {
    case 'cash':
      return <FaCashRegister className="w-4 h-4 text-green-600" />;
    case 'card':
      return <CreditCard className="w-4 h-4 text-blue-600" />;
    case 'insurance':
      return <Shield className="w-4 h-4 text-purple-600" />;
    case 'mobile':
      return <Wallet className="w-4 h-4 text-amber-600" />;
    default:
      return <Wallet className="w-4 h-4 text-gray-500" />;
  }
};

const sumProcessedRefundAmount = (t: MockTransaction) =>
  (t.refunds ?? [])
    .filter(r => r.status === 'processed')
    .reduce((s, r) => s + r.total_amount, 0);

const getRefundedQtyMap = (t: MockTransaction) => {
  const map = new Map<number, number>();
  for (const r of t.refunds ?? []) {
    if (r.status !== 'processed') continue;
    for (const li of r.items) {
      map.set(li.charge_item_id, (map.get(li.charge_item_id) ?? 0) + li.quantity_refunded);
    }
  }
  return map;
};

const deriveStatus = (t: MockTransaction): DerivedStatus => {
  if (t.voided) return 'voided';

  const refunded = sumProcessedRefundAmount(t);
  if (refunded > 0) {
    const netPaid = Math.max(0, t.billing_data.totalPaid - refunded);
    return netPaid === 0 ? 'refunded' : 'partially_refunded';
  }
  return t.status;
};

const statusLabel = (s: DerivedStatus) => {
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

const statusPillClass = (isDark: boolean, s: DerivedStatus) => {
  const base = 'text-white';
  if (s === 'draft') return cx('bg-gray-600', base);
  if (s === 'ready') return cx(isDark ? 'bg-blue-500' : 'bg-blue-600', base);
  if (s === 'settled') return cx(isDark ? 'bg-green-500' : 'bg-green-600', base);
  if (s === 'partially_refunded') return cx('bg-amber-600', base);
  if (s === 'refunded') return cx('bg-fuchsia-600', base);
  if (s === 'voided') return cx('bg-red-600', base);
  return cx('bg-gray-600', base);
};

const watermarkForStatus = (status: DerivedStatus, balanceDue: number) => {
  if (status === 'voided') return { text: 'VOIDED', color: 'text-red-600' };
  if (status === 'refunded') return { text: 'REFUNDED', color: 'text-fuchsia-600' };
  if (status === 'partially_refunded') return { text: 'PARTIAL REFUND', color: 'text-amber-600' };
  if (balanceDue > 0) return { text: 'DUE', color: 'text-amber-600' };
  return { text: 'PAID', color: 'text-green-600' };
};

/* --------------------------------- UI Bits -------------------------------- */

function Toast({
  show,
  type,
  message,
  onClose,
}: {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [show, onClose]);

  if (!show) return null;

  const styles =
    type === 'success'
      ? 'bg-green-50 border-green-200 text-green-900'
      : type === 'error'
      ? 'bg-red-50 border-red-200 text-red-900'
      : 'bg-blue-50 border-blue-200 text-blue-900';

  return (
    <div className="fixed top-4 right-4 z-[60] w-[min(92vw,420px)]">
      <div className={cx('border rounded-xl shadow-lg px-4 py-3', styles)}>
        <div className="flex items-start gap-2">
          {type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold leading-snug">{message}</p>
          </div>
          <button
            className="cursor-pointer p-1 rounded-lg hover:bg-black/5"
            onClick={onClose}
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  theme,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  theme: 'light' | 'dark';
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cx(
            'w-full max-w-2xl rounded-xl border shadow-xl',
            isDark ? 'bg-gray-900 border-gray-800 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
          )}
        >
          <div
            className={cx(
              'flex items-start justify-between gap-3 px-4 py-3 border-b',
              isDark ? 'border-gray-800' : 'border-gray-200'
            )}
          >
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold truncate">{title}</h3>
              {subtitle && (
                <p className={cx('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className={cx(
                'cursor-pointer p-2 rounded-lg transition',
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              )}
              aria-label="Close"
            >
              <X className={cx('w-5 h-5', isDark ? 'text-gray-200' : 'text-gray-800')} />
            </button>
          </div>

          <div className="px-4 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Component -------------------------------- */

interface MRBillingReviewProps {
  theme?: 'light' | 'dark';
}

export const MRBillingReview: React.FC<MRBillingReviewProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';

  // Data
  const [transactions, setTransactions] = useState<MockTransaction[]>(() => generateMockTransactions());
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedTransaction = useMemo(
    () => transactions.find(t => t.id === selectedId) ?? null,
    [transactions, selectedId]
  );

  // UX panes (mobile)
  const [activePane, setActivePane] = useState<'list' | 'receipt'>('list');

  // Search/filters
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);

  const [statusFilter, setStatusFilter] = useState<DerivedStatus | 'all'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'patient'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Toast
  const [toast, setToast] = useState<{ show: boolean; type: 'success' | 'error' | 'info'; message: string }>({
    show: false,
    type: 'info',
    message: '',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, type, message });
  }, []);

  // Printing
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: selectedTransaction ? selectedTransaction.receipt_number : 'receipt',
    onBeforePrint: () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
    removeAfterPrint: false,
  });

  // Email modal
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailNote, setEmailNote] = useState('');
  const [emailSending, setEmailSending] = useState(false);

  // Refund modal (ITEM-BASED with quantities)
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundMethod, setRefundMethod] = useState<PaymentType>('cash');
  const [refundReference, setRefundReference] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundProcessedBy, setRefundProcessedBy] = useState('Admin User');
  const [refundQtyByItem, setRefundQtyByItem] = useState<Record<number, number>>({});

  // Void modal
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidBy, setVoidBy] = useState('Admin User');

  // Theme helpers
  const colors = useMemo(() => {
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
  }, [isDark]);

  const pillBg = isDark ? 'bg-gray-700' : 'bg-gray-100';

  // Auto switch to receipt on mobile when selecting record
  useEffect(() => {
    if (selectedId != null) setActivePane('receipt');
  }, [selectedId]);

  /* ------------------------------ Derived Values ------------------------------ */

  const selectedRefundedQtyMap = useMemo(() => {
    if (!selectedTransaction) return new Map<number, number>();
    return getRefundedQtyMap(selectedTransaction);
  }, [selectedTransaction]);

  const derivedFinancials = useMemo(() => {
    if (!selectedTransaction) return null;

    const refunded = sumProcessedRefundAmount(selectedTransaction);
    const totalPaid = selectedTransaction.billing_data.totalPaid;
    const grandTotal = selectedTransaction.billing_data.grandTotal;

    const netPaid = Math.max(0, totalPaid - refunded);
    const balanceDue = Math.max(0, grandTotal - netPaid);

    return {
      refunded,
      netPaid,
      balanceDue,
      refundableMax: netPaid, // safe rule: never refund beyond net paid
      status: deriveStatus(selectedTransaction),
    };
  }, [selectedTransaction]);

  /* -------------------------------- Filtering -------------------------------- */

  const filteredTransactions = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    const list = transactions.filter(t => {
      const derived = deriveStatus(t);

      const matchesText = !q
        ? true
        : [
            t.receipt_number,
            String(t.visit_id),
            t.patient.name,
            t.patient.patient_number,
            t.patient.email ?? '',
            t.patient.phone ?? '',
            derived,
            ...t.charge_items.map(ci => `${ci.service.name} ${ci.service.code} ${ci.service.category}`),
            ...t.payment_methods.map(pm => `${pm.type} ${pm.details ?? ''} ${pm.reference ?? ''} ${pm.amount}`),
            ...((t.refunds ?? []).map(r => `refund ${r.method} ${r.reference ?? ''} ${r.reason} ${r.total_amount}`)),
          ]
            .join(' ')
            .toLowerCase()
            .includes(q);

      const matchesStatus = statusFilter === 'all' ? true : derived === statusFilter;

      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const d = new Date(t.date).getTime();
        const start = new Date(dateRange.start).getTime();
        const end = new Date(dateRange.end).getTime();
        matchesDate = d >= start && d <= end;
      }

      return matchesText && matchesStatus && matchesDate;
    });

    list.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;

      if (sortBy === 'date') return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (sortBy === 'amount') return dir * (a.billing_data.grandTotal - b.billing_data.grandTotal);
      return dir * a.patient.name.localeCompare(b.patient.name);
    });

    return list;
  }, [transactions, deferredSearch, statusFilter, dateRange, sortBy, sortOrder]);

  /* --------------------------------- Actions -------------------------------- */

  const ActionButton = ({
    onClick,
    disabled,
    icon,
    label,
    variant = 'primary',
  }: {
    onClick: () => void;
    disabled?: boolean;
    icon: React.ReactNode;
    label: string;
    variant?: 'primary' | 'secondary' | 'warn' | 'danger';
  }) => {
    const base =
      'cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-extrabold rounded-lg transition focus:outline-none';
    const styles =
      variant === 'primary'
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : variant === 'secondary'
        ? cx(
            isDark
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700'
              : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
          )
        : variant === 'warn'
        ? 'bg-amber-600 hover:bg-amber-700 text-white'
        : 'bg-red-600 hover:bg-red-700 text-white';

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cx(base, styles, colors.ring, disabled && 'opacity-50 cursor-not-allowed')}
      >
        {icon}
        {label}
      </button>
    );
  };

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setSortBy('date');
    setSortOrder('desc');
    setShowAdvancedFilters(false);
  }, []);

  /* ------------------------------ Email Receipt ------------------------------ */

  const openEmailModal = useCallback(() => {
    if (!selectedTransaction) return;
    const defaultTo = selectedTransaction.patient.email ?? '';
    setEmailTo(defaultTo);
    setEmailSubject(`Receipt ${selectedTransaction.receipt_number}`);
    setEmailNote('');
    setEmailOpen(true);
  }, [selectedTransaction]);

  const submitEmail = useCallback(async () => {
    if (!selectedTransaction) return;

    const to = emailTo.trim();
    if (!to || !to.includes('@')) {
      showToast('Enter a valid email address.', 'error');
      return;
    }

    setEmailSending(true);
    try {
      // Mock send delay — replace with API call
      await new Promise(res => setTimeout(res, 1200));
      showToast(`Receipt emailed to ${to}`, 'success');
      setEmailOpen(false);
    } catch {
      showToast('Failed to send receipt email.', 'error');
    } finally {
      setEmailSending(false);
    }
  }, [emailTo, selectedTransaction, showToast]);

  /* ------------------------------ Refund (Items) ----------------------------- */

  const resetRefundForm = useCallback(() => {
    setRefundMethod('cash');
    setRefundReference('');
    setRefundReason('');
    setRefundProcessedBy('Admin User');
    setRefundQtyByItem({});
  }, []);

  const openRefundModal = useCallback(() => {
    if (!selectedTransaction) return;
    if (selectedTransaction.voided) {
      showToast('Cannot refund a voided transaction.', 'error');
      return;
    }
    resetRefundForm();
    setRefundOpen(true);
  }, [resetRefundForm, selectedTransaction, showToast]);

  const refundComputed = useMemo(() => {
    if (!selectedTransaction) return { items: [] as RefundLineItem[], total: 0 };

    const items: RefundLineItem[] = [];

    for (const ci of selectedTransaction.charge_items) {
      const q = Math.max(0, Math.floor(refundQtyByItem[ci.id] ?? 0));
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
  }, [refundQtyByItem, selectedTransaction]);

  const setRefundQtySafe = useCallback(
    (chargeItemId: number, requestedQty: number) => {
      if (!selectedTransaction) return;

      const ci = selectedTransaction.charge_items.find(x => x.id === chargeItemId);
      if (!ci) return;

      const alreadyRefundedQty = selectedRefundedQtyMap.get(chargeItemId) ?? 0;
      const refundableQty = Math.max(0, ci.quantity - alreadyRefundedQty);

      const q = Math.max(0, Math.min(refundableQty, Math.floor(requestedQty || 0)));

      setRefundQtyByItem(prev => ({ ...prev, [chargeItemId]: q }));
    },
    [selectedRefundedQtyMap, selectedTransaction]
  );

  const selectAllRefundable = useCallback(() => {
    if (!selectedTransaction) return;
    const next: Record<number, number> = {};

    for (const ci of selectedTransaction.charge_items) {
      const alreadyRefundedQty = selectedRefundedQtyMap.get(ci.id) ?? 0;
      const refundableQty = Math.max(0, ci.quantity - alreadyRefundedQty);
      if (refundableQty > 0) next[ci.id] = refundableQty;
    }

    setRefundQtyByItem(next);
  }, [selectedRefundedQtyMap, selectedTransaction]);

  const clearRefundSelection = useCallback(() => {
    setRefundQtyByItem({});
  }, []);

  const submitRefund = useCallback(() => {
    if (!selectedTransaction || !derivedFinancials) return;

    const errors: string[] = [];

    if (selectedTransaction.voided) errors.push('This transaction is voided. Refunds are not allowed.');
    if (!refundReason.trim()) errors.push('Refund reason is required.');
    if ((refundMethod === 'card' || refundMethod === 'mobile') && !refundReference.trim()) {
      errors.push('Reference is required for card/mobile refunds.');
    }

    if (refundComputed.items.length === 0) {
      errors.push('Select at least one item quantity to refund.');
    }

    // Validate per-item qty again (final enforcement)
    for (const li of refundComputed.items) {
      const ci = selectedTransaction.charge_items.find(x => x.id === li.charge_item_id);
      if (!ci) {
        errors.push('Invalid refund item selected.');
        continue;
      }
      const alreadyRefundedQty = selectedRefundedQtyMap.get(li.charge_item_id) ?? 0;
      const refundableQty = Math.max(0, ci.quantity - alreadyRefundedQty);
      if (li.quantity_refunded > refundableQty) {
        errors.push(`Refund qty too high for ${ci.service.name}. Max refundable: ${refundableQty}`);
      }
    }

    if (refundComputed.total <= 0) errors.push('Refund total must be greater than 0.');
    if (refundComputed.total > derivedFinancials.refundableMax) {
      errors.push(
        `Refund exceeds refundable maximum (Net Paid: ${formatCurrency(derivedFinancials.refundableMax)}).`
      );
    }

    if (errors.length) {
      showToast(errors[0], 'error');
      return;
    }

    const now = new Date();
    const record: RefundRecord = {
      id: `RFD-${Date.now()}`,
      refund_receipt_number: `REF-${now.getFullYear()}${String(selectedTransaction.id).padStart(4, '0')}-${String(
        (selectedTransaction.refunds?.length ?? 0) + 1
      ).padStart(2, '0')}`,
      created_at: isoNow(),
      processed_by: refundProcessedBy,
      method: refundMethod,
      reference: refundReference.trim() || undefined,
      reason: refundReason.trim(),
      status: 'processed',
      items: refundComputed.items,
      total_amount: refundComputed.total,
    };

    setTransactions(prev =>
      prev.map(t =>
        t.id === selectedTransaction.id ? { ...t, refunds: [...(t.refunds ?? []), record] } : t
      )
    );

    setRefundOpen(false);
    showToast(`Refund processed: ${formatCurrency(record.total_amount)}`, 'success');
  }, [
    derivedFinancials,
    refundComputed.items,
    refundComputed.total,
    refundMethod,
    refundProcessedBy,
    refundReason,
    refundReference,
    selectedRefundedQtyMap,
    selectedTransaction,
    showToast,
  ]);

  /* ---------------------------------- Void ---------------------------------- */

  const openVoidModal = useCallback(() => {
    if (!selectedTransaction) return;
    setVoidReason('');
    setVoidOpen(true);
  }, [selectedTransaction]);

  const submitVoid = useCallback(() => {
    if (!selectedTransaction) return;

    const reason = voidReason.trim();
    if (!reason) {
      showToast('Void reason is required.', 'error');
      return;
    }
    if (selectedTransaction.voided) {
      showToast('This transaction is already voided.', 'error');
      return;
    }

    const voided: VoidRecord = {
      voided_at: isoNow(),
      voided_by: voidBy,
      reason,
    };

    setTransactions(prev => prev.map(t => (t.id === selectedTransaction.id ? { ...t, voided } : t)));
    setVoidOpen(false);
    showToast('Transaction voided.', 'success');
  }, [selectedTransaction, showToast, voidBy, voidReason]);

  /* --------------------------------- Render --------------------------------- */

  return (
    <div className={cx('h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6', colors.bg.primary)}>
      {/* Toast */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(s => ({ ...s, show: false }))}
      />

      {/* Print styles (scoped). react-to-print prints only receipt node, but we also ensure nice output */}
      <style>{`
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .receipt-print {
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page { margin: 10mm; }
        }
      `}</style>

      {/* Mobile Tabs */}
      <div className="no-print lg:hidden mb-4">
        <div className={cx('flex items-center gap-2 p-1 rounded-xl border', colors.border.primary)}>
          <button
            onClick={() => setActivePane('list')}
            className={cx(
              'cursor-pointer flex-1 px-3 py-2 text-xs font-extrabold rounded-lg transition',
              activePane === 'list'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'text-gray-200 hover:bg-gray-800'
                : 'text-gray-900 hover:bg-gray-50'
            )}
          >
            Records
          </button>
          <button
            onClick={() => setActivePane('receipt')}
            className={cx(
              'cursor-pointer flex-1 px-3 py-2 text-xs font-extrabold rounded-lg transition',
              activePane === 'receipt'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'text-gray-200 hover:bg-gray-800'
                : 'text-gray-900 hover:bg-gray-50'
            )}
          >
            Receipt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-full min-h-0">
        {/* LEFT: Transaction List */}
        <div
          className={cx(
            'no-print flex flex-col h-full min-h-0 border rounded-lg shadow-sm overflow-hidden',
            colors.border.primary,
            colors.bg.elevated,
            activePane === 'receipt' ? 'lg:flex hidden' : 'flex'
          )}
        >
          {/* Header */}
          <div className={cx('flex-shrink-0 px-4 py-3 border-b', colors.border.primary, colors.bg.secondary)}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h3 className={cx('text-sm sm:text-base font-extrabold', colors.text.primary)}>
                  Visit Records
                </h3>
                <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                  Search receipts, patients, services, references.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowAdvancedFilters(v => !v)}
                  className={cx(
                    'cursor-pointer p-2 rounded-lg transition',
                    isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800'
                  )}
                  title="Toggle filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <span className={cx('text-xs px-2 py-1 rounded-full', colors.text.secondary, pillBg)}>
                  {filteredTransactions.length} txns
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className={cx('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', colors.text.tertiary)} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by receipt, patient, service, ref..."
                className={cx(
                  'w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                  colors.ring
                )}
              />
            </div>

            {/* Filters */}
            {showAdvancedFilters && (
              <div className={cx('pt-3 border-t', colors.border.primary)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Status</span>
                    <div className="mt-1 flex items-center gap-2">
                      <Filter className={cx('w-4 h-4', colors.text.tertiary)} />
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className={cx(
                          'w-full text-sm border rounded-lg px-3 py-2 focus:outline-none',
                          colors.border.primary,
                          isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                          colors.ring
                        )}
                      >
                        <option value="all">All</option>
                        <option value="settled">Settled</option>
                        <option value="ready">Ready</option>
                        <option value="draft">Draft</option>
                        <option value="partially_refunded">Partially Refunded</option>
                        <option value="refunded">Refunded</option>
                        <option value="voided">Voided</option>
                      </select>
                    </div>
                  </label>

                  <label className="block">
                    <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Sort</span>
                    <div className="mt-1 flex items-center gap-2">
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        className={cx(
                          'flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none',
                          colors.border.primary,
                          isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                          colors.ring
                        )}
                      >
                        <option value="date">Date</option>
                        <option value="amount">Amount</option>
                        <option value="patient">Patient</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
                        className={cx(
                          'cursor-pointer p-2 rounded-lg border transition',
                          colors.border.primary,
                          isDark ? 'hover:bg-gray-800 text-gray-100' : 'hover:bg-gray-50 text-gray-900'
                        )}
                        title="Toggle sort order"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </div>
                  </label>

                  <label className="block">
                    <span className={cx('text-xs font-extrabold', colors.text.secondary)}>From</span>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={e => setDateRange(v => ({ ...v, start: e.target.value }))}
                      className={cx(
                        'mt-1 w-full text-sm border rounded-lg px-3 py-2 focus:outline-none',
                        colors.border.primary,
                        isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                        colors.ring
                      )}
                    />
                  </label>

                  <label className="block">
                    <span className={cx('text-xs font-extrabold', colors.text.secondary)}>To</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={e => setDateRange(v => ({ ...v, end: e.target.value }))}
                      className={cx(
                        'mt-1 w-full text-sm border rounded-lg px-3 py-2 focus:outline-none',
                        colors.border.primary,
                        isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                        colors.ring
                      )}
                    />
                  </label>

                  <div className="sm:col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={clearFilters}
                      className={cx(
                        'cursor-pointer text-xs font-extrabold px-3 py-2 rounded-lg border transition',
                        colors.border.primary,
                        isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollbarGutter: 'stable' }}>
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-4">
                <FileText className={cx('w-12 h-12 mb-3', colors.text.tertiary)} />
                <p className={cx('text-sm text-center', colors.text.secondary)}>No transactions found</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredTransactions.map(t => {
                  const derived = deriveStatus(t);
                  const isSelected = selectedId === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={cx(
                        'cursor-pointer p-3 border rounded-lg transition-all duration-200',
                        colors.border.primary,
                        isSelected
                          ? cx(colors.bg.selected, 'border-blue-300', isDark && 'border-blue-700', 'shadow-md')
                          : cx(colors.bg.hover, 'hover:shadow-sm')
                      )}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={cx('text-xs font-mono font-extrabold', colors.text.primary)}>
                              {t.receipt_number}
                            </span>
                            <span className={cx('px-2 py-0.5 rounded-full text-xs font-extrabold', statusPillClass(isDark, derived))}>
                              {statusLabel(derived)}
                            </span>
                          </div>
                          <h4 className={cx('text-sm font-extrabold truncate', colors.text.primary)}>
                            {t.patient.name}
                          </h4>
                          <p className={cx('text-xs', colors.text.secondary)}>{t.patient.patient_number}</p>
                        </div>
                        <ChevronRight className={cx('w-5 h-5 flex-shrink-0', colors.text.tertiary)} />
                      </div>

                      <div className="flex items-center gap-3 text-xs mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className={cx('w-3.5 h-3.5', colors.text.secondary)} />
                          <span className={colors.text.secondary}>{formatDisplayDate(t.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className={cx('w-3.5 h-3.5', colors.text.secondary)} />
                          <span className={colors.text.secondary}>{t.time}</span>
                        </div>
                      </div>

                      <div className={cx('flex items-center justify-between mt-2 pt-2 border-t', colors.border.primary)}>
                        <span className={cx('text-sm font-extrabold', colors.text.primary)}>
                          {formatCurrency(t.billing_data.grandTotal)}
                        </span>

                        <div className="flex items-center gap-1">
                          {t.payment_methods.map(pm => (
                            <div
                              key={pm.id}
                              className="flex items-center"
                              title={`${pm.type}: ${formatCurrency(pm.amount)}${pm.reference ? ` • ${pm.reference}` : ''}`}
                            >
                              {paymentIcon(pm.type)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className={cx('flex-shrink-0 px-4 py-3 border-t', colors.border.primary, colors.bg.secondary)}>
            <div className="flex items-start gap-2">
              <AlertCircle className={cx('w-4 h-4 flex-shrink-0 mt-0.5', colors.text.tertiary)} />
              <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
                Refunds are item-based and quantity-based — you can partially refund by reducing quantities.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Receipt View */}
        <div
          className={cx(
            'flex flex-col h-full min-h-0 border rounded-lg shadow-sm overflow-hidden',
            colors.border.primary,
            colors.bg.elevated,
            activePane === 'list' ? 'lg:flex hidden' : 'flex'
          )}
        >
          {/* Header */}
          <div className={cx('flex-shrink-0 px-4 py-3 border-b', colors.border.primary, colors.bg.secondary)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Receipt className={cx('w-5 h-5', colors.text.secondary)} />
                  <h3 className={cx('text-sm sm:text-base font-extrabold', colors.text.primary)}>
                    Receipt Details
                  </h3>
                </div>
                <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                  {selectedTransaction ? 'Preview, print, email, refund (item-based), void' : 'Select a transaction to view receipt'}
                </p>
              </div>

              {selectedTransaction && derivedFinancials && (
                <span
                  className={cx(
                    'px-2 py-1 rounded-full text-xs font-extrabold flex-shrink-0',
                    statusPillClass(isDark, derivedFinancials.status)
                  )}
                >
                  {statusLabel(derivedFinancials.status)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-wrap gap-2 no-print">
              <ActionButton
                onClick={() => {
                  if (!selectedTransaction) return;
                  if (!receiptRef.current) {
                    showToast('Receipt is not ready to print yet.', 'error');
                    return;
                  }
                  handlePrint?.();
                }}
                disabled={!selectedTransaction || isPrinting}
                icon={<Printer className="w-4 h-4" />}
                label={isPrinting ? 'Printing…' : 'Print'}
                variant="primary"
              />

              <ActionButton
                onClick={openEmailModal}
                disabled={!selectedTransaction}
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                variant="secondary"
              />

              <ActionButton
                onClick={openRefundModal}
                disabled={!selectedTransaction || (selectedTransaction?.voided ?? false)}
                icon={<Undo2 className="w-4 h-4" />}
                label="Refund"
                variant="warn"
              />

              <ActionButton
                onClick={openVoidModal}
                disabled={!selectedTransaction || (selectedTransaction?.voided ?? false)}
                icon={<Ban className="w-4 h-4" />}
                label="Void"
                variant="danger"
              />
            </div>
          </div>

          {/* Receipt body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0" style={{ scrollbarGutter: 'stable' }}>
            {!selectedTransaction || !derivedFinancials ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Receipt className={cx('w-16 h-16 mb-3', colors.text.tertiary)} />
                <p className={cx('text-sm text-center', colors.text.secondary)}>
                  Select a transaction from the left panel to view the receipt
                </p>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[440px]">
                {/* Printable wrapper */}
                <div ref={receiptRef} className="receipt-print">
                  <div className="border border-gray-300 bg-white text-black p-5 rounded-lg shadow-lg relative overflow-hidden">
                    {/* Watermark (prints) */}
                    {(() => {
                      const wm = watermarkForStatus(derivedFinancials.status, derivedFinancials.balanceDue);
                      return (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] opacity-[0.08]">
                            <span className={cx('text-6xl font-extrabold tracking-widest', wm.color)}>
                              {wm.text}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Receipt Header */}
                    <div className="text-center mb-4 relative">
                      <h2 className="text-xl font-extrabold">MEDICAL CLINIC</h2>
                      <p className="text-xs text-gray-600 mt-1">123 Health Street, Kampala</p>
                      <p className="text-xs text-gray-600">Phone: +256 700 000 000</p>
                    </div>

                    {/* VOID banner */}
                    {selectedTransaction.voided && (
                      <div className="mb-3 p-2 border border-red-300 bg-red-50 rounded text-xs relative">
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4 text-red-700" />
                          <p className="font-extrabold text-red-700">VOIDED</p>
                        </div>
                        <p className="text-red-700 mt-1">{selectedTransaction.voided.reason}</p>
                        <p className="text-[11px] text-red-700 mt-1">
                          {selectedTransaction.voided.voided_by} •{' '}
                          {new Date(selectedTransaction.voided.voided_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Receipt Meta */}
                    <div className="border-t border-b border-gray-300 py-2 my-3 text-xs space-y-1 relative">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Receipt:</span>
                        <span className="font-extrabold">{selectedTransaction.receipt_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Visit ID:</span>
                        <span className="font-semibold">{selectedTransaction.visit_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patient:</span>
                        <span className="font-semibold">{selectedTransaction.patient.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patient #:</span>
                        <span>{selectedTransaction.patient.patient_number}</span>
                      </div>
                      {selectedTransaction.patient.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="text-[11px]">{selectedTransaction.patient.email}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span>{formatDisplayDate(selectedTransaction.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span>{selectedTransaction.time}</span>
                      </div>
                      {selectedTransaction.settled_by && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Settled by:</span>
                          <span>{selectedTransaction.settled_by}</span>
                        </div>
                      )}
                    </div>

                    {/* Services */}
                    <div className="mb-3 relative">
                      <h3 className="text-sm font-extrabold mb-2">Services rendered</h3>
                      <div className="space-y-2">
                        {selectedTransaction.charge_items.map(item => {
                          const refundedQty = selectedRefundedQtyMap.get(item.id) ?? 0;
                          const netQty = Math.max(0, item.quantity - refundedQty);

                          return (
                            <div
                              key={item.id}
                              className={cx(
                                'flex justify-between text-xs border-b border-gray-100 pb-1.5',
                                netQty === 0 && refundedQty > 0 && 'text-gray-400'
                              )}
                            >
                              <div className="min-w-0 pr-2 flex-1">
                                <p className="font-semibold truncate">{item.service.name}</p>
                                <p className="text-[11px] text-gray-600">
                                  {item.quantity} × {formatCurrency(item.service.unitPrice)} • {item.service.code}
                                  {refundedQty > 0 && (
                                    <span className="ml-2 text-[11px] text-fuchsia-700 font-bold">
                                      (refunded {refundedQty} → net {netQty})
                                    </span>
                                  )}
                                </p>
                              </div>

                              <span className="font-extrabold flex-shrink-0">
                                {formatCurrency(item.totalAmount)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="border-t border-gray-300 pt-2 text-xs space-y-1.5 relative">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold">
                          {formatCurrency(selectedTransaction.billing_data.subtotal)}
                        </span>
                      </div>

                      {selectedTransaction.discount.value > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>
                            Discount{' '}
                            {selectedTransaction.discount.type === 'percentage'
                              ? `(${selectedTransaction.discount.value}%)`
                              : ''}
                          </span>
                          <span className="font-semibold">
                            -{formatCurrency(selectedTransaction.billing_data.discountAmount)}
                          </span>
                        </div>
                      )}

                      {selectedTransaction.taxes.map((tax, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{tax.name}</span>
                          <span className="font-semibold">{formatCurrency(tax.amount)}</span>
                        </div>
                      ))}

                      <div className="flex justify-between font-extrabold text-sm mt-2 pt-2 border-t border-gray-300">
                        <span>TOTAL</span>
                        <span>{formatCurrency(selectedTransaction.billing_data.grandTotal)}</span>
                      </div>

                      <div className="flex justify-between mt-2">
                        <span className="text-gray-600">Total Paid</span>
                        <span className="font-extrabold">
                          {formatCurrency(selectedTransaction.billing_data.totalPaid)}
                        </span>
                      </div>

                      {derivedFinancials.refunded > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Refunded</span>
                          <span className="font-extrabold text-fuchsia-700">
                            -{formatCurrency(derivedFinancials.refunded)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-600">Net Paid</span>
                        <span className="font-extrabold">{formatCurrency(derivedFinancials.netPaid)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Balance</span>
                        <span
                          className={cx(
                            'font-extrabold',
                            derivedFinancials.balanceDue === 0 ? 'text-green-700' : 'text-amber-700'
                          )}
                        >
                          {derivedFinancials.balanceDue === 0
                            ? 'PAID'
                            : `DUE ${formatCurrency(derivedFinancials.balanceDue)}`}
                        </span>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="mt-3 pt-3 border-t border-gray-300 text-xs relative">
                      <h3 className="text-sm font-extrabold mb-2">Payment</h3>
                      <div className="space-y-1.5">
                        {selectedTransaction.payment_methods.map(pm => (
                          <div key={pm.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {paymentIcon(pm.type)}
                              <span className="capitalize font-semibold">{pm.type}</span>
                              {pm.details && (
                                <span className="text-[10px] text-gray-500 truncate">({pm.details})</span>
                              )}
                              {pm.reference && (
                                <span className="text-[10px] text-gray-500 truncate">Ref: {pm.reference}</span>
                              )}
                            </div>
                            <span className="font-extrabold">{formatCurrency(pm.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Refunds */}
                    {(selectedTransaction.refunds?.length ?? 0) > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 text-xs relative">
                        <h3 className="text-sm font-extrabold mb-2">Refunds</h3>

                        <div className="space-y-3">
                          {selectedTransaction.refunds!.map(r => (
                            <div key={r.id} className="border border-gray-200 rounded-lg p-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-extrabold text-[12px]">
                                    {r.refund_receipt_number}{' '}
                                    <span className="text-gray-500 font-normal">
                                      • {new Date(r.created_at).toLocaleString()}
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-gray-600 mt-0.5">
                                    {r.method.toUpperCase()}
                                    {r.reference ? ` • Ref: ${r.reference}` : ''}
                                    {' • '}
                                    {r.processed_by}
                                  </p>
                                  <p className="text-[11px] text-gray-700 italic mt-0.5">{r.reason}</p>
                                </div>

                                <div className="text-right flex-shrink-0">
                                  <p className="font-extrabold text-fuchsia-700">
                                    -{formatCurrency(r.total_amount)}
                                  </p>
                                  <p className="text-[10px] text-gray-500">{r.status.toUpperCase()}</p>
                                </div>
                              </div>

                              <div className="mt-2 border-t border-gray-100 pt-2 space-y-1">
                                {r.items.map((li, idx) => (
                                  <div key={idx} className="flex justify-between text-[11px]">
                                    <span className="text-gray-700">
                                      {li.service_name} ({li.service_code}) • {li.quantity_refunded} ×{' '}
                                      {formatCurrency(li.unitPrice)}
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      {formatCurrency(li.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedTransaction.additional_notes && (
                      <div className="mt-3 pt-3 border-t border-gray-300 text-xs relative">
                        <h3 className="text-sm font-extrabold mb-1">Notes</h3>
                        <p className="text-gray-700 italic">{selectedTransaction.additional_notes}</p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="text-center mt-4 pt-3 border-t border-gray-300 relative">
                      <p className="text-[11px] text-gray-600">Computer generated receipt</p>
                      <p className="text-[11px] text-gray-600">Valid without signature</p>
                    </div>
                  </div>
                </div>

                {/* Small hint */}
                <div className={cx('mt-3 p-3 rounded-lg border no-print', isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white')}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className={cx('w-4 h-4 mt-0.5 flex-shrink-0', isDark ? 'text-green-400' : 'text-green-600')} />
                    <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
                      Printing is scoped to the receipt card only. Refunds are recorded as item quantities and displayed on the receipt.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={cx('no-print flex-shrink-0 px-4 py-3 border-t', colors.border.primary, colors.bg.secondary)}>
            <div className="flex items-start gap-2">
              <AlertCircle className={cx('w-4 h-4 flex-shrink-0 mt-0.5', colors.text.tertiary)} />
              <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
                {selectedTransaction
                  ? `Viewing ${selectedTransaction.receipt_number} • ${selectedTransaction.patient.name}`
                  : 'Select a transaction to view its receipt details'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------ Refund Modal ------------------------------ */}
      <Modal
        open={refundOpen}
        title="Process Refund (Item & Quantity Based)"
        subtitle="Select items and quantities to refund. Refund total is calculated automatically."
        onClose={() => setRefundOpen(false)}
        theme={theme}
      >
        {!selectedTransaction || !derivedFinancials ? (
          <p className={cx('text-sm', colors.text.secondary)}>No transaction selected.</p>
        ) : (
          <div className="space-y-4">
            <div className={cx('p-3 rounded-lg border', isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50')}>
              <p className={cx('text-xs', colors.text.secondary)}>
                Refundable max (Net Paid):{' '}
                <span className={cx('font-extrabold', colors.text.primary)}>
                  {formatCurrency(derivedFinancials.refundableMax)}
                </span>
              </p>
              <p className={cx('text-xs mt-1', colors.text.secondary)}>
                Receipt: <span className={cx('font-extrabold', colors.text.primary)}>{selectedTransaction.receipt_number}</span>
              </p>
            </div>

            {/* Item selection */}
            <div className="flex items-center justify-between gap-2">
              <h4 className={cx('text-sm font-extrabold', colors.text.primary)}>Refund items</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllRefundable}
                  className={cx(
                    'cursor-pointer text-xs font-extrabold px-3 py-2 rounded-lg border transition',
                    colors.border.primary,
                    isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50'
                  )}
                >
                  Select all refundable
                </button>
                <button
                  onClick={clearRefundSelection}
                  className={cx(
                    'cursor-pointer text-xs font-extrabold px-3 py-2 rounded-lg border transition',
                    colors.border.primary,
                    isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50'
                  )}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={cx('border rounded-lg overflow-hidden', colors.border.primary)}>
              <div className={cx('px-3 py-2 text-xs font-extrabold', isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-50 text-gray-900')}>
                Set refund quantity per item (max refundable enforced)
              </div>

              <div className={cx('divide-y', colors.border.primary)}>
                {selectedTransaction.charge_items.map(ci => {
                  const alreadyRefundedQty = selectedRefundedQtyMap.get(ci.id) ?? 0;
                  const refundableQty = Math.max(0, ci.quantity - alreadyRefundedQty);
                  const current = refundQtyByItem[ci.id] ?? 0;

                  return (
                    <div key={ci.id} className={cx('p-3', refundableQty === 0 && (isDark ? 'bg-gray-900/40' : 'bg-gray-50'))}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className={cx('text-sm font-extrabold truncate', colors.text.primary)}>
                            {ci.service.name}{' '}
                            <span className={cx('text-xs font-mono', colors.text.tertiary)}>
                              ({ci.service.code})
                            </span>
                          </p>
                          <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                            Unit: {formatCurrency(ci.service.unitPrice)} • Original qty: {ci.quantity} • Already refunded: {alreadyRefundedQty} • Refundable: {refundableQty}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={refundableQty}
                            value={refundableQty === 0 ? 0 : current}
                            disabled={refundableQty === 0}
                            onChange={e => setRefundQtySafe(ci.id, Number(e.target.value))}
                            className={cx(
                              'w-20 px-3 py-2 text-sm border rounded-lg focus:outline-none',
                              colors.border.primary,
                              isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                              colors.ring,
                              refundableQty === 0 ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                            )}
                          />
                          <div className="text-right w-28">
                            <p className={cx('text-xs', colors.text.secondary)}>Line refund</p>
                            <p className={cx('text-sm font-extrabold', colors.text.primary)}>
                              {formatCurrency(ci.service.unitPrice * Math.max(0, Math.floor(current)))}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Refund meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Method</span>
                <select
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value as PaymentType)}
                  className={cx(
                    'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none cursor-pointer',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                    colors.ring
                  )}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="mobile">Mobile</option>
                  <option value="insurance">Insurance</option>
                </select>
              </label>

              <label className="block">
                <span className={cx('text-xs font-extrabold', colors.text.secondary)}>
                  Reference {(refundMethod === 'card' || refundMethod === 'mobile') ? '(required)' : '(optional)'}
                </span>
                <input
                  value={refundReference}
                  onChange={e => setRefundReference(e.target.value)}
                  placeholder="e.g. reversal ref / momo ref"
                  className={cx(
                    'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                    colors.ring
                  )}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Reason (required)</span>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="e.g. Wrong quantity, service not provided, cancellation..."
                  rows={3}
                  className={cx(
                    'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                    colors.ring
                  )}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Processed by</span>
                <input
                  value={refundProcessedBy}
                  onChange={e => setRefundProcessedBy(e.target.value)}
                  className={cx(
                    'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                    colors.ring
                  )}
                />
              </label>
            </div>

            {/* Total */}
            <div className={cx('p-3 rounded-lg border', isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50')}>
              <div className="flex items-center justify-between">
                <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Refund total (auto)</span>
                <span className={cx('text-sm font-extrabold', refundComputed.total > derivedFinancials.refundableMax ? 'text-red-600' : colors.text.primary)}>
                  {formatCurrency(refundComputed.total)}
                </span>
              </div>
              {refundComputed.total > derivedFinancials.refundableMax && (
                <p className="text-xs text-red-600 mt-1">
                  Refund exceeds Net Paid. Reduce quantities to proceed.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRefundOpen(false)}
                className={cx(
                  'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg border transition',
                  isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-900 hover:bg-gray-50'
                )}
              >
                Cancel
              </button>
              <button
                onClick={submitRefund}
                className={cx(
                  'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg bg-amber-600 hover:bg-amber-700 text-white',
                  (refundComputed.total <= 0 || refundComputed.total > derivedFinancials.refundableMax) && 'opacity-50 cursor-not-allowed'
                )}
                disabled={refundComputed.total <= 0 || refundComputed.total > derivedFinancials.refundableMax}
              >
                Process Refund
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ------------------------------- Email Modal ------------------------------ */}
      <Modal
        open={emailOpen}
        title="Email Receipt"
        subtitle="This is a mock send flow. Replace with your backend email service."
        onClose={() => setEmailOpen(false)}
        theme={theme}
      >
        {!selectedTransaction ? (
          <p className={cx('text-sm', colors.text.secondary)}>No transaction selected.</p>
        ) : (
          <div className="space-y-4">
            <div className={cx('p-3 rounded-lg border', isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50')}>
              <p className={cx('text-xs', colors.text.secondary)}>
                Receipt: <span className={cx('font-extrabold', colors.text.primary)}>{selectedTransaction.receipt_number}</span>
              </p>
              <p className={cx('text-xs mt-1', colors.text.secondary)}>
                Patient: <span className={cx('font-extrabold', colors.text.primary)}>{selectedTransaction.patient.name}</span>
              </p>
            </div>

            <label className="block">
              <span className={cx('text-xs font-extrabold', colors.text.secondary)}>To</span>
              <input
                value={emailTo}
                onChange={e => setEmailTo(e.target.value)}
                placeholder="patient@email.com"
                className={cx(
                  'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                  colors.ring
                )}
              />
            </label>

            <label className="block">
              <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Subject</span>
              <input
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className={cx(
                  'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                  colors.ring
                )}
              />
            </label>

            <label className="block">
              <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Message (optional)</span>
              <textarea
                value={emailNote}
                onChange={e => setEmailNote(e.target.value)}
                rows={3}
                className={cx(
                  'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                  colors.ring
                )}
                placeholder="Add a note to the patient…"
              />
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setEmailOpen(false)}
                className={cx(
                  'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg border transition',
                  isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-900 hover:bg-gray-50'
                )}
              >
                Cancel
              </button>
              <button
                onClick={submitEmail}
                disabled={emailSending}
                className={cx(
                  'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg bg-blue-600 hover:bg-blue-700 text-white',
                  emailSending && 'opacity-50 cursor-not-allowed'
                )}
              >
                {emailSending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* -------------------------------- Void Modal ------------------------------ */}
      <Modal
        open={voidOpen}
        title="Void Transaction"
        subtitle="Voiding marks the receipt invalid and prevents further refunds."
        onClose={() => setVoidOpen(false)}
        theme={theme}
      >
        {!selectedTransaction ? (
          <p className={cx('text-sm', colors.text.secondary)}>No transaction selected.</p>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-800 text-xs">
              <p className="font-extrabold">Warning</p>
              <p className="mt-1">
                This will label the receipt as VOIDED and block refunds.
              </p>
            </div>

            <label className="block">
              <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Reason (required)</span>
              <textarea
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                rows={3}
                className={cx(
                  'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                  colors.ring
                )}
                placeholder="e.g. Duplicate entry, wrong patient, canceled visit..."
              />
            </label>

            <label className="block">
              <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Voided by</span>
              <input
                value={voidBy}
                onChange={e => setVoidBy(e.target.value)}
                className={cx(
                  'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                  colors.ring
                )}
              />
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setVoidOpen(false)}
                className={cx(
                  'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg border transition',
                  isDark ? 'border-gray-700 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-900 hover:bg-gray-50'
                )}
              >
                Cancel
              </button>
              <button
                onClick={submitVoid}
                className="cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Void Transaction
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MRBillingReview;
