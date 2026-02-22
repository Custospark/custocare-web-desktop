import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import { 
  RefundReason, 
  RefundMethodType,
  RefundableLineItem,
  isRefundable 
} from '../../../../../api/refund/RefundTypes';
import type { RefundMethod } from './RefundMethodsDistributor';

export const useRefundFormState = (selectedTransaction: BillingReviewItem | null, open: boolean) => {
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
  const [refundMethods, setRefundMethods] = useState<RefundMethod[]>([]);

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
  ): RefundMethod[] => {
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

  // Auto-distribute refund amount across payment methods
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

  // Apply percentage to line items
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
    
    // Only update if amounts actually changed
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

  const handleReasonChange = useCallback((newReason: RefundReason | '') => {
    setReason(newReason);
    setValidationError(null);
  }, []);

  const handleReasonNotesChange = useCallback((notes: string) => {
    setReasonNotes(notes);
    setValidationError(null);
  }, []);

  return {
    // State
    refundType,
    reason,
    reasonNotes,
    restoreInventory,
    validationError,
    refundPercentage,
    refundMethods,
    lineItems,
    eligibilityWarning,
    totalRefund,
    selectedItemsCount,
    isInitializing: isInitializing.current,
    
    // Setters
    setRefundType,
    setRestoreInventory,
    setValidationError,
    
    // Handlers
    handleReasonChange,
    handleReasonNotesChange,
    handlePercentageChange,
    handleSelectAll,
    handleClearAll,
    toggleLineItem,
    updateLineItemQuantity,
    updateRefundMethod,
  };
};