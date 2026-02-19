// components/ReceiptView.tsx
// Right panel - displays receipt details using BillingReviewTypes

import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Mail,
  Printer,
  Receipt,
  Undo2,
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { 
  PaymentStatus, 
  PAYMENT_STATUS_LABELS,
  formatCurrency,
  getOutstandingBalance
} from  '../../../../api/billing-review/BillingReviewTypes';

interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    elevated: string;
    hover: string;
    selected: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  border: {
    primary: string;
  };
  ring: string;
}

interface ReceiptViewProps {
  selectedTransaction: any | null; // Using any for brevity, would use BillingReviewItem
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onPrint: () => void;
  onEmail: () => void;
  onRefund: () => void;
  onVoid: () => void;
}

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'warn' | 'danger';
  colors: ThemeColors;
  isDark: boolean;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

const getStatusPillClass = (isDark: boolean, status: PaymentStatus) => {
  const variants = {
    [PaymentStatus.PAID_IN_FULL]: isDark ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800',
    [PaymentStatus.PARTIALLY_PAID]: isDark ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800',
    [PaymentStatus.PENDING]: isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800',
    [PaymentStatus.NOT_BILLED]: isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800',
    [PaymentStatus.INSURANCE_PENDING]: isDark ? 'bg-purple-900 text-purple-100' : 'bg-purple-100 text-purple-800',
    [PaymentStatus.DENIED]: isDark ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800',
    [PaymentStatus.BAD_DEBT]: isDark ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800',
    [PaymentStatus.CHARITY_CARE]: isDark ? 'bg-indigo-900 text-indigo-100' : 'bg-indigo-100 text-indigo-800',
  };
  return variants[status] || (isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800');
};

const paymentIcon = (type: string) => {
  const icons: Record<string, string> = {
    cash: '💵',
    card: '💳',
    insurance: '🏥',
    mobile: '📱',
    bank_transfer: '🏦',
    cheque: '📝',
  };
  return <span className="text-sm">{icons[type] || '💰'}</span>;
};

const formatDisplayDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const watermarkForStatus = (status: PaymentStatus, balanceDue: number) => {
  if (status === PaymentStatus.PAID_IN_FULL) {
    return { text: 'PAID', color: 'text-green-600' };
  }
  if (balanceDue > 0) {
    return { text: 'DUE', color: 'text-amber-600' };
  }
  if (status === PaymentStatus.VOIDED) {
    return { text: 'VOID', color: 'text-red-600' };
  }
  return { text: 'RECEIPT', color: 'text-gray-400' };
};

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  icon,
  label,
  variant = 'primary',
  colors,
  isDark,
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

export const ReceiptView: React.FC<ReceiptViewProps> = ({
  selectedTransaction,
  theme,
  colors,
  onPrint,
  onEmail,
  onRefund,
  onVoid,
}) => {
  const isDark = theme === 'dark';
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: selectedTransaction?.receipt_number || 'receipt',
    onBeforePrint: () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
    removeAfterPrint: false,
  });

  const onPrintClick = () => {
    if (!selectedTransaction || !receiptRef.current) return;
    handlePrint?.();
    onPrint();
  };

  // Derived financials from the backend types
  const getDerivedFinancials = () => {
    if (!selectedTransaction) return null;
    
    const billingData = selectedTransaction.billing_data;
    const refunded = 0; // Would come from refunds array in real implementation
    const netPaid = billingData.totalPaid - refunded;
    const balanceDue = getOutstandingBalance(selectedTransaction);
    
    return {
      status: selectedTransaction.payment_status,
      refunded,
      netPaid,
      balanceDue,
    };
  };

  const derivedFinancials = getDerivedFinancials();

  return (
    <div
      className={cx(
        'flex flex-col h-full min-h-0 border rounded-lg shadow-sm overflow-hidden w-full',
        colors.border.primary,
        colors.bg.elevated
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
              {selectedTransaction
                ? 'Preview, print, email, refund (item-based), void'
                : 'Select a transaction to view receipt'}
            </p>
          </div>

          {selectedTransaction && derivedFinancials && (
            <span
              className={cx(
                'px-2 py-1 rounded-full text-xs font-extrabold flex-shrink-0',
                getStatusPillClass(isDark, derivedFinancials.status)
              )}
            >
              {PAYMENT_STATUS_LABELS[derivedFinancials.status]}
            </span>
          )}
        </div>

        {/* Actions - Non-functional as requested */}
        <div className="mt-3 flex flex-wrap gap-2 no-print">
          <ActionButton
            onClick={onPrintClick}
            disabled={!selectedTransaction || isPrinting}
            icon={<Printer className="w-4 h-4" />}
            label={isPrinting ? 'Printing…' : 'Print'}
            variant="primary"
            colors={colors}
            isDark={isDark}
          />

          <ActionButton
            onClick={onEmail}
            disabled={!selectedTransaction}
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            variant="secondary"
            colors={colors}
            isDark={isDark}
          />

          <ActionButton
            onClick={onRefund}
            disabled={!selectedTransaction}
            icon={<Undo2 className="w-4 h-4" />}
            label="Refund"
            variant="warn"
            colors={colors}
            isDark={isDark}
          />

          <ActionButton
            onClick={onVoid}
            disabled={!selectedTransaction}
            icon={<Ban className="w-4 h-4" />}
            label="Void"
            variant="danger"
            colors={colors}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Receipt Body */}
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
            {/* Printable Receipt */}
            <div ref={receiptRef} className="receipt-print">
              <div className="border border-gray-300 bg-white text-black p-5 rounded-lg shadow-lg relative overflow-hidden">
                {/* Watermark */}
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

                {/* Receipt Meta */}
                <div className="border-t border-b border-gray-300 py-2 my-3 text-xs space-y-1 relative">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt:</span>
                    <span className="font-extrabold">{selectedTransaction.receipt_number || 'Draft'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visit ID:</span>
                    <span className="font-semibold">{selectedTransaction.visit_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient:</span>
                    <span className="font-semibold">{selectedTransaction.patient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient #:</span>
                    <span>{selectedTransaction.patient_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{formatDisplayDate(selectedTransaction.created_at)}</span>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-3 relative">
                  <h3 className="text-sm font-extrabold mb-2">Services rendered</h3>
                  <div className="space-y-2">
                    {selectedTransaction.charge_items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-xs border-b border-gray-100 pb-1.5"
                      >
                        <div className="min-w-0 pr-2 flex-1">
                          <p className="font-semibold truncate">{item.service.name}</p>
                          <p className="text-[11px] text-gray-600">
                            {item.quantity} × {formatCurrency(item.service.unitPrice)} • {item.service.code}
                          </p>
                        </div>
                        <span className="font-extrabold flex-shrink-0">
                          {formatCurrency(item.totalAmount)}
                        </span>
                      </div>
                    ))}
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

                  {selectedTransaction.taxes.map((tax: any, index: number) => (
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
                    {selectedTransaction.payment_methods.map((pm: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {paymentIcon(pm.type)}
                          <span className="capitalize font-semibold">{pm.type.replace('_', ' ')}</span>
                          {pm.reference && (
                            <span className="text-[10px] text-gray-500 truncate">Ref: {pm.reference}</span>
                          )}
                        </div>
                        <span className="font-extrabold">{formatCurrency(pm.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-4 pt-3 border-t border-gray-300 relative">
                  <p className="text-[11px] text-gray-600">Computer generated receipt</p>
                  <p className="text-[11px] text-gray-600">Valid without signature</p>
                </div>
              </div>
            </div>

            {/* Hint */}
            <div
              className={cx(
                'mt-3 p-3 rounded-lg border no-print',
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-start gap-2">
                <CheckCircle2
                  className={cx(
                    'w-4 h-4 mt-0.5 flex-shrink-0',
                    isDark ? 'text-green-400' : 'text-green-600'
                  )}
                />
                <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
                  Using BillingReviewTypes.ts as the single source of truth. Actions are placeholders.
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
              ? `Viewing ${selectedTransaction.receipt_number || 'Draft'} • ${selectedTransaction.patient_name}`
              : 'Select a transaction to view its receipt details'}
          </p>
        </div>
      </div>
    </div>
  );
};