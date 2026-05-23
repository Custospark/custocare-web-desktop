import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  Search,
  Filter,
  Eye,
  Upload,
  X,
  Plus,
  Smartphone,
  Landmark,
  DollarSign,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  CheckCheck,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  useGetFacilityPayments,
  useRecordPayment,
} from '../../api/subscriptions/SubscriptionQueries';
import {
  type Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
} from '../../api/subscriptions/SubscriptionTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../shared/types/cn';

// ─── Bank Account Constants ───────────────────────────────────────────────────
const BANK_DETAILS = {
  bank: 'Stanbic Bank Uganda',
  accountName: 'Custospark Company Ltd',
  accountNumber: '9030027316580',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaymentsProps {
  theme: 'light' | 'dark';
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string;
  theme: 'light' | 'dark';
  size?: 'sm' | 'md';
}

interface PaymentFilters {
  status: PaymentStatus | 'all';
  type: PaymentType | 'all';
  method: PaymentMethod | 'all';
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface RecordPaymentFormData {
  amount: number;
  currency: string;
  method: PaymentMethod;
  payment_type: PaymentType;
  transaction_reference: string;
  receipt_notes: string;
  paid_at: string;
  receipt: File | null;
}

// ─── Bank Details Card ────────────────────────────────────────────────────────
interface BankDetailsCardProps {
  theme: 'light' | 'dark';
  compact?: boolean;
}

const BankDetailsCard: React.FC<BankDetailsCardProps> = ({ theme, compact = false }) => {
  const isDark = theme === 'dark';
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const rows = [
    { label: 'Bank', value: BANK_DETAILS.bank, copyKey: 'bank' },
    { label: 'Account Name', value: BANK_DETAILS.accountName, copyKey: 'name' },
    { label: 'Account Number', value: BANK_DETAILS.accountNumber, copyKey: 'number', mono: true },
  ];

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      isDark ? 'border-blue-700/50 bg-blue-900/20' : 'border-blue-200 bg-blue-50',
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center gap-2 px-4 py-3 border-b',
        isDark ? 'border-blue-700/50 bg-blue-900/30' : 'border-blue-200 bg-blue-100',
      )}>
        <Building2 className={cn('w-4 h-4', isDark ? 'text-blue-400' : 'text-blue-600')} />
        <span className={cn('font-semibold text-sm', isDark ? 'text-blue-300' : 'text-blue-700')}>
          Payment Instructions — Bank Transfer
        </span>
      </div>

      <div className={cn('divide-y', isDark ? 'divide-blue-700/30' : 'divide-blue-100')}>
        {rows.map(({ label, value, copyKey, mono }) => (
          <div key={copyKey} className="flex items-center justify-between px-4 py-2.5 gap-3">
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs mb-0.5', isDark ? 'text-blue-400' : 'text-blue-500')}>{label}</p>
              <p className={cn(
                'font-semibold text-sm truncate',
                mono ? 'font-mono tracking-wide' : '',
                isDark ? 'text-blue-100' : 'text-blue-900',
              )}>
                {value}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(value, copyKey)}
              className={cn(
                'p-1.5 rounded-lg transition-all flex-shrink-0',
                isDark ? 'hover:bg-blue-800/50 text-blue-400' : 'hover:bg-blue-200 text-blue-600',
              )}
              title={`Copy ${label}`}
            >
              {copiedField === copyKey
                ? <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>

      {!compact && (
        <div className={cn(
          'px-4 py-2.5 text-xs',
          isDark ? 'text-blue-400 bg-blue-900/10' : 'text-blue-600 bg-blue-100/50',
        )}>
          ⓘ After transferring, upload your payment receipt below and submit for approval.
          Your subscription will be activated once our team verifies the payment.
        </div>
      )}
    </div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status, theme, size = 'md' }) => {
  const isDark = theme === 'dark';

  const getStatusConfig = () => {
    switch (status) {
      case PaymentStatus.PENDING:
        return {
          icon: Clock,
          bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-100',
          text: isDark ? 'text-yellow-300' : 'text-yellow-700',
          border: isDark ? 'border-yellow-800' : 'border-yellow-200',
          label: PAYMENT_STATUS_LABELS[PaymentStatus.PENDING],
        };
      case PaymentStatus.APPROVED:
        return {
          icon: CheckCircle,
          bg: isDark ? 'bg-green-900/30' : 'bg-green-100',
          text: isDark ? 'text-green-300' : 'text-green-700',
          border: isDark ? 'border-green-800' : 'border-green-200',
          label: PAYMENT_STATUS_LABELS[PaymentStatus.APPROVED],
        };
      case PaymentStatus.REJECTED:
        return {
          icon: XCircle,
          bg: isDark ? 'bg-red-900/30' : 'bg-red-100',
          text: isDark ? 'text-red-300' : 'text-red-700',
          border: isDark ? 'border-red-800' : 'border-red-200',
          label: PAYMENT_STATUS_LABELS[PaymentStatus.REJECTED],
        };
      case PaymentStatus.REFUNDED:
        return {
          icon: RefreshCw,
          bg: isDark ? 'bg-purple-900/30' : 'bg-purple-100',
          text: isDark ? 'text-purple-300' : 'text-purple-700',
          border: isDark ? 'border-purple-800' : 'border-purple-200',
          label: PAYMENT_STATUS_LABELS[PaymentStatus.REFUNDED],
        };
      default:
        return {
          icon: AlertTriangle,
          bg: isDark ? 'bg-gray-800' : 'bg-gray-100',
          text: isDark ? 'text-gray-400' : 'text-gray-600',
          border: isDark ? 'border-gray-700' : 'border-gray-200',
          label: String(status),
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium border',
      sizeClasses,
      config.bg, config.text, config.border,
    )}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
};

// ─── Payment Method Icon ──────────────────────────────────────────────────────
const PaymentMethodIcon: React.FC<{ method: PaymentMethod | string; className?: string }> = ({
  method, className,
}) => {
  switch (method) {
    case PaymentMethod.MOBILE_MONEY:  return <Smartphone className={className} />;
    case PaymentMethod.BANK_TRANSFER: return <Landmark className={className} />;
    case PaymentMethod.CASH:          return <DollarSign className={className} />;
    default:                          return <CreditCard className={className} />;
  }
};

// ─── Payment Detail Modal ─────────────────────────────────────────────────────
interface PaymentDetailModalProps {
  theme: 'light' | 'dark';
  payment: Payment;
  onClose: () => void;
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({ theme, payment, onClose }) => {
  const isDark = theme === 'dark';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        )}
      >
        {/* Header */}
        <div className={cn(
          'sticky top-0 z-10 p-6 border-b flex items-start justify-between',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        )}>
          <div className="flex items-start gap-4">
            <div className={cn(
              'p-3 rounded-xl',
              payment.status === PaymentStatus.APPROVED
                ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                : payment.status === PaymentStatus.PENDING
                ? isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'
                : payment.status === PaymentStatus.REJECTED
                ? isDark ? 'bg-red-900/30' : 'bg-red-100'
                : isDark ? 'bg-purple-900/30' : 'bg-purple-100',
            )}>
              <PaymentMethodIcon
                method={payment.method}
                className={cn(
                  'w-6 h-6',
                  payment.status === PaymentStatus.APPROVED
                    ? isDark ? 'text-green-400' : 'text-green-600'
                    : payment.status === PaymentStatus.PENDING
                    ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                    : payment.status === PaymentStatus.REJECTED
                    ? isDark ? 'text-red-400' : 'text-red-600'
                    : isDark ? 'text-purple-400' : 'text-purple-600',
                )}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Payment Details</h2>
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Transaction #{payment.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600',
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={cn(
            'p-4 rounded-xl border flex items-start gap-3',
            payment.status === PaymentStatus.APPROVED
              ? isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
              : payment.status === PaymentStatus.PENDING
              ? isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
              : payment.status === PaymentStatus.REJECTED
              ? isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
              : isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200',
          )}>
            {payment.status === PaymentStatus.APPROVED && (
              <CheckCircle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-green-400' : 'text-green-600')} />
            )}
            {payment.status === PaymentStatus.PENDING && (
              <Clock className={cn('w-5 h-5 mt-0.5', isDark ? 'text-yellow-400' : 'text-yellow-600')} />
            )}
            {payment.status === PaymentStatus.REJECTED && (
              <XCircle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-red-400' : 'text-red-600')} />
            )}
            {payment.status === PaymentStatus.REFUNDED && (
              <RefreshCw className={cn('w-5 h-5 mt-0.5', isDark ? 'text-purple-400' : 'text-purple-600')} />
            )}
            <div className="flex-1">
              <p className="font-medium">Payment {payment.status_label}</p>
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                {payment.status === PaymentStatus.PENDING &&
                  'Your payment is under review. You will be notified once approved.'}
                {payment.status === PaymentStatus.APPROVED && payment.approved_at &&
                  <>Approved on {new Date(payment.approved_at).toLocaleDateString()} by Administrator</>}
                {payment.status === PaymentStatus.REJECTED && payment.rejection_reason &&
                  <>Reason: {payment.rejection_reason}</>}
                {payment.status === PaymentStatus.REFUNDED && 'This payment has been refunded.'}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Amount', value: `${payment.amount.toLocaleString()} ${payment.currency}`, large: true },
              { label: 'Payment Type', value: payment.payment_type_label },
              {
                label: 'Payment Method',
                value: (
                  <span className="flex items-center gap-2">
                    <PaymentMethodIcon method={payment.method} className="w-4 h-4" />
                    {payment.method_label}
                  </span>
                ),
              },
              {
                label: 'Transaction Reference',
                value: <span className="font-mono text-sm">{payment.transaction_reference || 'N/A'}</span>,
              },
              {
                label: 'Payment Date',
                value: payment.paid_at
                  ? new Date(payment.paid_at).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : 'N/A',
              },
              {
                label: 'Created',
                value: payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A',
              },
            ].map((item, i) => (
              <div key={i} className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>{item.label}</p>
                <p className={cn('font-medium', item.large ? 'text-2xl font-bold' : '')}>
                  {item.value as React.ReactNode}
                </p>
              </div>
            ))}
          </div>

          {payment.receipt_notes && (
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-2', isDark ? 'text-gray-400' : 'text-gray-500')}>Receipt Notes</p>
              <p className="text-sm">{payment.receipt_notes}</p>
            </div>
          )}

          {payment.receipt_url && (
            <div className={cn(
              'flex items-center justify-between p-4 rounded-xl border',
              isDark ? 'border-gray-700' : 'border-gray-200',
            )}>
              <div className="flex items-center gap-3">
                <FileText className={cn('w-5 h-5', isDark ? 'text-gray-400' : 'text-gray-500')} />
                <div>
                  <p className="font-medium">Payment Receipt</p>
                  <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Click to view/download
                  </p>
                </div>
              </div>
              <a
                href={payment.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
                  isDark
                    ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                )}
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          )}

          {payment.approved_by && (
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-2', isDark ? 'text-gray-400' : 'text-gray-500')}>Approved By</p>
              <p className="font-medium">Administrator (ID: {payment.approved_by.staff_id})</p>
            </div>
          )}
        </div>

        <div className={cn(
          'sticky bottom-0 p-6 border-t flex justify-end',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        )}>
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg font-medium',
              isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            )}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Record Payment Modal ─────────────────────────────────────────────────────
interface RecordPaymentModalProps {
  theme: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (data: RecordPaymentFormData) => void;
  isSubmitting: boolean;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  theme, onClose, onSubmit, isSubmitting,
}) => {
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<RecordPaymentFormData>({
    amount: 0,
    currency: 'UGX',
    method: PaymentMethod.BANK_TRANSFER,
    payment_type: PaymentType.SUBSCRIPTION,
    transaction_reference: '',
    receipt_notes: '',
    paid_at: new Date().toISOString().split('T')[0],
    receipt: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.amount || formData.amount <= 0)
      newErrors.amount = 'Amount must be greater than 0';
    if (!formData.transaction_reference.trim())
      newErrors.transaction_reference = 'Transaction / payment reference is required';
    if (!formData.paid_at)
      newErrors.paid_at = 'Payment date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, receipt: 'Only PDF, JPG, PNG files are allowed' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, receipt: 'File must be smaller than 5 MB' }));
      return;
    }
    setErrors(prev => { const e = { ...prev }; delete e.receipt; return e; });
    setFormData(prev => ({ ...prev, receipt: file }));
  };

  const inputClass = (field?: string) => cn(
    'w-full px-3 py-2.5 rounded-lg border transition-colors',
    field && errors[field]
      ? 'border-red-500 focus:ring-red-500'
      : isDark
        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500',
    'focus:outline-none focus:ring-2 focus:border-transparent',
    isSubmitting ? 'opacity-50 cursor-not-allowed' : '',
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => { if (!isSubmitting) { e.stopPropagation(); onClose(); } }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative rounded-2xl max-w-2xl w-full my-8 border shadow-2xl',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        )}
      >
        {/* Header */}
        <div className={cn(
          'sticky top-0 z-10 p-6 border-b flex items-start justify-between rounded-t-2xl',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', isDark ? 'bg-blue-500/20' : 'bg-blue-100')}>
              <Upload className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Record Payment</h2>
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                Complete your payment and upload evidence for approval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600',
              isSubmitting ? 'opacity-50 cursor-not-allowed' : '',
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ── Step 1: Bank Details ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white',
              )}>1</span>
              <p className="font-semibold">Make Payment to This Account</p>
            </div>
            <BankDetailsCard theme={theme} />
          </div>

          {/* Divider */}
          <div className={cn('border-t', isDark ? 'border-gray-800' : 'border-gray-200')} />

          {/* ── Step 2: Fill in Payment Details ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white',
              )}>2</span>
              <p className="font-semibold">Enter Your Payment Details</p>
            </div>

            <div className="space-y-5">
              {/* Amount + Currency Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Amount Paid <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className={cn(
                      'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                      isDark ? 'text-gray-500' : 'text-gray-400',
                    )} />
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }));
                        if (errors.amount) setErrors(prev => { const n = { ...prev }; delete n.amount; return n; });
                      }}
                      min="0"
                      step="100"
                      placeholder="0"
                      disabled={isSubmitting}
                      className={cn(inputClass('amount'), 'pl-10')}
                    />
                  </div>
                  {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    disabled={isSubmitting}
                    className={cn(inputClass(), 'appearance-none')}
                  >
                    <option value="UGX">UGX</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(PaymentMethod)
                    .filter(m => m !== PaymentMethod.GATEWAY)
                    .map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, method }))}
                        disabled={isSubmitting}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2',
                          formData.method === method
                            ? isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'
                            : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300',
                          isSubmitting ? 'opacity-50 cursor-not-allowed' : '',
                        )}
                      >
                        <PaymentMethodIcon
                          method={method}
                          className={cn(
                            'w-5 h-5',
                            formData.method === method
                              ? isDark ? 'text-blue-400' : 'text-blue-600'
                              : isDark ? 'text-gray-400' : 'text-gray-500',
                          )}
                        />
                        <span className={cn(
                          'text-xs font-medium',
                          formData.method === method
                            ? isDark ? 'text-blue-400' : 'text-blue-600'
                            : isDark ? 'text-gray-400' : 'text-gray-500',
                        )}>
                          {PAYMENT_METHOD_LABELS[method as PaymentMethod]}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Payment Type */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Payment Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(PaymentType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_type: type }))}
                      disabled={isSubmitting}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all text-center',
                        formData.payment_type === type
                          ? isDark ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'
                          : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300',
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : '',
                      )}
                    >
                      <span className={cn(
                        'text-sm font-medium',
                        formData.payment_type === type
                          ? isDark ? 'text-blue-400' : 'text-blue-600'
                          : isDark ? 'text-gray-400' : 'text-gray-500',
                      )}>
                        {PAYMENT_TYPE_LABELS[type as PaymentType]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transaction Reference */}
              <div>
                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Transaction / Payment Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.transaction_reference}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, transaction_reference: e.target.value }));
                    if (errors.transaction_reference) setErrors(prev => { const n = { ...prev }; delete n.transaction_reference; return n; });
                  }}
                  placeholder="e.g. STANBIC-2024-XXXXXXXXXX"
                  disabled={isSubmitting}
                  className={inputClass('transaction_reference')}
                />
                {errors.transaction_reference && (
                  <p className="mt-1 text-xs text-red-500">{errors.transaction_reference}</p>
                )}
                <p className={cn('mt-1 text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                  Enter the reference/transaction ID shown on your bank receipt or mobile money confirmation.
                </p>
              </div>

              {/* Payment Date */}
              <div>
                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Date Payment Was Made <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.paid_at}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, paid_at: e.target.value }));
                    if (errors.paid_at) setErrors(prev => { const n = { ...prev }; delete n.paid_at; return n; });
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={isSubmitting}
                  className={inputClass('paid_at')}
                />
                {errors.paid_at && <p className="mt-1 text-xs text-red-500">{errors.paid_at}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  Additional Notes <span className={cn('font-normal', isDark ? 'text-gray-500' : 'text-gray-400')}>(optional)</span>
                </label>
                <textarea
                  value={formData.receipt_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, receipt_notes: e.target.value }))}
                  placeholder="Any extra information about this payment..."
                  rows={2}
                  disabled={isSubmitting}
                  className={inputClass()}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className={cn('border-t', isDark ? 'border-gray-800' : 'border-gray-200')} />

          {/* ── Step 3: Upload Receipt ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white',
              )}>3</span>
              <p className="font-semibold">
                Upload Payment Receipt{' '}
                <span className={cn('text-sm font-normal', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  (strongly recommended)
                </span>
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileChange(e.dataTransfer.files[0] || null);
              }}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center transition-colors',
                dragOver
                  ? isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-400 bg-blue-50'
                  : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-300 hover:border-gray-400',
                isSubmitting ? 'opacity-50' : 'cursor-pointer',
              )}
            >
              <input
                type="file"
                id="receipt-upload"
                accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                disabled={isSubmitting}
                className="hidden"
              />
              <label
                htmlFor="receipt-upload"
                className={cn('cursor-pointer flex flex-col items-center gap-2', isSubmitting ? 'cursor-not-allowed' : '')}
              >
                {formData.receipt ? (
                  <>
                    <div className={cn('p-2 rounded-full', isDark ? 'bg-green-900/30' : 'bg-green-100')}>
                      <CheckCircle className={cn('w-8 h-8', isDark ? 'text-green-400' : 'text-green-600')} />
                    </div>
                    <p className={cn('font-medium text-sm', isDark ? 'text-green-300' : 'text-green-700')}>
                      {formData.receipt.name}
                    </p>
                    <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                      {(formData.receipt.size / 1024).toFixed(1)} KB — Click to change
                    </p>
                  </>
                ) : (
                  <>
                    <div className={cn('p-2 rounded-full', isDark ? 'bg-gray-800' : 'bg-gray-100')}>
                      <Upload className={cn('w-8 h-8', isDark ? 'text-gray-500' : 'text-gray-400')} />
                    </div>
                    <p className={cn('font-medium text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                      Drag & drop or click to upload receipt
                    </p>
                    <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                      PDF, PNG, JPG — max 5 MB
                    </p>
                  </>
                )}
              </label>
            </div>
            {errors.receipt && <p className="mt-1 text-xs text-red-500">{errors.receipt}</p>}
          </div>

          {/* Notice */}
          <div className={cn(
            'flex items-start gap-3 p-4 rounded-xl',
            isDark ? 'bg-amber-900/20 border border-amber-700/40' : 'bg-amber-50 border border-amber-200',
          )}>
            <AlertTriangle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', isDark ? 'text-amber-400' : 'text-amber-600')} />
            <p className={cn('text-sm', isDark ? 'text-amber-200' : 'text-amber-800')}>
              After submission your payment will be reviewed by our team. Once verified and approved,
              your subscription will be activated automatically. This typically takes 1–2 business hours.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          'sticky bottom-0 p-6 border-t flex justify-end gap-3 rounded-b-2xl',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        )}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={cn(
              'px-5 py-2.5 rounded-lg font-medium',
              isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
              isSubmitting ? 'opacity-50 cursor-not-allowed' : '',
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              'px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2',
              'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20',
              isSubmitting ? 'opacity-70 cursor-wait' : '',
            )}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Submit Payment for Approval
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const Payments: React.FC<PaymentsProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [filters, setFilters] = useState<PaymentFilters>({
    status: 'all', type: 'all', method: 'all',
    dateFrom: '', dateTo: '', search: '',
  });
  const [showFilters, setShowFilters]     = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const [itemsPerPage, setItemsPerPage]   = useState(10);

  const {
    data: paymentsResponse, isLoading, error, refetch,
  } = useGetFacilityPayments({ per_page: 100 });

  // ── KEY FIX: removed nested confirm() dialog — call mutate directly ─────────
  const recordPayment = useRecordPayment({
    onSuccess: () => {
      setShowRecordModal(false);
      refetch();
    },
  });

  const payments = paymentsResponse?.data || [];

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.type   !== 'all' && p.payment_type !== filters.type) return false;
      if (filters.method !== 'all' && p.method !== filters.method) return false;
      if (filters.dateFrom && p.paid_at) {
        if (new Date(p.paid_at).setHours(0,0,0,0) < new Date(filters.dateFrom).setHours(0,0,0,0)) return false;
      }
      if (filters.dateTo && p.paid_at) {
        if (new Date(p.paid_at).setHours(0,0,0,0) > new Date(filters.dateTo).setHours(0,0,0,0)) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          p.transaction_reference?.toLowerCase().includes(q) ||
          p.receipt_notes?.toLowerCase().includes(q) ||
          p.amount.toString().includes(q)
        );
      }
      return true;
    });
  }, [payments, filters]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const stats = useMemo(() => ({
    total:         payments.reduce((s, p) => s + p.amount, 0),
    approved:      payments.filter(p => p.status === PaymentStatus.APPROVED).reduce((s, p) => s + p.amount, 0),
    pending:       payments.filter(p => p.status === PaymentStatus.PENDING).length,
    pendingAmount: payments.filter(p => p.status === PaymentStatus.PENDING).reduce((s, p) => s + p.amount, 0),
  }), [payments]);

  // ── Direct submission — no nested confirm dialog ──────────────────────────
  const handleRecordPayment = (data: RecordPaymentFormData) => {
    recordPayment.mutate({
      data: {
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        payment_type: data.payment_type,
        transaction_reference: data.transaction_reference,
        receipt_notes: data.receipt_notes,
        paid_at: data.paid_at,
      },
      receipt: data.receipt,
    });
  };

  const handleClearFilters = () => {
    setFilters({ status: 'all', type: 'all', method: 'all', dateFrom: '', dateTo: '', search: '' });
    setCurrentPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== 'all' && v !== '').length;

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading payment history…" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={cn(
        'rounded-2xl p-10 text-center border',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
      )}>
        <div className={cn('w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
          isDark ? 'bg-red-900/30' : 'bg-red-100')}>
          <X className={cn('w-8 h-8', isDark ? 'text-red-400' : 'text-red-600')} />
        </div>
        <h3 className="text-lg font-bold mb-2">Failed to Load Payments</h3>
        <p className={cn('mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {error.message || 'Unable to fetch payment history. Please try again.'}
        </p>
        <button onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Payments</h1>
          <p className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>
            View payment history and submit new payments for approval
          </p>
        </div>
        <button
          onClick={() => setShowRecordModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* Bank Details Banner — always visible */}
      <BankDetailsCard theme={theme} compact />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Submitted', value: `${stats.total.toLocaleString()} UGX`, color: '' },
          { label: 'Approved', value: `${stats.approved.toLocaleString()} UGX`, color: 'text-green-500' },
          { label: 'Pending Count', value: stats.pending, color: 'text-yellow-500' },
          { label: 'Pending Amount', value: `${stats.pendingAmount.toLocaleString()} UGX`, color: 'text-yellow-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className={cn(
            'rounded-xl p-4 border',
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
          )}>
            <p className={cn('text-sm mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>{label}</p>
            <p className={cn('text-xl font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className={cn(
        'rounded-xl border overflow-hidden',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
      )}>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
              isDark ? 'text-gray-500' : 'text-gray-400')} />
            <input
              type="text"
              placeholder="Search by reference or notes…"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-lg border',
                isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
              )}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 border transition-all',
                showFilters
                  ? isDark ? 'bg-blue-900/30 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700'
                  : isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
              )}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className={cn(
                'px-3 py-2.5 rounded-lg border appearance-none',
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
              )}
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={cn(
                'p-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
                isDark ? 'border-gray-800' : 'border-gray-200',
              )}>
                {/* Status */}
                <div>
                  <label className={cn('block text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as PaymentStatus | 'all' }))}
                    className={cn('w-full px-3 py-2 rounded-lg border',
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500')}
                  >
                    <option value="all">All Statuses</option>
                    {Object.values(PaymentStatus).map(s => (
                      <option key={s} value={s}>{PAYMENT_STATUS_LABELS[s as PaymentStatus]}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <label className={cn('block text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Payment Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as PaymentType | 'all' }))}
                    className={cn('w-full px-3 py-2 rounded-lg border',
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500')}
                  >
                    <option value="all">All Types</option>
                    {Object.values(PaymentType).map(t => (
                      <option key={t} value={t}>{PAYMENT_TYPE_LABELS[t as PaymentType]}</option>
                    ))}
                  </select>
                </div>

                {/* Method */}
                <div>
                  <label className={cn('block text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Payment Method</label>
                  <select
                    value={filters.method}
                    onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value as PaymentMethod | 'all' }))}
                    className={cn('w-full px-3 py-2 rounded-lg border',
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500')}
                  >
                    <option value="all">All Methods</option>
                    {Object.values(PaymentMethod).map(m => (
                      <option key={m} value={m}>{PAYMENT_METHOD_LABELS[m as PaymentMethod]}</option>
                    ))}
                  </select>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={cn('block text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>From</label>
                    <input type="date" value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className={cn('w-full px-3 py-2 rounded-lg border',
                        isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500')} />
                  </div>
                  <div>
                    <label className={cn('block text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>To</label>
                    <input type="date" value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className={cn('w-full px-3 py-2 rounded-lg border',
                        isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500')} />
                  </div>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className={cn('px-4 pb-4 flex justify-end', isDark ? 'border-t border-gray-800' : 'border-t border-gray-200')}>
                  <button onClick={handleClearFilters}
                    className={cn('text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg',
                      isDark ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')}>
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table / Empty */}
      {filteredPayments.length === 0 ? (
        <div className={cn('rounded-2xl p-12 text-center border',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <div className={cn('w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
            isDark ? 'bg-gray-800' : 'bg-gray-100')}>
            <CreditCard className={cn('w-8 h-8', isDark ? 'text-gray-600' : 'text-gray-400')} />
          </div>
          <h3 className="text-lg font-bold mb-2">No Payments Found</h3>
          <p className={cn('mb-6', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {activeFilterCount > 0
              ? 'No payments match your current filters.'
              : 'No payments have been submitted yet. Use the bank details above to make a payment, then record it here.'}
          </p>
          {activeFilterCount > 0 ? (
            <button onClick={handleClearFilters}
              className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium',
                isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
              <X className="w-4 h-4" /> Clear Filters
            </button>
          ) : (
            <button onClick={() => setShowRecordModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          )}
        </div>
      ) : (
        <div className={cn('rounded-2xl border overflow-hidden',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          {/* Desktop header */}
          <div className={cn(
            'hidden lg:grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-medium uppercase tracking-wider',
            isDark ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-500',
          )}>
            <div className="col-span-3">Payment Details</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">View</div>
          </div>

          <div className="divide-y" style={{ borderColor: isDark ? '#1f2a37' : '#e5e7eb' }}>
            {paginatedPayments.map((payment) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn('p-4 lg:p-6 cursor-pointer transition-colors',
                  isDark ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50')}
                onClick={() => setSelectedPayment(payment)}
              >
                {/* Mobile */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg',
                        payment.status === PaymentStatus.APPROVED
                          ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                          : payment.status === PaymentStatus.PENDING
                          ? isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'
                          : isDark ? 'bg-red-900/30' : 'bg-red-100')}>
                        {payment.status === PaymentStatus.APPROVED
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : payment.status === PaymentStatus.PENDING
                          ? <Clock className="w-4 h-4 text-yellow-500" />
                          : <XCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{payment.amount.toLocaleString()} {payment.currency}</p>
                        <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                          {payment.payment_type_label}
                        </p>
                      </div>
                    </div>
                    <PaymentStatusBadge status={payment.status} theme={theme} size="sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Method</p>
                      <p className="flex items-center gap-1">
                        <PaymentMethodIcon method={payment.method} className="w-3 h-3" />
                        {payment.method_label}
                      </p>
                    </div>
                    <div>
                      <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Ref</p>
                      <p className="font-mono text-xs truncate">{payment.transaction_reference || 'N/A'}</p>
                    </div>
                    <div>
                      <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Date</p>
                      <p>{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    {payment.receipt_url && (
                      <div>
                        <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Receipt</p>
                        <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-500 hover:underline inline-flex items-center gap-1 text-xs">
                          <Download className="w-3 h-3" /> Download
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop */}
                <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg',
                      payment.status === PaymentStatus.APPROVED
                        ? isDark ? 'bg-green-900/30' : 'bg-green-100'
                        : payment.status === PaymentStatus.PENDING
                        ? isDark ? 'bg-yellow-900/30' : 'bg-yellow-100'
                        : isDark ? 'bg-red-900/30' : 'bg-red-100')}>
                      {payment.status === PaymentStatus.APPROVED
                        ? <CheckCircle className="w-4 h-4 text-green-500" />
                        : payment.status === PaymentStatus.PENDING
                        ? <Clock className="w-4 h-4 text-yellow-500" />
                        : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="font-medium">{payment.payment_type_label}</p>
                      <p className={cn('text-xs font-mono', isDark ? 'text-gray-400' : 'text-gray-500')}>
                        {payment.transaction_reference || 'No ref'}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-2 font-medium">
                    {payment.amount.toLocaleString()} {payment.currency}
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <PaymentMethodIcon method={payment.method} className="w-4 h-4" />
                    {payment.method_label}
                  </div>
                  <div className="col-span-2">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="col-span-2">
                    <PaymentStatusBadge status={payment.status} theme={theme} size="sm" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedPayment(payment); }}
                      className={cn('p-2 rounded-lg transition-colors',
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200')}>
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={cn('px-6 py-4 border-t flex items-center justify-between',
              isDark ? 'border-gray-800' : 'border-gray-200')}>
              <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className={cn('px-3 py-1 rounded border',
                    isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40')}>
                  Previous
                </button>
                <span className={cn('px-3 py-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  {currentPage} / {totalPages}
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className={cn('px-3 py-1 rounded border',
                    isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-800 disabled:opacity-40' : 'border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40')}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {selectedPayment && (
          <PaymentDetailModal
            theme={theme}
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
          />
        )}
        {/* Coming Soon — Additional Payment Methods */}
        <div className={cn(
          'rounded-2xl border-2 border-dashed p-8 text-center',
          isDark ? 'border-gray-700 bg-gray-800/20' : 'border-gray-300 bg-gray-50/50'
        )}>
          <Smartphone className={cn('w-10 h-10 mx-auto mb-3', isDark ? 'text-gray-500' : 'text-gray-400')} />
          <h3 className={cn('font-bold text-sm mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>
            More payment methods coming soon
          </h3>
          <p className={cn('text-xs max-w-md mx-auto', isDark ? 'text-gray-500' : 'text-gray-500')}>
            We are integrating mobile money (MTN MoMo, Airtel Money), card payments via Flutterwave,
            and other regional payment gateways. You will be notified as soon as they become available.
          </p>
        </div>

        {showRecordModal && (
          <RecordPaymentModal
            theme={theme}
            onClose={() => !recordPayment.isPending && setShowRecordModal(false)}
            onSubmit={handleRecordPayment}
            isSubmitting={recordPayment.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payments
