// components/ReceiptView.tsx
// Right panel - displays receipt details with print functionality

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
import { DerivedFinancials, MockTransaction, ThemeColors } from '../types';
import {
  cx,
  formatCurrency,
  formatDisplayDate,
  paymentIcon,
  statusLabel,
  statusPillClass,
  watermarkForStatus,
} from '../utils';

interface ReceiptViewProps {
  selectedTransaction: MockTransaction | null;
  derivedFinancials: DerivedFinancials | null;
  refundedQtyMap: Map<number, number>;
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
  derivedFinancials,
  refundedQtyMap,
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
    documentTitle: selectedTransaction ? selectedTransaction.receipt_number : 'receipt',
    onBeforePrint: () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
    removeAfterPrint: false,
  });

  const onPrintClick = () => {
    if (!selectedTransaction || !receiptRef.current) return;
    handlePrint?.();
    onPrint();
  };

  return (
    <div
      className={cx(
        'flex flex-col h-full min-h-0 border rounded-lg shadow-sm overflow-hidden',
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
            disabled={!selectedTransaction || (selectedTransaction?.voided ?? false)}
            icon={<Undo2 className="w-4 h-4" />}
            label="Refund"
            variant="warn"
            colors={colors}
            isDark={isDark}
          />

          <ActionButton
            onClick={onVoid}
            disabled={!selectedTransaction || (selectedTransaction?.voided ?? false)}
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

                {/* VOID Banner */}
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
                    {selectedTransaction.charge_items.map((item) => {
                      const refundedQty = refundedQtyMap.get(item.id) ?? 0;
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
                    {selectedTransaction.payment_methods.map((pm) => (
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
                      {selectedTransaction.refunds!.map((r) => (
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
                  Printing is scoped to the receipt card only. Refunds are recorded as item quantities
                  and displayed on the receipt.
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
  );
};