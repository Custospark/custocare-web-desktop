import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import type { ReceiptTransactionShape } from '../receipt-view/printable-receipt/ReceiptTypes';
import { 
  RefundReason, 
  RefundMethodType,
  type RefundableLineItem,
  BillingCycleStatus
} from '../../../../../api/refund/RefundTypes';
import { isRefundable } from '../../../../../api/refund/RefundTypes';
import { useRefundTransaction } from '../../../../../api/refund/RefundQueries';
import { ModalBackdrop, ModalContainer } from './ModalPrimitives';
import { cx } from '../../utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { MainRefundModalHeader } from './refund-modal-components/MainRefundModalHeader';
import { RefundModalBody } from './refund-modal-components/RefundModalBody';

export interface ThemeColors {
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

export interface RefundMethod {
  type: RefundMethodType;
  amount: number;
  reference: string;
  originalAmount?: number;
}

interface RefundModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  selectedTransaction: BillingReviewItem | ReceiptTransactionShape;
}

// Type guard to check if transaction is BillingReviewItem
const isBillingReviewItem = (transaction: BillingReviewItem | ReceiptTransactionShape): transaction is BillingReviewItem => {
  return 'has_billing' in transaction && 'visit_id' in transaction;
};

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
  
  // Refs
  const isInitializing = useRef(false);
  const prevTransactionId = useRef<string | null>(null);
  const isSubmitting = useRef(false);
  
  // Form state
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [reason, setReason] = useState<RefundReason | ''>('');
  const [reasonNotes, setReasonNotes] = useState('');
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [refundPercentage, setRefundPercentage] = useState<number>(100);
  
  // Refund methods state
  const [refundMethods, setRefundMethods] = useState<RefundMethod[]>([]);

  // Line items for partial refund
  const [lineItems, setLineItems] = useState<RefundableLineItem[]>([]);

  // Memoized eligibility check - handle undefined billing_status
  const eligibilityWarning = useMemo(() => {
    if (!selectedTransaction) return null;
    
    // Safely get billing_status with fallback
    const billingStatus = selectedTransaction.billing_status || BillingCycleStatus.DRAFT;
    
    const eligibility = isRefundable({
      billing_status: billingStatus,
      patient_payment_received: selectedTransaction.billing_data.totalPaid,
      insurance_payment_received: 0,
    });
    
    return eligibility.eligible ? null : (eligibility.message || null);
  }, [selectedTransaction]);

  // Memoized initial line items generation - works with both types
  const generateInitialLineItems = useCallback((
    transaction: BillingReviewItem | ReceiptTransactionShape | null,
    type: 'full' | 'partial'
  ): RefundableLineItem[] => {
    if (!transaction) return [];
    
    // Handle both transaction types
    const chargeItems = transaction.charge_items || [];
    
    return chargeItems
      .map((item: any) => {
        // Extract service info based on transaction type
        const serviceId = item.service?.id || item.id;
        const serviceCode = item.service?.code || item.service_code || '';
        const serviceName = item.service?.name || item.service_name || '';
        const unitPrice = item.service?.unitPrice || item.unit_price || item.unitPrice || 0;
        const totalAmount = item.totalAmount || item.line_total || item.amount || 0;
        const quantity = item.quantity || 1;
        
        // Create a complete object that matches RefundableLineItem
        const lineItem: RefundableLineItem = {
          id: typeof serviceId === 'number' ? serviceId : parseInt(serviceId) || 0,
          line_item_uuid: typeof serviceId === 'string' ? serviceId : String(serviceId),
          service_code: serviceCode,
          service_name: serviceName,
          unit_price: unitPrice,
          line_total: totalAmount,
          net_amount: totalAmount,
          max_refundable_amount: totalAmount,
          is_selected: type === 'full',
          refund_amount: type === 'full' ? totalAmount : 0,
          quantity: type === 'full' ? quantity : 0,
          original_quantity: quantity,
        };
        
        return lineItem;
      })
      .filter((item): item is RefundableLineItem => item !== null && item.id > 0);
  }, []);

  // Memoized initial payment methods generation - works with both types
  const generateInitialPaymentMethods = useCallback((
    transaction: BillingReviewItem | ReceiptTransactionShape | null
  ): RefundMethod[] => {
    if (!transaction || !transaction.payment_methods?.length) {
      return [{ type: RefundMethodType.CASH, amount: 0, reference: '', originalAmount: 0 }];
    }
    
    return transaction.payment_methods.map(pm => ({
      type: (pm.type as RefundMethodType) || RefundMethodType.CASH,
      amount: pm.amount || 0,
      reference: pm.reference || '',
      originalAmount: pm.amount || 0,
    }));
  }, []);

  const totalRefund = useMemo(() => {
    if (refundType === 'full' && selectedTransaction) {
      return selectedTransaction.billing_data.grandTotal;
    }
    
    const selectedItems = lineItems.filter(item => item.is_selected);
    if (selectedItems.length === 0) return 0;
    
    const itemsSubtotal = selectedItems.reduce((sum, item) => 
      sum + (item.refund_amount || 0), 0
    );
    
    const originalDiscount = selectedTransaction?.billing_data?.discountAmount || 0;
    const originalTaxes = selectedTransaction?.billing_data?.taxes || [];
    const originalSubtotal = selectedTransaction?.billing_data?.subtotal || 0;
    
    const refundRatio = originalSubtotal > 0 
      ? itemsSubtotal / originalSubtotal 
      : 0;
    
    const discountAmount = originalDiscount * refundRatio;
    const taxableAmount = itemsSubtotal - discountAmount;
    
    const taxAmount = originalTaxes.reduce((sum, tax) => {
      const taxAmount = (taxableAmount * tax.rate) / 100;
      return sum + taxAmount;
    }, 0);
    
    const rawTotal = itemsSubtotal - discountAmount + taxAmount;
    return Number(rawTotal.toFixed(2));
  }, [refundType, lineItems, selectedTransaction]);

  const selectedItemsCount = useMemo(() => {
    return lineItems.filter(i => i.is_selected).length;
  }, [lineItems]);

  const distributeRefundAmount = useCallback((
    methods: RefundMethod[],
    total: number
  ): RefundMethod[] => {
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
      
      setReason('');
      setReasonNotes('');
      setRestoreInventory(true);
      setValidationError(null);
      setRefundPercentage(100);
      setRefundType('full');
      
      const initialLineItems = generateInitialLineItems(selectedTransaction, 'full');
      setLineItems(initialLineItems);
      
      const initialPaymentMethods = generateInitialPaymentMethods(selectedTransaction);
      setRefundMethods(initialPaymentMethods);
      
      console.log('Initialized line items with IDs:', 
        initialLineItems.map(item => ({ id: item.id, name: item.service_name }))
      );
      
      isInitializing.current = false;
    }
  }, [open, selectedTransaction, generateInitialLineItems, generateInitialPaymentMethods]);

  // Update line items when refund type changes
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
    
    const hasChanged = updatedMethods.some((method, index) => 
      method.amount !== refundMethods[index].amount
    );
    
    if (hasChanged) {
      setRefundMethods(updatedMethods);
    }
  }, [totalRefund, distributeRefundAmount, refundMethods]);

  // Handlers
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

  const handleReasonChange = useCallback((newReason: RefundReason | '') => {
    setReason(newReason);
    setValidationError(null);
  }, []);

  const handleReasonNotesChange = useCallback((notes: string) => {
    setReasonNotes(notes);
    setValidationError(null);
  }, []);

  const handleRestoreInventoryChange = useCallback((checked: boolean) => {
    setRestoreInventory(checked);
  }, []);

  const billingCycleId = selectedTransaction?.billing_cycle_id;

  const { mutate: refundTransaction, isPending: isProcessing } = useRefundTransaction(
    billingCycleId || 0,
    {
      onSuccess: (response) => {
        isSubmitting.current = false;
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
        isSubmitting.current = false;
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred while processing refund';
        setValidationError(errorMessage);
        showToast('error', errorMessage, 5000);
      },
    }
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting.current) {
      console.log('Submission already in progress, skipping...');
      return;
    }
    
    setValidationError(null);

    // Basic validation
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
        amount: Number(m.amount.toFixed(2)),
        reference: m.reference?.trim() || null,
      }));

    if (methods.length === 0) {
      showToast('error', 'At least one refund method with amount > 0 is required', 3000);
      return;
    }

    // Validate total matches
    const totalMethodAmount = methods.reduce((sum, m) => sum + m.amount, 0);
    if (Math.abs(totalMethodAmount - totalRefund) > 0.01) {
      showToast('error', `Refund method total (${totalMethodAmount}) must match refund amount (${totalRefund})`, 3000);
      return;
    }

    // Build base payload
    const payload: any = {
      reason: reason as RefundReason,
      reason_notes: reason === 'other' ? reasonNotes.trim() : undefined,
      refund_methods: methods,
      restore_inventory: restoreInventory,
    };

    // Add line items for partial refund
    if (refundType === 'partial') {
      const selectedLineItems = lineItems
        .filter(item => item.is_selected && item.refund_amount > 0)
        .map(item => {
          // Validate item ID
          if (item.id <= 0) {
            console.error('Invalid item ID detected:', item);
            return null;
          }
          
          return {
            line_item_id: item.id,
            refund_amount: Number(item.refund_amount.toFixed(2)),
            quantity: item.quantity > 0 ? item.quantity : undefined,
            service_code: item.service_code,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (selectedLineItems.length === 0) {
        showToast('error', 'Please select at least one valid line item to refund', 3000);
        return;
      }

      payload.line_items = selectedLineItems;

      console.log('Processing partial refund:', {
        ...payload,
        line_items: payload.line_items.map((item: any) => ({
          line_item_id: item.line_item_id,
          refund_amount: item.refund_amount,
          quantity: item.quantity,
        }))
      });
    } else {
      console.log('Processing full refund:', payload);
    }

    isSubmitting.current = true;
    refundTransaction(payload);

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
      isSubmitting.current = false;
      onClose();
    }
  }, [isProcessing, onClose]);

  if (!selectedTransaction) return null;

  // Convert to BillingReviewItem-like shape for RefundModalBody if needed
  const transactionForBody = isBillingReviewItem(selectedTransaction) 
    ? selectedTransaction 
    : {
        ...selectedTransaction,
        has_billing: true,
        visit_id: 0,
        visit_uuid: '',
        patient_id: 0,
      } as BillingReviewItem;

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
          <MainRefundModalHeader
            colors={colors}
            isDark={isDark}
            isProcessing={isProcessing}
            onClose={handleClose}
          />
          
          <RefundModalBody
            selectedTransaction={transactionForBody}
            colors={colors}
            isDark={isDark}
            isProcessing={isProcessing}
            eligibilityWarning={eligibilityWarning}
            refundType={refundType}
            reason={reason}
            reasonNotes={reasonNotes}
            totalRefund={totalRefund}
            refundMethods={refundMethods}
            lineItems={lineItems}
            refundPercentage={refundPercentage}
            selectedItemsCount={selectedItemsCount}
            restoreInventory={restoreInventory}
            validationError={validationError}
            onRefundTypeChange={setRefundType}
            onReasonChange={handleReasonChange}
            onReasonNotesChange={handleReasonNotesChange}
            onPercentageChange={handlePercentageChange}
            onSelectAll={handleSelectAll}
            onClearAll={handleClearAll}
            onToggleLineItem={toggleLineItem}
            onUpdateQuantity={updateLineItemQuantity}
            onUpdateRefundMethod={updateRefundMethod}
            onRestoreInventoryChange={handleRestoreInventoryChange}
            onSubmit={handleSubmit}
            onClose={handleClose}
          />
        </div>
      </ModalContainer>
    </>
  );
};