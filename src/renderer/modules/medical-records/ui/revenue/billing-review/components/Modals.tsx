// components/Modals.tsx
// All modal dialogs: Refund, Email, Void with Toast notification

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import {
  DerivedFinancials,
  EmailFormState,
  MockTransaction,
  PaymentType,
  RefundFormState,
  ThemeColors,
  ToastState,
  VoidFormState,
} from '../types';
import { cx, formatCurrency } from '../utils';

// ==================== TOAST COMPONENT ====================

interface ToastProps {
  toast: ToastState;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast.show) return;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [toast.show, onClose]);

  if (!toast.show) return null;

  const styles =
    toast.type === 'success'
      ? 'bg-green-50 border-green-200 text-green-900'
      : toast.type === 'error'
      ? 'bg-red-50 border-red-200 text-red-900'
      : 'bg-blue-50 border-blue-200 text-blue-900';

  return (
    <div className="fixed top-4 right-4 z-[60] w-[min(92vw,420px)]">
      <div className={cx('border rounded-xl shadow-lg px-4 py-3', styles)}>
        <div className="flex items-start gap-2">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold leading-snug">{toast.message}</p>
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
};

// ==================== MODAL WRAPPER ====================

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  theme: 'light' | 'dark';
}

export const Modal: React.FC<ModalProps> = ({ open, title, subtitle, onClose, children, theme }) => {
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
};

// ==================== REFUND MODAL ====================

interface RefundModalProps {
  open: boolean;
  selectedTransaction: MockTransaction | null;
  derivedFinancials: DerivedFinancials | null;
  refundForm: RefundFormState;
  refundComputed: { items: any[]; total: number };
  selectedRefundedQtyMap: Map<number, number>;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onClose: () => void;
  onUpdateField: <K extends keyof RefundFormState>(key: K, value: RefundFormState[K]) => void;
  onSetQtySafe: (chargeItemId: number, qty: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSubmit: () => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  open,
  selectedTransaction,
  derivedFinancials,
  refundForm,
  refundComputed,
  selectedRefundedQtyMap,
  theme,
  colors,
  onClose,
  onUpdateField,
  onSetQtySafe,
  onSelectAll,
  onClearSelection,
  onSubmit,
}) => {
  const isDark = theme === 'dark';

  return (
    <Modal
      open={open}
      title="Process Refund (Item & Quantity Based)"
      subtitle="Select items and quantities to refund. Refund total is calculated automatically."
      onClose={onClose}
      theme={theme}
    >
      {!selectedTransaction || !derivedFinancials ? (
        <p className={cx('text-sm', colors.text.secondary)}>No transaction selected.</p>
      ) : (
        <div className="space-y-4">
          {/* Info */}
          <div
            className={cx(
              'p-3 rounded-lg border',
              isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'
            )}
          >
            <p className={cx('text-xs', colors.text.secondary)}>
              Refundable max (Net Paid):{' '}
              <span className={cx('font-extrabold', colors.text.primary)}>
                {formatCurrency(derivedFinancials.refundableMax)}
              </span>
            </p>
            <p className={cx('text-xs mt-1', colors.text.secondary)}>
              Receipt:{' '}
              <span className={cx('font-extrabold', colors.text.primary)}>
                {selectedTransaction.receipt_number}
              </span>
            </p>
          </div>

          {/* Item Selection Header */}
          <div className="flex items-center justify-between gap-2">
            <h4 className={cx('text-sm font-extrabold', colors.text.primary)}>Refund items</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={onSelectAll}
                className={cx(
                  'cursor-pointer text-xs font-extrabold px-3 py-2 rounded-lg border transition',
                  colors.border.primary,
                  isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50'
                )}
              >
                Select all refundable
              </button>
              <button
                onClick={onClearSelection}
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

          {/* Item List */}
          <div className={cx('border rounded-lg overflow-hidden', colors.border.primary)}>
            <div
              className={cx(
                'px-3 py-2 text-xs font-extrabold',
                isDark ? 'bg-gray-800 text-gray-100' : 'bg-gray-50 text-gray-900'
              )}
            >
              Set refund quantity per item (max refundable enforced)
            </div>

            <div className={cx('divide-y', colors.border.primary)}>
              {selectedTransaction.charge_items.map((ci) => {
                const alreadyRefundedQty = selectedRefundedQtyMap.get(ci.id) ?? 0;
                const refundableQty = Math.max(0, ci.quantity - alreadyRefundedQty);
                const current = refundForm.qtyByItem[ci.id] ?? 0;

                return (
                  <div
                    key={ci.id}
                    className={cx(
                      'p-3',
                      refundableQty === 0 && (isDark ? 'bg-gray-900/40' : 'bg-gray-50')
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={cx('text-sm font-extrabold truncate', colors.text.primary)}>
                          {ci.service.name}{' '}
                          <span className={cx('text-xs font-mono', colors.text.tertiary)}>
                            ({ci.service.code})
                          </span>
                        </p>
                        <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                          Unit: {formatCurrency(ci.service.unitPrice)} • Original qty: {ci.quantity} •
                          Already refunded: {alreadyRefundedQty} • Refundable: {refundableQty}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={refundableQty}
                          value={refundableQty === 0 ? 0 : current}
                          disabled={refundableQty === 0}
                          onChange={(e) => onSetQtySafe(ci.id, Number(e.target.value))}
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

          {/* Refund Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Method</span>
              <select
                value={refundForm.method}
                onChange={(e) => onUpdateField('method', e.target.value as PaymentType)}
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
                Reference{' '}
                {refundForm.method === 'card' || refundForm.method === 'mobile'
                  ? '(required)'
                  : '(optional)'}
              </span>
              <input
                value={refundForm.reference}
                onChange={(e) => onUpdateField('reference', e.target.value)}
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
              <span className={cx('text-xs font-extrabold', colors.text.secondary)}>
                Reason (required)
              </span>
              <textarea
                value={refundForm.reason}
                onChange={(e) => onUpdateField('reason', e.target.value)}
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
                value={refundForm.processedBy}
                onChange={(e) => onUpdateField('processedBy', e.target.value)}
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
          <div
            className={cx(
              'p-3 rounded-lg border',
              isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cx('text-xs font-extrabold', colors.text.secondary)}>
                Refund total (auto)
              </span>
              <span
                className={cx(
                  'text-sm font-extrabold',
                  refundComputed.total > derivedFinancials.refundableMax
                    ? 'text-red-600'
                    : colors.text.primary
                )}
              >
                {formatCurrency(refundComputed.total)}
              </span>
            </div>
            {refundComputed.total > derivedFinancials.refundableMax && (
              <p className="text-xs text-red-600 mt-1">
                Refund exceeds Net Paid. Reduce quantities to proceed.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className={cx(
                'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg border transition',
                isDark
                  ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-900 hover:bg-gray-50'
              )}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className={cx(
                'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg bg-amber-600 hover:bg-amber-700 text-white',
                (refundComputed.total <= 0 || refundComputed.total > derivedFinancials.refundableMax) &&
                  'opacity-50 cursor-not-allowed'
              )}
              disabled={
                refundComputed.total <= 0 || refundComputed.total > derivedFinancials.refundableMax
              }
            >
              Process Refund
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ==================== EMAIL MODAL ====================

interface EmailModalProps {
  open: boolean;
  selectedTransaction: MockTransaction | null;
  emailForm: EmailFormState;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onClose: () => void;
  onUpdateField: <K extends keyof EmailFormState>(key: K, value: EmailFormState[K]) => void;
  onSubmit: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  open,
  selectedTransaction,
  emailForm,
  theme,
  colors,
  onClose,
  onUpdateField,
  onSubmit,
}) => {
  const isDark = theme === 'dark';

  return (
    <Modal
      open={open}
      title="Email Receipt"
      subtitle="This is a mock send flow. Replace with your backend email service."
      onClose={onClose}
      theme={theme}
    >
      {!selectedTransaction ? (
        <p className={cx('text-sm', colors.text.secondary)}>No transaction selected.</p>
      ) : (
        <div className="space-y-4">
          <div
            className={cx(
              'p-3 rounded-lg border',
              isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'
            )}
          >
            <p className={cx('text-xs', colors.text.secondary)}>
              Receipt:{' '}
              <span className={cx('font-extrabold', colors.text.primary)}>
                {selectedTransaction.receipt_number}
              </span>
            </p>
            <p className={cx('text-xs mt-1', colors.text.secondary)}>
              Patient:{' '}
              <span className={cx('font-extrabold', colors.text.primary)}>
                {selectedTransaction.patient.name}
              </span>
            </p>
          </div>

          <label className="block">
            <span className={cx('text-xs font-extrabold', colors.text.secondary)}>To</span>
            <input
              value={emailForm.to}
              onChange={(e) => onUpdateField('to', e.target.value)}
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
              value={emailForm.subject}
              onChange={(e) => onUpdateField('subject', e.target.value)}
              className={cx(
                'mt-1 w-full px-3 py-2 rounded-lg border text-sm focus:outline-none',
                colors.border.primary,
                isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                colors.ring
              )}
            />
          </label>

          <label className="block">
            <span className={cx('text-xs font-extrabold', colors.text.secondary)}>
              Message (optional)
            </span>
            <textarea
              value={emailForm.note}
              onChange={(e) => onUpdateField('note', e.target.value)}
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
              onClick={onClose}
              className={cx(
                'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg border transition',
                isDark
                  ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-900 hover:bg-gray-50'
              )}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={emailForm.sending}
              className={cx(
                'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg bg-blue-600 hover:bg-blue-700 text-white',
                emailForm.sending && 'opacity-50 cursor-not-allowed'
              )}
            >
              {emailForm.sending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ==================== VOID MODAL ====================

interface VoidModalProps {
  open: boolean;
  selectedTransaction: MockTransaction | null;
  voidForm: VoidFormState;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  onClose: () => void;
  onUpdateField: <K extends keyof VoidFormState>(key: K, value: VoidFormState[K]) => void;
  onSubmit: () => void;
}

export const VoidModal: React.FC<VoidModalProps> = ({
  open,
  selectedTransaction,
  voidForm,
  theme,
  colors,
  onClose,
  onUpdateField,
  onSubmit,
}) => {
  const isDark = theme === 'dark';

  return (
    <Modal
      open={open}
      title="Void Transaction"
      subtitle="Voiding marks the receipt invalid and prevents further refunds."
      onClose={onClose}
      theme={theme}
    >
      {!selectedTransaction ? (
        <p className={cx('text-sm', colors.text.secondary)}>No transaction selected.</p>
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-red-800 text-xs">
            <p className="font-extrabold">Warning</p>
            <p className="mt-1">This will label the receipt as VOIDED and block refunds.</p>
          </div>

          <label className="block">
            <span className={cx('text-xs font-extrabold', colors.text.secondary)}>Reason (required)</span>
            <textarea
              value={voidForm.reason}
              onChange={(e) => onUpdateField('reason', e.target.value)}
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
              value={voidForm.voidedBy}
              onChange={(e) => onUpdateField('voidedBy', e.target.value)}
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
              onClick={onClose}
              className={cx(
                'cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg border transition',
                isDark
                  ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
                  : 'border-gray-300 text-gray-900 hover:bg-gray-50'
              )}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="cursor-pointer px-3 py-2 text-xs font-extrabold rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              Void Transaction
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};