// RefundModal.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import type { BillingReviewItem } from '../../../../../api/billing-review/BillingReviewTypes';
import type { ReceiptTransactionShape } from '../receipt-view/printable-receipt/ReceiptTypes';
import {
  RefundReason,
  RefundMethodType,
  type RefundableLineItem,
  BillingCycleStatus,
} from '../../../../../api/refund/RefundTypes';
import { isRefundable } from '../../../../../api/refund/RefundTypes';
import { useRefundTransaction } from '../../../../../api/refund/RefundQueries';
import { ActionModal, type ThemeColors } from './ModalPrimitives';
import { cx } from '../../utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { RefundModalBody } from './refund-modal-components/RefundModalBody';

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
  selectedTransaction: BillingReviewItem | ReceiptTransactionShape | null;
}

const isBillingReviewItem = (
  transaction: BillingReviewItem | ReceiptTransactionShape
): transaction is BillingReviewItem => {
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

  const isInitializing = useRef(false);
  const isSubmitting = useRef(false);
  const previousTransactionKey = useRef<string | null>(null);

  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [reason, setReason] = useState<RefundReason | ''>('');
  const [reasonNotes, setReasonNotes] = useState('');
  const [restoreInventory, setRestoreInventory] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [refundPercentage, setRefundPercentage] = useState(100);
  const [refundMethods, setRefundMethods] = useState<RefundMethod[]>([]);
  const [lineItems, setLineItems] = useState<RefundableLineItem[]>([]);

  const transactionKey = useMemo(() => {
    if (!selectedTransaction) return null;
    return String(
      selectedTransaction.billing_cycle_id ||
      selectedTransaction.receipt_number ||
      selectedTransaction.visit_uuid ||
      ''
    );
  }, [selectedTransaction]);

  const eligibilityWarning = useMemo(() => {
    if (!selectedTransaction) return null;

    const billingStatus = selectedTransaction.billing_status || BillingCycleStatus.DRAFT;

    const eligibility = isRefundable({
      billing_status: billingStatus,
      patient_payment_received: selectedTransaction.billing_data.totalPaid,
      insurance_payment_received: 0,
    });

    return eligibility.eligible ? null : eligibility.message || null;
  }, [selectedTransaction]);

  const generateInitialLineItems = useCallback(
    (transaction: BillingReviewItem | ReceiptTransactionShape | null, type: 'full' | 'partial') => {
      if (!transaction) return [];

      return (transaction.charge_items || [])
        .map((item: any) => {
          const serviceId = item.service?.id || item.id;
          const serviceCode = item.service?.code || item.service_code || '';
          const serviceName = item.service?.name || item.service_name || '';
          const unitPrice = item.service?.unitPrice || item.unit_price || item.unitPrice || 0;
          const totalAmount = item.totalAmount || item.line_total || item.amount || 0;
          const quantity = item.quantity || 1;

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
        .filter((item): item is RefundableLineItem => item.id > 0);
    },
    []
  );

  const generateInitialPaymentMethods = useCallback(
    (transaction: BillingReviewItem | ReceiptTransactionShape | null): RefundMethod[] => {
      if (!transaction || !transaction.payment_methods?.length) {
        return [
          {
            type: RefundMethodType.CASH,
            amount: 0,
            reference: '',
            originalAmount: 0,
          },
        ];
      }

      return transaction.payment_methods.map((pm) => ({
        type: (pm.type as RefundMethodType) || RefundMethodType.CASH,
        amount: pm.amount || 0,
        reference: pm.reference || '',
        originalAmount: pm.amount || 0,
      }));
    },
    []
  );

  const totalRefund = useMemo(() => {
    if (!selectedTransaction) return 0;

    if (refundType === 'full') {
      return selectedTransaction.billing_data.grandTotal;
    }

    const selectedItems = lineItems.filter((item) => item.is_selected);
    if (selectedItems.length === 0) return 0;

    const itemsSubtotal = selectedItems.reduce((sum, item) => sum + (item.refund_amount || 0), 0);

    const originalDiscount = selectedTransaction.billing_data?.discountAmount || 0;
    const originalTaxes = selectedTransaction.billing_data?.taxes || [];
    const originalSubtotal = selectedTransaction.billing_data?.subtotal || 0;

    const refundRatio = originalSubtotal > 0 ? itemsSubtotal / originalSubtotal : 0;
    const discountAmount = originalDiscount * refundRatio;
    const taxableAmount = itemsSubtotal - discountAmount;

    const taxAmount = originalTaxes.reduce((sum, tax) => {
      return sum + (taxableAmount * tax.rate) / 100;
    }, 0);

    return Number((itemsSubtotal - discountAmount + taxAmount).toFixed(2));
  }, [refundType, lineItems, selectedTransaction]);

  const selectedItemsCount = useMemo(
    () => lineItems.filter((i) => i.is_selected).length,
    [lineItems]
  );

  const distributeRefundAmount = useCallback((methods: RefundMethod[], total: number) => {
    if (methods.length === 0) return methods;

    const originalTotal = methods.reduce((sum, m) => sum + (m.originalAmount || 0), 0);
    if (originalTotal === 0) return methods;

    const updated = methods.map((method) => ({
      ...method,
      amount: Math.min(
        method.originalAmount || 0,
        Math.round((total * ((method.originalAmount || 0) / originalTotal)) / 100) * 100
      ),
    }));

    const distributedTotal = updated.reduce((sum, m) => sum + m.amount, 0);
    const difference = total - distributedTotal;

    if (Math.abs(difference) > 0.01 && updated.length > 0) {
      const largestIndex = updated.reduce((maxIdx, curr, idx, arr) => (
        curr.amount > arr[maxIdx].amount ? idx : maxIdx
      ), 0);

      updated[largestIndex] = {
        ...updated[largestIndex],
        amount: Math.max(0, updated[largestIndex].amount + difference),
      };
    }

    return updated;
  }, []);

  const applyPercentageToLineItems = useCallback((items: RefundableLineItem[], percentage: number) => {
    const ratio = percentage / 100;

    return items.map((item) => ({
      ...item,
      is_selected: percentage > 0,
      refund_amount: Number((item.max_refundable_amount * ratio).toFixed(2)),
      quantity: percentage > 0 ? Math.max(1, Math.floor(item.original_quantity * ratio)) : 0,
    }));
  }, []);

  useEffect(() => {
    if (!open || !selectedTransaction || !transactionKey) return;

    const isNewTransaction = transactionKey !== previousTransactionKey.current;
    if (!isNewTransaction) return;

    isInitializing.current = true;
    previousTransactionKey.current = transactionKey;

    setRefundType('full');
    setReason('');
    setReasonNotes('');
    setRestoreInventory(true);
    setValidationError(null);
    setRefundPercentage(100);

    setLineItems(generateInitialLineItems(selectedTransaction, 'full'));
    setRefundMethods(generateInitialPaymentMethods(selectedTransaction));

    isInitializing.current = false;
  }, [open, selectedTransaction, transactionKey, generateInitialLineItems, generateInitialPaymentMethods]);

  useEffect(() => {
    if (!open || isInitializing.current || !selectedTransaction) return;

    setLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        is_selected: refundType === 'full',
        refund_amount: refundType === 'full' ? item.max_refundable_amount : 0,
        quantity: refundType === 'full' ? item.original_quantity : 0,
      }))
    );

    if (refundType === 'full') {
      setRefundPercentage(100);
    }
  }, [open, refundType, selectedTransaction]);

  useEffect(() => {
    if (isInitializing.current || refundMethods.length === 0) return;

    const updatedMethods = distributeRefundAmount(refundMethods, totalRefund);
    const hasChanged = updatedMethods.some((method, index) => method.amount !== refundMethods[index]?.amount);

    if (hasChanged) {
      setRefundMethods(updatedMethods);
    }
  }, [refundMethods, totalRefund, distributeRefundAmount]);

  const handlePercentageChange = useCallback((percentage: number) => {
    if (refundType !== 'partial') return;
    setRefundPercentage(percentage);
    setLineItems((prev) => applyPercentageToLineItems(prev, percentage));
  }, [refundType, applyPercentageToLineItems]);

  const handleSelectAll = useCallback(() => {
    setLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        is_selected: true,
        refund_amount: item.max_refundable_amount,
        quantity: item.original_quantity,
      }))
    );
    setRefundPercentage(100);
  }, []);

  const handleClearAll = useCallback(() => {
    setLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        is_selected: false,
        refund_amount: 0,
        quantity: 0,
      }))
    );
    setRefundPercentage(0);
  }, []);

  const toggleLineItem = useCallback((index: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const nextSelected = !item.is_selected;

      updated[index] = {
        ...item,
        is_selected: nextSelected,
        refund_amount: nextSelected ? item.max_refundable_amount : 0,
        quantity: nextSelected ? item.original_quantity : 0,
      };

      const selectedCount = updated.filter((i) => i.is_selected).length;
      const nextPercentage =
        selectedCount === updated.length ? 100 :
        selectedCount === 0 ? 0 :
        Math.round((selectedCount / updated.length) * 100);

      setRefundPercentage(nextPercentage);
      return updated;
    });
  }, []);

  const updateLineItemQuantity = useCallback((index: number, quantity: number) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const maxQuantity = item.original_quantity;
      const newQuantity = Math.min(Math.max(0, quantity), maxQuantity);

      updated[index] = {
        ...item,
        quantity: newQuantity,
        refund_amount: Number((newQuantity * item.unit_price).toFixed(2)),
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
    setRefundMethods((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const billingCycleId = selectedTransaction?.billing_cycle_id || 0;

  const { mutate: refundTransaction, isPending: isProcessing } = useRefundTransaction(
    billingCycleId,
    {
      onSuccess: (response) => {
        isSubmitting.current = false;

        if (response.success) {
          showToast('success', 'Refund processed successfully.', 3000);
          onClose();
          onSuccess?.();
          return;
        }

        const errorMsg = response.message || 'Failed to process refund.';
        setValidationError(errorMsg);
        showToast('error', errorMsg, 4500);
      },
      onError: (error: any) => {
        isSubmitting.current = false;
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          'An error occurred while processing the refund.';
        setValidationError(errorMessage);
        showToast('error', errorMessage, 4500);
      },
    }
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current || isProcessing) return;

    setValidationError(null);

    if (!billingCycleId) {
      showToast('error', 'No transaction selected.', 2500);
      return;
    }

    if (!reason) {
      showToast('error', 'Please select a refund reason.', 2500);
      return;
    }

    if (reason === 'other' && !reasonNotes.trim()) {
      showToast('error', 'Please provide notes for "Other" reason.', 2500);
      return;
    }

    if (totalRefund <= 0) {
      showToast('error', 'Refund amount must be greater than zero.', 2500);
      return;
    }

    const methods = refundMethods
      .filter((m) => m.type && m.amount > 0)
      .map((m) => ({
        type: m.type as RefundMethodType,
        amount: Number(m.amount.toFixed(2)),
        reference: m.reference?.trim() || null,
      }));

    if (methods.length === 0) {
      showToast('error', 'At least one refund method with amount greater than 0 is required.', 3000);
      return;
    }

    const totalMethodAmount = methods.reduce((sum, m) => sum + m.amount, 0);
    if (Math.abs(totalMethodAmount - totalRefund) > 0.01) {
      showToast(
        'error',
        `Refund methods total (${totalMethodAmount}) must match refund total (${totalRefund}).`,
        3500
      );
      return;
    }

    const payload: any = {
      reason: reason as RefundReason,
      reason_notes: reason === 'other' ? reasonNotes.trim() : undefined,
      refund_methods: methods,
      restore_inventory: restoreInventory,
    };

    if (refundType === 'partial') {
      const selectedLineItems = lineItems
        .filter((item) => item.is_selected && item.refund_amount > 0)
        .map((item) => {
          if (item.id <= 0) return null;

          return {
            line_item_id: item.id,
            refund_amount: Number(item.refund_amount.toFixed(2)),
            quantity: item.quantity > 0 ? item.quantity : undefined,
            service_code: item.service_code,
          };
        })
        .filter(Boolean);

      if (selectedLineItems.length === 0) {
        showToast('error', 'Please select at least one valid line item to refund.', 3000);
        return;
      }

      payload.line_items = selectedLineItems;
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
    isProcessing,
    showToast,
  ]);

  const handleClose = useCallback(() => {
    if (isProcessing) return;
    isSubmitting.current = false;
    onClose();
  }, [isProcessing, onClose]);

  if (!selectedTransaction) return null;

  const transactionForBody = isBillingReviewItem(selectedTransaction)
    ? selectedTransaction
    : ({
        ...selectedTransaction,
        has_billing: true,
        visit_id: 0,
        visit_uuid: '',
        patient_id: 0,
      } as BillingReviewItem);

  return (
    <ActionModal
      open={open}
      onClose={handleClose}
      theme={theme}
      colors={colors}
      title="Process Refund"
      subtitle="Review refund details, verify line items, and complete the refund securely."
      icon={<RotateCcw className={cx('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-600')} />}
      maxWidthClass="max-w-4xl"
      isBusy={isProcessing}
      disableClose={isProcessing}
      busyTitle="Processing refund"
      busyDescription="We’re validating the refund, reconciling payment methods, and updating the billing record."
      contentClassName="max-h-[85vh] overflow-y-auto"
    >
      <div className="space-y-4 p-5 sm:p-6">
        {eligibilityWarning && (
          <div className={cx(
            'flex gap-3 rounded-xl border p-4',
            isDark ? 'border-amber-700 bg-amber-900/10' : 'border-amber-200 bg-amber-50'
          )}>
            <AlertTriangle className={cx('mt-0.5 h-5 w-5 flex-shrink-0', isDark ? 'text-amber-300' : 'text-amber-600')} />
            <div>
              <p className={cx('text-sm font-semibold', colors.text.primary)}>Refund eligibility warning</p>
              <p className={cx('mt-1 text-sm', colors.text.secondary)}>{eligibilityWarning}</p>
            </div>
          </div>
        )}

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
          onReasonChange={(value) => {
            setReason(value);
            setValidationError(null);
          }}
          onReasonNotesChange={(value) => {
            setReasonNotes(value);
            setValidationError(null);
          }}
          onPercentageChange={handlePercentageChange}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          onToggleLineItem={toggleLineItem}
          onUpdateQuantity={updateLineItemQuantity}
          onUpdateRefundMethod={updateRefundMethod}
          onRestoreInventoryChange={setRestoreInventory}
          onSubmit={handleSubmit}
          onClose={handleClose}
        />
      </div>
    </ActionModal>
  );
};
