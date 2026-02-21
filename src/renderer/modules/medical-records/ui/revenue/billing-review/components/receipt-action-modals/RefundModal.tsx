// RefundModal.tsx
import React, { useState, useMemo } from 'react';
import { X, Undo2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import type { BillingReviewItem, ChargeItem } from '../../../../../api/billing-review/BillingReviewTypes';
import { 
  RefundReason, 
  RefundMethodType,
  REFUND_REASON_LABELS,
  REFUND_METHOD_LABELS,
  validateRefundRequest,
  calculateTotalRefundAmount,
  type RefundTransactionRequest,
  type RefundMethod,
  type RefundLineItem,
} from '../../../../../api/refund/RefundTypes';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { 
  useRefundTransaction,
  extractErrorMessage,
  formatValidationErrors 
} from '../../../../../api/refund/RefundQueries';
import { ModalBackdrop, ModalContainer } from './ModalPrimitives';
import { cx } from '../../utils';

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

interface RefundModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  selectedTransaction: BillingReviewItem | null;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  open,
  selectedTransaction,
  theme,
  colors,
  onClose,
}) => {
  const isDark = theme === 'dark';
  
  // Form state
  const [reason, setReason] = useState<RefundReason>(RefundReason.BILLING_ERROR);
  const [reasonNotes, setReasonNotes] = useState('');
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const {showToast}=useToast();
  // Refund methods state
  const [refundMethods, setRefundMethods] = useState<RefundMethod[]>([
    { type: RefundMethodType.CASH, amount: 0 }
  ]);
  
  // Partial refund line items state
  const [selectedLineItems, setSelectedLineItems] = useState<Map<string, RefundLineItem>>(new Map());

  // Use refund transaction mutation
  const { mutate: refundTransaction, isPending: isProcessing } = useRefundTransaction({
    onSuccess: (data) => {
      const isPartial = data.data.refund_type === 'partial_refund';
      toast.success(
        isPartial
          ? `Partial refund processed. Reference: ${data.data.reference_number}`
          : `Full refund processed. Reference: ${data.data.reference_number}`,
        { duration: 5000 }
      );
      showToast('success',)
      handleClose();
    },
    onError: (error) => {
      const errorMessage = extractErrorMessage(error, 'Failed to process refund');
      const validationErrors = formatValidationErrors(error.response?.data?.errors);
      
      toast.error(
        validationErrors 
          ? `${errorMessage}: ${validationErrors}` 
          : errorMessage,
        { duration: 6000 }
      );
    },
  });

  // Calculate totals
  const totalPaid = selectedTransaction?.billing_data.totalPaid ?? 0;
  const totalRefundAmount = useMemo(
    () => calculateTotalRefundAmount(refundMethods),
    [refundMethods]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTransaction?.billing_cycle_id) {
      toast.error('No billing cycle selected');
      return;
    }

    // Build request data based on refund type
    const baseRequest = {
      reason,
      reason_notes: reason === RefundReason.OTHER ? reasonNotes : undefined,
      refund_methods: refundMethods,
      restore_inventory: restoreInventory,
    };

    const requestData: RefundTransactionRequest = refundType === 'partial'
      ? {
          ...baseRequest,
          line_items: Array.from(selectedLineItems.values()),
        }
      : baseRequest;

    // Client-side validation
    const validationError = validateRefundRequest(requestData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Validate refund amount doesn't exceed total paid
    if (totalRefundAmount > totalPaid) {
      toast.error(`Refund amount (${totalRefundAmount}) cannot exceed total paid (${totalPaid})`);
      return;
    }

    // Submit refund request
    refundTransaction({
      billingCycleId: selectedTransaction.billing_cycle_id,
      data: requestData,
    });
  };

  const handleClose = () => {
    if (!isProcessing) {
      setReason(RefundReason.BILLING_ERROR);
      setReasonNotes('');
      setRestoreInventory(true);
      setRefundType('full');
      setRefundMethods([{ type: RefundMethodType.CASH, amount: 0 }]);
      setSelectedLineItems(new Map());
      onClose();
    }
  };

  // Refund methods handlers
  const addRefundMethod = () => {
    setRefundMethods([...refundMethods, { type: RefundMethodType.CASH, amount: 0 }]);
  };

  const removeRefundMethod = (index: number) => {
    setRefundMethods(refundMethods.filter((_, i) => i !== index));
  };

  const updateRefundMethod = (index: number, updates: Partial<RefundMethod>) => {
    setRefundMethods(refundMethods.map((method, i) => 
      i === index ? { ...method, ...updates } : method
    ));
  };

  // Line item handlers
  const toggleLineItem = (chargeItem: ChargeItem) => {
    const newMap = new Map(selectedLineItems);
    const lineItemId = parseInt(chargeItem.id.replace('charge::', ''));
    
    if (newMap.has(chargeItem.id)) {
      newMap.delete(chargeItem.id);
    } else {
      newMap.set(chargeItem.id, {
        line_item_id: lineItemId,
        refund_amount: chargeItem.totalAmount,
      });
    }
    setSelectedLineItems(newMap);
  };

  const updateLineItemAmount = (chargeItemId: string, amount: number) => {
    const newMap = new Map(selectedLineItems);
    const existing = newMap.get(chargeItemId);
    if (existing) {
      newMap.set(chargeItemId, { ...existing, refund_amount: amount });
      setSelectedLineItems(newMap);
    }
  };

  const isOtherReason = reason === RefundReason.OTHER;
  const isSubmitDisabled = 
    isProcessing || 
    (isOtherReason && !reasonNotes.trim()) ||
    totalRefundAmount <= 0 ||
    (refundType === 'partial' && selectedLineItems.size === 0);

  return (
    <>
      <ModalBackdrop open={open} onClick={handleClose} />
      <ModalContainer open={open}>
        <div
          className={cx(
            'rounded-xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col',
            colors.border.primary,
            colors.bg.elevated,
            isProcessing && 'pointer-events-none opacity-75'
          )}
        >
          {/* Header */}
          <div className={cx('flex items-center justify-between p-5 border-b flex-shrink-0', colors.border.primary)}>
            <div className="flex items-center gap-3">
              <div className={cx('p-2 rounded-lg', isDark ? 'bg-amber-900/30' : 'bg-amber-100')}>
                <Undo2 className={cx('w-5 h-5', isDark ? 'text-amber-400' : 'text-amber-600')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-bold', colors.text.primary)}>Refund Transaction</h3>
                <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                  Full or partial item-based refunds
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className={cx(
                'p-2 rounded-lg transition cursor-pointer',
                colors.text.tertiary,
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
                isProcessing && 'cursor-not-allowed opacity-50'
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-4">
              <div className={cx('p-4 rounded-lg border', isDark ? 'bg-amber-900/10 border-amber-700' : 'bg-amber-50 border-amber-200')}>
                <div className="flex gap-3">
                  <AlertTriangle className={cx('w-5 h-5 flex-shrink-0 mt-0.5', isDark ? 'text-amber-400' : 'text-amber-600')} />
                  <div>
                    <p className={cx('text-sm font-semibold', colors.text.primary)}>
                      Refund Policy
                    </p>
                    <p className={cx('text-xs mt-1 leading-relaxed', colors.text.secondary)}>
                      Refunds are processed item-by-item. You can refund full or partial quantities.
                      All refunds require proper documentation.
                    </p>
                  </div>
                </div>
              </div>

              {selectedTransaction && (
                <div className={cx('p-3 rounded-lg text-xs space-y-2', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
                  <div className="flex justify-between">
                    <span className={colors.text.secondary}>Receipt:</span>
                    <span className={cx('font-semibold', colors.text.primary)}>
                      {selectedTransaction.receipt_number || 'Draft'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={colors.text.secondary}>Patient:</span>
                    <span className={colors.text.primary}>{selectedTransaction.patient_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={colors.text.secondary}>Total Paid:</span>
                    <span className={cx('font-semibold', colors.text.primary)}>
                      UGX {totalPaid.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Refund Type Selection */}
              <div>
                <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                  Refund Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRefundType('full')}
                    disabled={isProcessing}
                    className={cx(
                      'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition cursor-pointer',
                      refundType === 'full'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : cx(colors.border.primary, colors.text.secondary, 'hover:bg-gray-50 dark:hover:bg-gray-800'),
                      isProcessing && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    Full Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundType('partial')}
                    disabled={isProcessing}
                    className={cx(
                      'flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition cursor-pointer',
                      refundType === 'partial'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : cx(colors.border.primary, colors.text.secondary, 'hover:bg-gray-50 dark:hover:bg-gray-800'),
                      isProcessing && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    Partial Refund
                  </button>
                </div>
              </div>

              {/* Partial Refund Line Items */}
              {refundType === 'partial' && selectedTransaction && (
                <div>
                  <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                    Select Items to Refund <span className="text-red-500">*</span>
                  </label>
                  <div className={cx('border rounded-lg divide-y', colors.border.primary)}>
                    {selectedTransaction.charge_items.map((item) => {
                      const isSelected = selectedLineItems.has(item.id);
                      const refundAmount = selectedLineItems.get(item.id)?.refund_amount ?? item.totalAmount;
                      
                      return (
                        <div key={item.id} className={cx('p-3', isSelected && (isDark ? 'bg-amber-900/10' : 'bg-amber-50'))}>
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleLineItem(item)}
                              disabled={isProcessing}
                              className={cx(
                                'mt-1 w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer',
                                isProcessing && 'cursor-not-allowed opacity-50'
                              )}
                            />
                            <div className="flex-1">
                              <p className={cx('text-sm font-medium', colors.text.primary)}>
                                {item.service.name}
                              </p>
                              <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                                Qty: {item.quantity} × UGX {item.service.unitPrice.toLocaleString()} = UGX {item.totalAmount.toLocaleString()}
                              </p>
                              {isSelected && (
                                <div className="mt-2">
                                  <label className={cx('text-xs', colors.text.secondary)}>Refund Amount:</label>
                                  <input
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => updateLineItemAmount(item.id, parseFloat(e.target.value) || 0)}
                                    max={item.totalAmount}
                                    min={0}
                                    step="0.01"
                                    disabled={isProcessing}
                                    className={cx(
                                      'mt-1 w-full px-3 py-1.5 rounded-lg border text-sm',
                                      colors.border.primary,
                                      isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                                      isProcessing && 'cursor-not-allowed opacity-50'
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Refund Reason */}
              <div>
                <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                  Refund Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as RefundReason)}
                  disabled={isProcessing}
                  className={cx(
                    'w-full px-4 py-2.5 rounded-lg border text-sm cursor-pointer',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                    colors.ring,
                    isProcessing && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {Object.entries(REFUND_REASON_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Notes */}
              {isOtherReason && (
                <div>
                  <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                    Additional Notes <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reasonNotes}
                    onChange={(e) => setReasonNotes(e.target.value)}
                    placeholder="Please specify the reason for refund..."
                    rows={3}
                    required
                    disabled={isProcessing}
                    className={cx(
                      'w-full px-4 py-2.5 rounded-lg border text-sm resize-none cursor-text',
                      colors.border.primary,
                      isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                      colors.ring,
                      isProcessing && 'cursor-not-allowed opacity-50'
                    )}
                  />
                </div>
              )}

              {/* Refund Methods */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cx('text-sm font-semibold', colors.text.primary)}>
                    Refund Methods <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addRefundMethod}
                    disabled={isProcessing}
                    className={cx(
                      'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer',
                      'border border-amber-500 text-amber-600 hover:bg-amber-50',
                      'dark:text-amber-400 dark:hover:bg-amber-900/20',
                      isProcessing && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Plus className="w-3 h-3" />
                    Add Method
                  </button>
                </div>
                <div className="space-y-2">
                  {refundMethods.map((method, index) => (
                    <div key={index} className={cx('flex gap-2 p-3 rounded-lg border', colors.border.primary)}>
                      <select
                        value={method.type}
                        onChange={(e) => updateRefundMethod(index, { type: e.target.value as RefundMethodType })}
                        disabled={isProcessing}
                        className={cx(
                          'flex-1 px-3 py-2 rounded-lg border text-sm cursor-pointer',
                          colors.border.primary,
                          isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                          isProcessing && 'cursor-not-allowed opacity-50'
                        )}
                      >
                        {Object.entries(REFUND_METHOD_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={method.amount}
                        onChange={(e) => updateRefundMethod(index, { amount: parseFloat(e.target.value) || 0 })}
                        placeholder="Amount"
                        min="0"
                        step="0.01"
                        disabled={isProcessing}
                        className={cx(
                          'w-32 px-3 py-2 rounded-lg border text-sm',
                          colors.border.primary,
                          isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                          isProcessing && 'cursor-not-allowed opacity-50'
                        )}
                      />
                      <input
                        type="text"
                        value={method.reference || ''}
                        onChange={(e) => updateRefundMethod(index, { reference: e.target.value })}
                        placeholder="Reference (optional)"
                        disabled={isProcessing}
                        className={cx(
                          'flex-1 px-3 py-2 rounded-lg border text-sm',
                          colors.border.primary,
                          isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                          isProcessing && 'cursor-not-allowed opacity-50'
                        )}
                      />
                      {refundMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRefundMethod(index)}
                          disabled={isProcessing}
                          className={cx(
                            'p-2 rounded-lg transition cursor-pointer',
                            'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
                            isProcessing && 'cursor-not-allowed opacity-50'
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className={cx('flex justify-between items-center px-3 py-2 rounded-lg', isDark ? 'bg-gray-900' : 'bg-gray-50')}>
                    <span className={cx('text-sm font-medium', colors.text.primary)}>Total Refund:</span>
                    <span className={cx('text-lg font-bold', colors.text.primary)}>
                      UGX {totalRefundAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Restore Inventory */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="restore-inventory"
                  checked={restoreInventory}
                  onChange={(e) => setRestoreInventory(e.target.checked)}
                  disabled={isProcessing}
                  className={cx(
                    'mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer',
                    isProcessing && 'cursor-not-allowed opacity-50'
                  )}
                />
                <label 
                  htmlFor="restore-inventory" 
                  className={cx(
                    'text-sm cursor-pointer',
                    colors.text.secondary,
                    isProcessing && 'cursor-not-allowed opacity-50'
                  )}
                >
                  Restore inventory quantities for refunded items
                </label>
              </div>
            </div>
          </form>

          {/* Actions - Fixed at bottom */}
          <div className={cx('flex gap-3 p-5 border-t flex-shrink-0', colors.border.primary)}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className={cx(
                'flex-1 px-4 py-2.5 rounded-lg border text-sm font-bold transition cursor-pointer',
                colors.border.primary,
                isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50',
                isProcessing && 'cursor-not-allowed opacity-50'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className={cx(
                'flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition cursor-pointer',
                'bg-amber-600 hover:bg-amber-700 text-white',
                'flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <Undo2 className="w-4 h-4" />
              {isProcessing ? 'Processing...' : 'Process Refund'}
            </button>
          </div>
        </div>
      </ModalContainer>
    </>
  );
};