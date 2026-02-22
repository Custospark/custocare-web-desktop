// RefundModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Undo2, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import type { 
  RefundReason, 
  RefundMethodType,
  RefundableLineItem 
} from '../../../../../api/refund/RefundTypes';
import { 
  REFUND_REASON_LABELS, 
  REFUND_METHOD_LABELS,
  isRefundable 
} from '../../../../../api/refund/RefundTypes';
import { useRefundTransaction } from '../../../../../api/refund/RefundQueries';
import { ModalBackdrop, ModalContainer } from './ModalPrimitives';
import { cx } from '../../utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
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
  onSuccess?: () => void;
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
  onSuccess,
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [reason, setReason] = useState<RefundReason | ''>('');
  const [reasonNotes, setReasonNotes] = useState('');
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [eligibilityWarning, setEligibilityWarning] = useState<string | null>(null);
  
  // Refund methods state
  const [refundMethods, setRefundMethods] = useState<Array<{
    type: RefundMethodType | '';
    amount: number;
    reference: string;
  }>>([{ type: '', amount: 0, reference: '' }]);

  // Line items for partial refund
  const [lineItems, setLineItems] = useState<RefundableLineItem[]>([]);

  // Check eligibility when transaction loads
  useEffect(() => {
    if (selectedTransaction) {
      const eligibility = isRefundable({
        billing_status: selectedTransaction.billing_status,
        patient_payment_received: selectedTransaction.billing_data.totalPaid,
        insurance_payment_received: 0, // This might need adjustment based on your data structure
      });
      
      if (!eligibility.eligible) {
        setEligibilityWarning(eligibility.message || null);
      } else {
        setEligibilityWarning(null);
      }
    }
  }, [selectedTransaction, showToast]);

  // Initialize line items when transaction changes and partial refund is selected
  useEffect(() => {
    if (selectedTransaction && refundType === 'partial') {
      // Transform charge items into refundable line items
      const items: RefundableLineItem[] = selectedTransaction.charge_items.map((item, index) => ({
        id: parseInt(item.id.replace('charge::', '')) || index, // Parse ID from format "charge::uuid"
        line_item_uuid: item.id.replace('charge::', ''),
        service_code: item.service.code,
        service_name: item.service.name,
        quantity: item.quantity,
        unit_price: item.service.unitPrice,
        line_total: item.totalAmount,
        net_amount: item.totalAmount,
        max_refundable_amount: item.totalAmount,
        is_selected: false,
        refund_amount: item.totalAmount,
        original_quantity: item.quantity,
      }));
      setLineItems(items);
    }
  }, [selectedTransaction, refundType]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setRefundType('full');
      setReason('');
      setReasonNotes('');
      setRestoreInventory(true);
      setRefundMethods([{ type: '', amount: 0, reference: '' }]);
      setValidationError(null);
      setEligibilityWarning(null);
    }
  }, [open]);

  const billingCycleId = selectedTransaction?.billing_cycle_id;

  const { mutate: refundTransaction, isPending: isProcessing } = useRefundTransaction(
    billingCycleId || 0,
    {
      onSuccess: (response) => {
        if (response.success) {
          showToast('success', 'Refund processed successfully', 3000);
          onClose();
          onSuccess?.(); // Trigger refresh in parent
        } else {
          const errorMsg = response.message || 'Failed to process refund';
          setValidationError(errorMsg);
          showToast('error', errorMsg, 5000);
        }
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred while processing refund';
        setValidationError(errorMessage);
        showToast('error', errorMessage, 5000);
      },
    }
  );

  const calculateTotalRefund = (): number => {
    if (refundType === 'full') {
      return selectedTransaction?.billing_data.totalPaid || 0;
    }
    return lineItems
      .filter(item => item.is_selected)
      .reduce((sum, item) => sum + (item.refund_amount || 0), 0);
  };

  const validateRefundMethods = (): boolean => {
    const totalRefund = calculateTotalRefund();
    const methodsTotal = refundMethods.reduce((sum, m) => sum + (m.amount || 0), 0);
    
    if (methodsTotal <= 0) {
      setValidationError('Total refund amount must be greater than 0');
      return false;
    }
    
    if (Math.abs(methodsTotal - totalRefund) > 0.01) {
      setValidationError(`Refund method total (${methodsTotal.toLocaleString()}) must equal refund amount (${totalRefund.toLocaleString()})`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!billingCycleId) {
      const errorMsg = 'No transaction selected';
      setValidationError(errorMsg);
      showToast('error', errorMsg, 3000);
      return;
    }

    if (!reason) {
      const errorMsg = 'Please select a refund reason';
      setValidationError(errorMsg);
      showToast('error', errorMsg, 3000);
      return;
    }

    if (reason === 'other' && !reasonNotes.trim()) {
      const errorMsg = 'Please provide notes for "Other" reason';
      setValidationError(errorMsg);
      showToast('error', errorMsg, 3000);
      return;
    }

    // Validate at least one refund method with amount > 0
    const hasValidMethod = refundMethods.some(m => m.type && m.amount > 0);
    if (!hasValidMethod) {
      const errorMsg = 'Please add at least one refund method with amount > 0';
      setValidationError(errorMsg);
      showToast('error', errorMsg, 3000);
      return;
    }

    // Validate refund methods total matches calculated total
    if (!validateRefundMethods()) {
      return;
    }

    // Prepare refund methods for API
    const methods = refundMethods
      .filter(m => m.type && m.amount > 0)
      .map(m => ({
        type: m.type as RefundMethodType,
        amount: m.amount,
        reference: m.reference || null,
      }));

    if (refundType === 'full') {
      refundTransaction({
        reason: reason as RefundReason,
        reason_notes: reason === 'other' ? reasonNotes : undefined,
        refund_methods: methods,
        restore_inventory: restoreInventory,
      });
    } else {
      // Partial refund
      const selectedLineItems = lineItems
        .filter(item => item.is_selected && item.refund_amount > 0)
        .map(item => ({
          line_item_id: item.id,
          refund_amount: item.refund_amount,
        }));

      if (selectedLineItems.length === 0) {
        const errorMsg = 'Please select at least one line item to refund';
        setValidationError(errorMsg);
        showToast('error', errorMsg, 3000);
        return;
      }

      refundTransaction({
        reason: reason as RefundReason,
        reason_notes: reason === 'other' ? reasonNotes : undefined,
        line_items: selectedLineItems,
        refund_methods: methods,
        restore_inventory: restoreInventory,
      });
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const addRefundMethod = () => {
    setRefundMethods([...refundMethods, { type: '', amount: 0, reference: '' }]);
    showToast('info', 'New refund method added', 2000);
  };

  const removeRefundMethod = (index: number) => {
    if (refundMethods.length > 1) {
      setRefundMethods(refundMethods.filter((_, i) => i !== index));
      showToast('info', 'Refund method removed', 2000);
    }
  };

  const updateRefundMethod = (index: number, field: keyof typeof refundMethods[0], value: any) => {
    const updated = [...refundMethods];
    updated[index] = { ...updated[index], [field]: value };
    setRefundMethods(updated);
  };

  const toggleLineItem = (index: number) => {
    const updated = [...lineItems];
    updated[index].is_selected = !updated[index].is_selected;
    if (!updated[index].is_selected) {
      updated[index].refund_amount = 0;
    } else {
      updated[index].refund_amount = updated[index].max_refundable_amount;
    }
    setLineItems(updated);
  };

  const updateLineItemRefund = (index: number, amount: number) => {
    const updated = [...lineItems];
    const maxAmount = updated[index].max_refundable_amount;
    updated[index].refund_amount = Math.min(Math.max(0, amount), maxAmount);
    setLineItems(updated);
  };

  if (!selectedTransaction) return null;

  const requiresNotes = reason === 'other';
  const totalRefund = calculateTotalRefund();

  return (
    <>
      <ModalBackdrop open={open} onClick={handleClose} />
      <ModalContainer open={open}>
        <div
          className={cx(
            'rounded-xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto',
            colors.border.primary,
            colors.bg.elevated,
            isProcessing && 'pointer-events-none opacity-75'
          )}
        >
          {/* Header */}
          <div className={cx('flex items-center justify-between p-5 border-b sticky top-0', colors.border.primary, colors.bg.elevated)}>
            <div className="flex items-center gap-3">
              <div className={cx('p-2 rounded-lg', isDark ? 'bg-amber-900/30' : 'bg-amber-100')}>
                <Undo2 className={cx('w-5 h-5', isDark ? 'text-amber-400' : 'text-amber-600')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-bold', colors.text.primary)}>Refund Transaction</h3>
                <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                  Item-based and quantity-based refunds
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

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Eligibility Warning */}
            {eligibilityWarning && (
              <div className={cx(
                'p-4 rounded-lg border',
                isDark ? 'bg-red-900/10 border-red-700' : 'bg-red-50 border-red-200'
              )}>
                <div className="flex gap-3">
                  <AlertTriangle className={cx('w-5 h-5 flex-shrink-0', isDark ? 'text-red-400' : 'text-red-600')} />
                  <p className={cx('text-sm', colors.text.secondary)}>{eligibilityWarning}</p>
                </div>
              </div>
            )}

            {/* Refund Policy Info */}
            <div className={cx('p-4 rounded-lg border', isDark ? 'bg-amber-900/10 border-amber-700' : 'bg-amber-50 border-amber-200')}>
              <div className="flex gap-3">
                <AlertTriangle className={cx('w-5 h-5 flex-shrink-0 mt-0.5', isDark ? 'text-amber-400' : 'text-amber-600')} />
                <div>
                  <p className={cx('text-sm font-semibold', colors.text.primary)}>
                    Refund Policy
                  </p>
                  <p className={cx('text-xs mt-1 leading-relaxed', colors.text.secondary)}>
                    Refunds are processed item-by-item. You can refund full or partial quantities.
                    All refunds require approval and documentation.
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Summary */}
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
                    UGX {selectedTransaction.billing_data.totalPaid.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Refund Type Toggle */}
            <div>
              <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                Refund Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    value="full"
                    checked={refundType === 'full'}
                    onChange={() => setRefundType('full')}
                    disabled={isProcessing}
                    className="cursor-pointer"
                  />
                  <span className={cx('text-sm', colors.text.secondary)}>Full Refund</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="refundType"
                    value="partial"
                    checked={refundType === 'partial'}
                    onChange={() => setRefundType('partial')}
                    disabled={isProcessing}
                    className="cursor-pointer"
                  />
                  <span className={cx('text-sm', colors.text.secondary)}>Partial Refund</span>
                </label>
              </div>
            </div>

            {/* Refund Reason Dropdown */}
            <div>
              <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                Refund Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value as RefundReason);
                  setValidationError(null);
                }}
                required
                disabled={isProcessing}
                className={cx(
                  'w-full px-4 py-2.5 rounded-lg border text-sm cursor-pointer',
                  colors.border.primary,
                  isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                  colors.ring,
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              >
                <option value="">Select a reason</option>
                {Object.entries(REFUND_REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Notes (only for "other") */}
            {requiresNotes && (
              <div>
                <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                  Additional Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reasonNotes}
                  onChange={(e) => {
                    setReasonNotes(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="Please provide details..."
                  rows={2}
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

            {/* Line Items - Only for partial refund */}
            {refundType === 'partial' && lineItems.length > 0 && (
              <div>
                <label className={cx('block text-sm font-semibold mb-2', colors.text.primary)}>
                  Select Items to Refund
                </label>
                <div className={cx(
                  'border rounded-lg overflow-hidden',
                  colors.border.primary
                )}>
                  {/* Header */}
                  <div className={cx(
                    'grid grid-cols-12 gap-2 p-3 text-xs font-semibold border-b',
                    colors.border.primary,
                    isDark ? 'bg-gray-800' : 'bg-gray-50'
                  )}>
                    <div className="col-span-5">Item</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-3 text-right">Refund</div>
                  </div>

                  {/* Items */}
                  {lineItems.map((item, index) => (
                    <div key={item.id} className={cx(
                      'grid grid-cols-12 gap-2 p-3 text-xs border-b last:border-b-0',
                      colors.border.primary,
                      item.is_selected && (isDark ? 'bg-amber-900/20' : 'bg-amber-50')
                    )}>
                      <div className="col-span-5 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.is_selected}
                          onChange={() => toggleLineItem(index)}
                          disabled={isProcessing}
                          className="cursor-pointer"
                        />
                        <div>
                          <div className={cx('font-medium', colors.text.primary)}>
                            {item.service_name}
                          </div>
                          <div className={cx('text-xs', colors.text.tertiary)}>
                            {item.service_code}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 text-right self-center">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right self-center">
                        UGX {item.net_amount.toLocaleString()}
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={item.refund_amount}
                          onChange={(e) => updateLineItemRefund(index, parseFloat(e.target.value) || 0)}
                          disabled={!item.is_selected || isProcessing}
                          min={0}
                          max={item.max_refundable_amount}
                          step={100}
                          className={cx(
                            'w-full px-2 py-1 rounded border text-right text-sm',
                            colors.border.primary,
                            isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                            !item.is_selected && 'opacity-50'
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refund Methods */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={cx('text-sm font-semibold', colors.text.primary)}>
                  Refund Methods <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addRefundMethod}
                  disabled={isProcessing}
                  className={cx(
                    'flex items-center gap-1 px-2 py-1 text-xs rounded transition',
                    isDark ? 'hover:bg-gray-700 text-amber-400' : 'hover:bg-gray-100 text-amber-600',
                    isProcessing && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Plus className="w-3 h-3" />
                  Add Method
                </button>
              </div>
              
              <div className="space-y-3">
                {refundMethods.map((method, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <select
                      value={method.type}
                      onChange={(e) => updateRefundMethod(index, 'type', e.target.value)}
                      required
                      disabled={isProcessing}
                      className={cx(
                        'flex-1 px-3 py-2 rounded-lg border text-sm cursor-pointer',
                        colors.border.primary,
                        isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                      )}
                    >
                      <option value="">Select method</option>
                      {Object.entries(REFUND_METHOD_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    
                    <div className="w-32">
                      <input
                        type="number"
                        value={method.amount}
                        onChange={(e) => updateRefundMethod(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="Amount"
                        required
                        min={0}
                        step={100}
                        disabled={isProcessing}
                        className={cx(
                          'w-full px-3 py-2 rounded-lg border text-sm',
                          colors.border.primary,
                          isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                        )}
                      />
                    </div>
                    
                    <input
                      type="text"
                      value={method.reference}
                      onChange={(e) => updateRefundMethod(index, 'reference', e.target.value)}
                      placeholder="Ref (opt)"
                      disabled={isProcessing}
                      className={cx(
                        'flex-1 px-3 py-2 rounded-lg border text-sm',
                        colors.border.primary,
                        isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                      )}
                    />
                    
                    {refundMethods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRefundMethod(index)}
                        disabled={isProcessing}
                        className={cx(
                          'p-2 rounded-lg transition',
                          isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600',
                          isProcessing && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Restore Inventory Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="restore-inventory"
                checked={restoreInventory}
                onChange={(e) => setRestoreInventory(e.target.checked)}
                disabled={isProcessing}
                className={cx(
                  'w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer',
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
                Restore inventory items
              </label>
            </div>

            {/* Total Refund Summary */}
            <div className={cx(
              'p-4 rounded-lg border',
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            )}>
              <div className="flex justify-between items-center">
                <span className={cx('font-semibold', colors.text.primary)}>Total Refund Amount:</span>
                <span className={cx('text-xl font-bold', colors.text.primary)}>
                  UGX {totalRefund.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className={cx(
                'p-3 rounded-lg text-sm',
                isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-50 text-red-600'
              )}>
                {validationError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 sticky bottom-0 bg-inherit">
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
                disabled={!reason || isProcessing || (requiresNotes && !reasonNotes.trim())}
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
          </form>
        </div>
      </ModalContainer>
    </>
  );
};