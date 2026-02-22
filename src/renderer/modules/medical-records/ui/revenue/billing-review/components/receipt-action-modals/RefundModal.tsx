import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Undo2, AlertTriangle, Percent, Coins } from 'lucide-react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import { 
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

// Quick refund amount presets
const REFUND_PRESETS = [25, 50, 75, 100];

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
  
  // Ref to track if component is initializing
  const isInitializing = useRef(false);
  const prevTransactionId = useRef<string | null>(null);
  
  // Form state
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [reason, setReason] = useState<RefundReason | ''>('');
  const [reasonNotes, setReasonNotes] = useState('');
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [refundPercentage, setRefundPercentage] = useState<number>(100);
  
  // Refund methods state
  const [refundMethods, setRefundMethods] = useState<Array<{
    type: RefundMethodType | '';
    amount: number;
    reference: string;
    originalAmount?: number;
  }>>([]);

  // Line items for partial refund
  const [lineItems, setLineItems] = useState<RefundableLineItem[]>([]);

  // Memoized eligibility check
  const eligibilityWarning = useMemo(() => {
    if (!selectedTransaction) return null;
    
    const eligibility = isRefundable({
      billing_status: selectedTransaction.billing_status,
      patient_payment_received: selectedTransaction.billing_data.totalPaid,
      insurance_payment_received: 0,
    });
    
    return eligibility.eligible ? null : (eligibility.message || null);
  }, [selectedTransaction]);

  // Memoized initial line items generation
  const generateInitialLineItems = useCallback((
    transaction: BillingReviewItem | null,
    type: 'full' | 'partial'
  ): RefundableLineItem[] => {
    if (!transaction) return [];
    
    return transaction.charge_items.map((item, index) => ({
      id: parseInt(item.id.replace('charge::', '')) || index,
      line_item_uuid: item.id.replace('charge::', ''),
      service_code: item.service.code,
      service_name: item.service.name,
      // quantity: item.quantity,
      unit_price: item.service.unitPrice,
      line_total: item.totalAmount,
      net_amount: item.totalAmount,
      max_refundable_amount: item.totalAmount,
      is_selected: type === 'full',
      refund_amount: type === 'full' ? item.totalAmount : 0,
      quantity: type === 'full' ? item.quantity : 0,
      original_quantity: item.quantity,
      max_refundable_quantity: item.quantity,
    }));
  }, []);

  // Memoized initial payment methods generation
  const generateInitialPaymentMethods = useCallback((
    transaction: BillingReviewItem | null
  ) => {
    if (!transaction || !transaction.payment_methods?.length) {
      return [{ type: RefundMethodType.CASH, amount: 0, reference: '', originalAmount: 0 }];
    }
    
    return transaction.payment_methods.map(pm => ({
      type: pm.type as RefundMethodType,
      amount: pm.amount,
      reference: pm.reference || '',
      originalAmount: pm.amount,
    }));
  }, []);

  // Calculate total refund amount (memoized)
  const totalRefund = useMemo(() => {
    if (refundType === 'full' && selectedTransaction) {
      return selectedTransaction.billing_data.totalPaid;
    }
    return lineItems
      .filter(item => item.is_selected)
      .reduce((sum, item) => sum + (item.refund_amount || 0), 0);
  }, [refundType, lineItems, selectedTransaction]);

  // Calculate selected items count (memoized)
  const selectedItemsCount = useMemo(() => {
    return lineItems.filter(i => i.is_selected).length;
  }, [lineItems]);

  // Auto-distribute refund amount across payment methods (memoized function)
  const distributeRefundAmount = useCallback((
    methods: typeof refundMethods,
    total: number
  ) => {
    if (methods.length === 0) return methods;

    const originalTotal = methods.reduce((sum, m) => sum + (m.originalAmount || 0), 0);
    if (originalTotal === 0) return methods;

    const updated = methods.map(method => ({
      ...method,
      amount: Math.min(
        method.originalAmount || 0,
        Math.round((total * ((method.originalAmount || 0) / originalTotal)) / 100) * 100
      ),
    }));

    // Adjust for rounding errors
    const distributedTotal = updated.reduce((sum, m) => sum + m.amount, 0);
    const difference = total - distributedTotal;
    
    if (Math.abs(difference) > 0.01 && updated.length > 0) {
      const largestIndex = updated.reduce((maxIdx, curr, idx, arr) => 
        curr.amount > arr[maxIdx].amount ? idx : maxIdx, 0);
      updated[largestIndex] = {
        ...updated[largestIndex],
        amount: Math.max(0, updated[largestIndex].amount + difference)
      };
    }

    return updated;
  }, []);

  // Apply percentage to line items (memoized function)
  const applyPercentageToLineItems = useCallback((
    items: RefundableLineItem[],
    percentage: number
  ): RefundableLineItem[] => {
    const ratio = percentage / 100;
    return items.map(item => ({
      ...item,
      is_selected: percentage > 0,
      refund_amount: item.max_refundable_amount * ratio,
      quantity: Math.max(1, Math.floor(item.original_quantity * ratio)),
    }));
  }, []);

  // Initialize/reset form when modal opens or transaction changes
  useEffect(() => {
    if (!open) return;

    const transactionId = selectedTransaction?.billing_cycle_id?.toString() || null;
    const isNewTransaction = transactionId !== prevTransactionId.current;
    
    if (isNewTransaction) {
      isInitializing.current = true;
      prevTransactionId.current = transactionId;
      
      // Reset all form state
      setReason('');
      setReasonNotes('');
      setRestoreInventory(true);
      setValidationError(null);
      setRefundPercentage(100);
      setRefundType('full');
      
      // Initialize line items
      const initialLineItems = generateInitialLineItems(selectedTransaction, 'full');
      setLineItems(initialLineItems);
      
      // Initialize payment methods
      const initialPaymentMethods = generateInitialPaymentMethods(selectedTransaction);
      setRefundMethods(initialPaymentMethods);
      
      isInitializing.current = false;
    }
  }, [open, selectedTransaction, generateInitialLineItems, generateInitialPaymentMethods]);

  // Update line items when refund type changes (independent effect)
  useEffect(() => {
    if (isInitializing.current || !selectedTransaction) return;
    
    setLineItems(prev => 
      prev.map(item => ({
        ...item,
        is_selected: refundType === 'full',
        refund_amount: refundType === 'full' ? item.max_refundable_amount : 0,
        quantity: refundType === 'full' ? item.original_quantity : 0,
      }))
    );
    
    if (refundType === 'full') {
      setRefundPercentage(100);
    }
  }, [refundType, selectedTransaction]);

  // Update refund methods when total refund changes
  useEffect(() => {
    if (isInitializing.current || refundMethods.length === 0) return;
    
    const updatedMethods = distributeRefundAmount(refundMethods, totalRefund);
    
    // Only update if amounts actually changed
    const hasChanged = updatedMethods.some((method, index) => 
      method.amount !== refundMethods[index].amount
    );
    
    if (hasChanged) {
      setRefundMethods(updatedMethods);
    }
  }, [totalRefund]); 

  // Handlers with useCallback to prevent recreating functions
  const handlePercentageChange = useCallback((percentage: number) => {
    if (refundType !== 'partial') return;
    
    setRefundPercentage(percentage);
    setLineItems(prev => applyPercentageToLineItems(prev, percentage));
  }, [refundType, applyPercentageToLineItems]);

  const handleSelectAll = useCallback(() => {
    setLineItems(prev => prev.map(item => ({
      ...item,
      is_selected: true,
      refund_amount: item.max_refundable_amount,
      quantity: item.original_quantity,
    })));
    setRefundPercentage(100);
  }, []);

  const handleClearAll = useCallback(() => {
    setLineItems(prev => prev.map(item => ({
      ...item,
      is_selected: false,
      refund_amount: 0,
      quantity: 0,
    })));
    setRefundPercentage(0);
  }, []);

  const toggleLineItem = useCallback((index: number) => {
    setLineItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const newSelected = !item.is_selected;
      
      updated[index] = {
        ...item,
        is_selected: newSelected,
        refund_amount: newSelected ? item.max_refundable_amount : 0,
        quantity: newSelected ? item.original_quantity : 0,
      };
      
      // Calculate new percentage
      const selectedCount = updated.filter(i => i.is_selected).length;
      const newPercentage = selectedCount === updated.length ? 100 : 
                           selectedCount === 0 ? 0 : 
                           Math.round((selectedCount / updated.length) * 100);
      setRefundPercentage(newPercentage);
      
      return updated;
    });
  }, []);

  const updateLineItemQuantity = useCallback((index: number, quantity: number) => {
    setLineItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const maxQuantity = item.original_quantity;
      const newQuantity = Math.min(Math.max(0, quantity), maxQuantity);
      
      updated[index] = {
        ...item,
        quantity: newQuantity,
        refund_amount: newQuantity * item.unit_price,
        is_selected: newQuantity > 0,
      };
      
      return updated;
    });
  }, []);

  const updateRefundMethod = useCallback((
    index: number, 
    field: 'type' | 'amount' | 'reference', 
    value: string | number
  ) => {
    setRefundMethods(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const billingCycleId = selectedTransaction?.billing_cycle_id;

  const { mutate: refundTransaction, isPending: isProcessing } = useRefundTransaction(
    billingCycleId || 0,
    {
      onSuccess: (response) => {
        if (response.success) {
          showToast('success', 'Refund processed successfully', 3000);
          onClose();
          onSuccess?.();
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

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!billingCycleId) {
      showToast('error', 'No transaction selected', 3000);
      return;
    }

    if (!reason) {
      showToast('error', 'Please select a refund reason', 3000);
      return;
    }

    if (reason === 'other' && !reasonNotes.trim()) {
      showToast('error', 'Please provide notes for "Other" reason', 3000);
      return;
    }

    if (totalRefund <= 0) {
      showToast('error', 'Refund amount must be greater than 0', 3000);
      return;
    }

    // Prepare refund methods
    const methods = refundMethods
      .filter(m => m.type && m.amount > 0)
      .map(m => ({
        type: m.type as RefundMethodType,
        amount: m.amount,
        reference: m.reference || null,
      }));

    if (methods.length === 0) {
      showToast('error', 'At least one refund method with amount > 0 is required', 3000);
      return;
    }

    if (refundType === 'full') {
      refundTransaction({
        reason: reason as RefundReason,
        reason_notes: reason === 'other' ? reasonNotes : undefined,
        refund_methods: methods,
        restore_inventory: restoreInventory,
      });
    } else {
      const selectedLineItems = lineItems
        .filter(item => item.is_selected && item.refund_amount > 0)
        .map(item => ({
          line_item_id: item.id,
          refund_amount: item.refund_amount,
          quantity: item.quantity,
        }));

      if (selectedLineItems.length === 0) {
        showToast('error', 'Please select at least one line item to refund', 3000);
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
  }, [
    billingCycleId,
    reason,
    reasonNotes,
    totalRefund,
    refundMethods,
    refundType,
    lineItems,
    restoreInventory,
    refundTransaction,
    showToast
  ]);

  const handleClose = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [isProcessing, onClose]);

  if (!selectedTransaction) return null;

  const requiresNotes = reason === 'other';

  return (
    <>
      <ModalBackdrop open={open} onClick={handleClose} />
      <ModalContainer open={open}>
        <div
          className={cx(
            'rounded-xl shadow-2xl border w-full max-w-3xl max-h-[90vh] overflow-y-auto',
            colors.border.primary,
            colors.bg.elevated,
            isProcessing && 'pointer-events-none opacity-75'
          )}
        >
          {/* Header */}
          <div className={cx('flex items-center justify-between p-5 border-b sticky top-0 z-10', colors.border.primary, colors.bg.elevated)}>
            <div className="flex items-center gap-3">
              <div className={cx('p-2 rounded-lg', isDark ? 'bg-amber-900/30' : 'bg-amber-100')}>
                <Undo2 className={cx('w-5 h-5', isDark ? 'text-amber-400' : 'text-amber-600')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-bold', colors.text.primary)}>Process Refund</h3>
                <p className={cx('text-xs mt-0.5', colors.text.secondary)}>
                  Smart refunds with automatic calculations
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

            {/* Transaction Summary Card */}
            <div className={cx(
              'p-4 rounded-lg border grid grid-cols-2 md:grid-cols-4 gap-4',
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
            )}>
              <div>
                <div className={cx('text-xs', colors.text.secondary)}>Receipt</div>
                <div className={cx('font-semibold', colors.text.primary)}>
                  {selectedTransaction.receipt_number || 'Draft'}
                </div>
              </div>
              <div>
                <div className={cx('text-xs', colors.text.secondary)}>Patient</div>
                <div className={cx('font-semibold', colors.text.primary)}>
                  {selectedTransaction.patient_name}
                </div>
              </div>
              <div>
                <div className={cx('text-xs', colors.text.secondary)}>Total Paid</div>
                <div className={cx('font-semibold text-green-600')}>
                  UGX {selectedTransaction.billing_data.totalPaid.toLocaleString()}
                </div>
              </div>
              <div>
                <div className={cx('text-xs', colors.text.secondary)}>Refund Amount</div>
                <div className={cx('font-semibold text-amber-600')}>
                  UGX {totalRefund.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Refund Type & Reason Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Refund Type */}
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

              {/* Refund Reason */}
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
            </div>

            {/* Reason Notes */}
            {requiresNotes && (
              <div>
                <textarea
                  value={reasonNotes}
                  onChange={(e) => {
                    setReasonNotes(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="Please provide details for 'Other' reason..."
                  rows={2}
                  required
                  disabled={isProcessing}
                  className={cx(
                    'w-full px-4 py-2.5 rounded-lg border text-sm resize-none',
                    colors.border.primary,
                    isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
                    colors.ring,
                    isProcessing && 'cursor-not-allowed opacity-50'
                  )}
                />
              </div>
            )}

            {/* Partial Refund Section */}
            {refundType === 'partial' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={cx('text-sm font-semibold', colors.text.primary)}>
                    Select Items to Refund
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      disabled={isProcessing}
                      className={cx(
                        'px-3 py-1 text-xs rounded transition',
                        isDark ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      )}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      disabled={isProcessing}
                      className={cx(
                        'px-3 py-1 text-xs rounded transition',
                        isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Quick Percentage Presets */}
                <div className="flex items-center gap-2">
                  <Percent className={cx('w-4 h-4', colors.text.secondary)} />
                  <div className="flex gap-1 flex-wrap">
                    {REFUND_PRESETS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePercentageChange(preset)}
                        disabled={isProcessing}
                        className={cx(
                          'px-3 py-1 text-xs rounded transition',
                          refundPercentage === preset
                            ? isDark ? 'bg-amber-600 text-white' : 'bg-amber-600 text-white'
                            : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                  <span className={cx('text-sm ml-2', colors.text.secondary)}>
                    {selectedItemsCount} of {lineItems.length} items
                  </span>
                </div>

                {/* Line Items Table */}
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
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-2 text-right">Refund Qty</div>
                  </div>

                  {/* Items */}
                  {lineItems.map((item, index) => (
                    <div key={item.id} className={cx(
                      'grid grid-cols-12 gap-2 p-3 text-xs border-b last:border-b-0',
                      colors.border.primary,
                      item.is_selected && (isDark ? 'bg-amber-900/20' : 'bg-amber-50')
                    )}>
                      <div className="col-span-4 flex items-center gap-2">
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
                      <div className="col-span-2 text-center self-center">
                        {item.original_quantity}
                      </div>
                      <div className="col-span-2 text-right self-center">
                        UGX {item.unit_price.toLocaleString()}
                      </div>
                      <div className="col-span-2 text-right self-center">
                        UGX {item.net_amount.toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.quantity || 0}
                          onChange={(e) => updateLineItemQuantity(index, parseInt(e.target.value) || 0)}
                          disabled={!item.is_selected || isProcessing}
                          min={0}
                          max={item.original_quantity}
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

            {/* Refund Methods - Auto-populated */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={cx('text-sm font-semibold', colors.text.primary)}>
                  Refund Methods <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Coins className={cx('w-4 h-4', colors.text.secondary)} />
                  <span className={cx('text-xs', colors.text.secondary)}>
                    Auto-calculated from original payment
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {refundMethods.map((method, index) => (
                  <div key={index} className="flex gap-2 items-center">
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
                      placeholder="Reference (opt)"
                      disabled={isProcessing}
                      className={cx(
                        'flex-1 px-3 py-2 rounded-lg border text-sm',
                        colors.border.primary,
                        isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Restore Inventory Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={restoreInventory}
                onChange={(e) => setRestoreInventory(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className={cx('text-sm', colors.text.secondary)}>
                Restore inventory items
              </span>
            </label>

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
            <div className={cx(
              'flex gap-3 pt-4 sticky bottom-0 border-t',
              colors.border.primary,
              colors.bg.elevated
            )}>
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className={cx(
                  'flex-1 px-4 py-3 rounded-lg border text-sm font-bold transition cursor-pointer',
                  colors.border.primary,
                  isDark ? 'text-gray-100 hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-50',
                  isProcessing && 'cursor-not-allowed opacity-50'
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason || isProcessing || (requiresNotes && !reasonNotes.trim()) || totalRefund <= 0}
                className={cx(
                  'flex-1 px-4 py-3 rounded-lg text-sm font-bold transition cursor-pointer',
                  'bg-amber-600 hover:bg-amber-700 text-white',
                  'flex items-center justify-center gap-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Undo2 className="w-4 h-4" />
                {isProcessing ? 'Processing...' : `Refund UGX ${totalRefund.toLocaleString()}`}
              </button>
            </div>
          </form>
        </div>
      </ModalContainer>
    </>
  );
};
