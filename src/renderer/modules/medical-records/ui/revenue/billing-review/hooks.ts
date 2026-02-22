// hooks.ts
// Custom React hooks for business logic and state management

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import {
  DerivedFinancials,
  EmailFormState,
  FilterState,
  MockTransaction,
  RefundFormState,
  RefundRecord,
  ToastState,
  VoidFormState,
  VoidRecord,
} from './types';
import {
  computeRefundFromQuantities,
  deriveStatus,
  getRefundedQtyMap,
  sumProcessedRefundAmount,
  isoNow,
} from './utils';
import { RefundableLineItem } from '../../../api/refund/RefundTypes';
import { BillingReviewItem } from './components/Modals';

// ==================== TOAST HOOK ====================

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'info',
    message: '',
  });

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ show: true, type, message });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((s) => ({ ...s, show: false }));
  }, []);

  return { toast, showToast, hideToast };
};

// ==================== FILTER HOOK ====================

export const useFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    statusFilter: 'all',
    dateRange: { start: '', end: '' },
    sortBy: 'date',
    sortOrder: 'desc',
    showAdvancedFilters: false,
  });

  const deferredSearch = useDeferredValue(filters.searchTerm);

  const updateFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      dateRange: { start: '', end: '' },
      sortBy: 'date',
      sortOrder: 'desc',
      showAdvancedFilters: false,
    });
  }, []);

  return { filters, deferredSearch, updateFilter, clearFilters };
};

// ==================== TRANSACTION FILTERING HOOK ====================

export const useFilteredTransactions = (
  transactions: MockTransaction[],
  deferredSearch: string,
  filters: FilterState
) => {
  return useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();

    const list = transactions.filter((t) => {
      const derived = deriveStatus(t);

      const matchesText = !q
        ? true
        : [
            t.receipt_number,
            String(t.visit_id),
            t.patient.name,
            t.patient.patient_number,
            t.patient.email ?? '',
            t.patient.phone ?? '',
            derived,
            ...t.charge_items.map(
              (ci) => `${ci.service.name} ${ci.service.code} ${ci.service.category}`
            ),
            ...t.payment_methods.map(
              (pm) => `${pm.type} ${pm.details ?? ''} ${pm.reference ?? ''} ${pm.amount}`
            ),
            ...(t.refunds ?? []).map(
              (r) => `refund ${r.method} ${r.reference ?? ''} ${r.reason} ${r.total_amount}`
            ),
          ]
            .join(' ')
            .toLowerCase()
            .includes(q);

      const matchesStatus = filters.statusFilter === 'all' ? true : derived === filters.statusFilter;

      let matchesDate = true;
      if (filters.dateRange.start && filters.dateRange.end) {
        const d = new Date(t.date).getTime();
        const start = new Date(filters.dateRange.start).getTime();
        const end = new Date(filters.dateRange.end).getTime();
        matchesDate = d >= start && d <= end;
      }

      return matchesText && matchesStatus && matchesDate;
    });

    list.sort((a, b) => {
      const dir = filters.sortOrder === 'asc' ? 1 : -1;

      if (filters.sortBy === 'date')
        return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (filters.sortBy === 'amount')
        return dir * (a.billing_data.grandTotal - b.billing_data.grandTotal);
      return dir * a.patient.name.localeCompare(b.patient.name);
    });

    return list;
  }, [transactions, deferredSearch, filters]);
};

// ==================== DERIVED FINANCIALS HOOK ====================

export const useDerivedFinancials = (
  transaction: MockTransaction | null
): DerivedFinancials | null => {
  return useMemo(() => {
    if (!transaction) return null;

    const refunded = sumProcessedRefundAmount(transaction);
    const totalPaid = transaction.billing_data.totalPaid;
    const grandTotal = transaction.billing_data.grandTotal;

    const netPaid = Math.max(0, totalPaid - refunded);
    const balanceDue = Math.max(0, grandTotal - netPaid);

    return {
      refunded,
      netPaid,
      balanceDue,
      refundableMax: netPaid,
      status: deriveStatus(transaction),
    };
  }, [transaction]);
};

// ==================== REFUND FORM HOOK ====================

export const useRefundForm = (
  selectedTransaction: MockTransaction | null,
  derivedFinancials: DerivedFinancials | null,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) => {
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundForm, setRefundForm] = useState<RefundFormState>({
    method: 'cash',
    reference: '',
    reason: '',
    processedBy: 'Admin User',
    qtyByItem: {},
  });

  const selectedRefundedQtyMap = useMemo(() => {
    if (!selectedTransaction) return new Map<number, number>();
    return getRefundedQtyMap(selectedTransaction);
  }, [selectedTransaction]);

  const refundComputed = useMemo(() => {
    if (!selectedTransaction) return { items: [], total: 0 };
    return computeRefundFromQuantities(selectedTransaction, refundForm.qtyByItem);
  }, [refundForm.qtyByItem, selectedTransaction]);

  const resetRefundForm = useCallback(() => {
    setRefundForm({
      method: 'cash',
      reference: '',
      reason: '',
      processedBy: 'Admin User',
      qtyByItem: {},
    });
  }, []);

  const openRefundModal = useCallback(() => {
    if (!selectedTransaction) return;
    if (selectedTransaction.voided) {
      showToast('Cannot refund a voided transaction.', 'error');
      return;
    }
    resetRefundForm();
    setRefundOpen(true);
  }, [resetRefundForm, selectedTransaction, showToast]);

  const closeRefundModal = useCallback(() => {
    setRefundOpen(false);
  }, []);

  const updateRefundField = useCallback(
    <K extends keyof RefundFormState>(key: K, value: RefundFormState[K]) => {
      setRefundForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setRefundQtySafe = useCallback(
    (chargeItemId: number, requestedQty: number) => {
      if (!selectedTransaction) return;

      const ci = selectedTransaction.charge_items.find((x) => x.id === chargeItemId);
      if (!ci) return;

      const alreadyRefundedQty = selectedRefundedQtyMap.get(chargeItemId) ?? 0;
      const refundableQty = Math.max(0, ci.quantity - alreadyRefundedQty);

      const q = Math.max(0, Math.min(refundableQty, Math.floor(requestedQty || 0)));

      setRefundForm((prev) => ({
        ...prev,
        qtyByItem: { ...prev.qtyByItem, [chargeItemId]: q },
      }));
    },
    [selectedRefundedQtyMap, selectedTransaction]
  );

  const selectAllRefundable = useCallback(() => {
    if (!selectedTransaction) return;
    const next: Record<number, number> = {};

    for (const ci of selectedTransaction.charge_items) {
      const alreadyRefundedQty = selectedRefundedQtyMap.get(ci.id) ?? 0;
      const refundableQty = Math.max(0, ci.quantity - alreadyRefundedQty);
      if (refundableQty > 0) next[ci.id] = refundableQty;
    }

    setRefundForm((prev) => ({ ...prev, qtyByItem: next }));
  }, [selectedRefundedQtyMap, selectedTransaction]);

  const clearRefundSelection = useCallback(() => {
    setRefundForm((prev) => ({ ...prev, qtyByItem: {} }));
  }, []);

  /**
   * Handler: Submit refund
   * Backend integration point: Replace with API call to process refund
   */
  const submitRefund = useCallback(
    (onSuccess: (record: RefundRecord) => void) => {
      if (!selectedTransaction || !derivedFinancials) return;

      const errors: string[] = [];

      if (selectedTransaction.voided)
        errors.push('This transaction is voided. Refunds are not allowed.');
      if (!refundForm.reason.trim()) errors.push('Refund reason is required.');
      if (
        (refundForm.method === 'card' || refundForm.method === 'mobile') &&
        !refundForm.reference.trim()
      ) {
        errors.push('Reference is required for card/mobile refunds.');
      }

      if (refundComputed.items.length === 0) {
        errors.push('Select at least one item quantity to refund.');
      }

      for (const li of refundComputed.items) {
        const ci = selectedTransaction.charge_items.find((x) => x.id === li.charge_item_id);
        if (!ci) {
          errors.push('Invalid refund item selected.');
          continue;
        }
        const alreadyRefundedQty = selectedRefundedQtyMap.get(li.charge_item_id) ?? 0;
        const refundableQty = Math.max(0, ci.quantity - alreadyRefundedQty);
        if (li.quantity_refunded > refundableQty) {
          errors.push(
            `Refund qty too high for ${ci.service.name}. Max refundable: ${refundableQty}`
          );
        }
      }

      if (refundComputed.total <= 0) errors.push('Refund total must be greater than 0.');
      if (refundComputed.total > derivedFinancials.refundableMax) {
        errors.push(
          `Refund exceeds refundable maximum (Net Paid: ${derivedFinancials.refundableMax}).`
        );
      }

      if (errors.length) {
        showToast(errors[0], 'error');
        return;
      }

      const now = new Date();
      const record: RefundRecord = {
        id: `RFD-${Date.now()}`,
        refund_receipt_number: `REF-${now.getFullYear()}${String(selectedTransaction.id).padStart(
          4,
          '0'
        )}-${String((selectedTransaction.refunds?.length ?? 0) + 1).padStart(2, '0')}`,
        created_at: isoNow(),
        processed_by: refundForm.processedBy,
        method: refundForm.method,
        reference: refundForm.reference.trim() || undefined,
        reason: refundForm.reason.trim(),
        status: 'processed',
        items: refundComputed.items,
        total_amount: refundComputed.total,
      };

      // Backend integration: API call here
      // await api.processRefund(selectedTransaction.id, record);

      onSuccess(record);
      setRefundOpen(false);
    },
    [
      derivedFinancials,
      refundComputed.items,
      refundComputed.total,
      refundForm,
      selectedRefundedQtyMap,
      selectedTransaction,
      showToast,
    ]
  );

  return {
    refundOpen,
    refundForm,
    refundComputed,
    selectedRefundedQtyMap,
    openRefundModal,
    closeRefundModal,
    updateRefundField,
    setRefundQtySafe,
    selectAllRefundable,
    clearRefundSelection,
    submitRefund,
  };
};


// utils/refundCalculations.ts

export interface RefundCalculationResult {
  refundItemsSubtotal: number;
  refundProportionalDiscount: number;
  refundTaxableAmount: number;
  refundTaxAmount: number;
  totalRefundAmount: number;
  breakdown: {
    itemsTotal: number;
    discountAllocated: number;
    taxesAllocated: number;
  };
}

export function calculatePartialRefundAmount(
  selectedItems: RefundableLineItem[],
  originalTransaction: BillingReviewItem
): RefundCalculationResult {
  const billingData = originalTransaction.billing_data;
  
  // Step 1: Calculate refund items' raw subtotal
  const refundItemsSubtotal = selectedItems.reduce((sum, item) => 
    sum + (item.quantity * item.unit_price), 0
  );
  
  // Step 2: Calculate proportional discount
  const originalSubtotal = billingData.subtotal;
  const originalDiscountAmount = billingData.discountAmount || 0;
  
  // Proportional discount allocation
  const discountRate = originalSubtotal > 0 
    ? originalDiscountAmount / originalSubtotal 
    : 0;
  const refundProportionalDiscount = refundItemsSubtotal * discountRate;
  
  // Step 3: Calculate taxable amount for refund
  const refundTaxableAmount = refundItemsSubtotal - refundProportionalDiscount;
  
  // Step 4: Calculate proportional tax
  const refundTaxAmount = (billingData.taxes || []).reduce((sum, tax) => {
    const taxRate = tax.rate / 100;
    return sum + (refundTaxableAmount * taxRate);
  }, 0);
  
  // Step 5: Final refund amount
  const totalRefundAmount = refundTaxableAmount + refundTaxAmount;
  
  return {
    refundItemsSubtotal,
    refundProportionalDiscount,
    refundTaxableAmount,
    refundTaxAmount,
    totalRefundAmount,
    breakdown: {
      itemsTotal: refundItemsSubtotal,
      discountAllocated: refundProportionalDiscount,
      taxesAllocated: refundTaxAmount,
    }
  };
}

export function calculateFullRefundAmount(
  originalTransaction: BillingReviewItem
): number {
  // Full refund = exactly what customer paid
  return originalTransaction.billing_data.grandTotal;
}


// ==================== EMAIL FORM HOOK ====================

export const useEmailForm = (
  selectedTransaction: MockTransaction | null,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) => {
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailForm, setEmailForm] = useState<EmailFormState>({
    to: '',
    subject: '',
    note: '',
    sending: false,
  });

  const openEmailModal = useCallback(() => {
    if (!selectedTransaction) return;
    const defaultTo = selectedTransaction.patient.email ?? '';
    setEmailForm({
      to: defaultTo,
      subject: `Receipt ${selectedTransaction.receipt_number}`,
      note: '',
      sending: false,
    });
    setEmailOpen(true);
  }, [selectedTransaction]);

  const closeEmailModal = useCallback(() => {
    setEmailOpen(false);
  }, []);

  const updateEmailField = useCallback(
    <K extends keyof EmailFormState>(key: K, value: EmailFormState[K]) => {
      setEmailForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Handler: Submit email
   * Backend integration point: Replace with API call to send email
   */
  const submitEmail = useCallback(async () => {
    if (!selectedTransaction) return;

    const to = emailForm.to.trim();
    if (!to || !to.includes('@')) {
      showToast('Enter a valid email address.', 'error');
      return;
    }

    setEmailForm((prev) => ({ ...prev, sending: true }));
    try {
      // Backend integration: API call here
      // await api.sendReceiptEmail(selectedTransaction.id, { to, subject, note });
      
      await new Promise((res) => setTimeout(res, 1200)); // Mock delay
      showToast(`Receipt emailed to ${to}`, 'success');
      setEmailOpen(false);
    } catch {
      showToast('Failed to send receipt email.', 'error');
    } finally {
      setEmailForm((prev) => ({ ...prev, sending: false }));
    }
  }, [emailForm.to, selectedTransaction, showToast]);

  return {
    emailOpen,
    emailForm,
    openEmailModal,
    closeEmailModal,
    updateEmailField,
    submitEmail,
  };
};

// ==================== VOID FORM HOOK ====================

export const useVoidForm = (
  selectedTransaction: MockTransaction | null,
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
) => {
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidForm, setVoidForm] = useState<VoidFormState>({
    reason: '',
    voidedBy: 'Admin User',
  });

  const openVoidModal = useCallback(() => {
    if (!selectedTransaction) return;
    setVoidForm({ reason: '', voidedBy: 'Admin User' });
    setVoidOpen(true);
  }, [selectedTransaction]);

  const closeVoidModal = useCallback(() => {
    setVoidOpen(false);
  }, []);

  const updateVoidField = useCallback(
    <K extends keyof VoidFormState>(key: K, value: VoidFormState[K]) => {
      setVoidForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Handler: Submit void
   * Backend integration point: Replace with API call to void transaction
   */
  const submitVoid = useCallback(
    (onSuccess: (voided: VoidRecord) => void) => {
      if (!selectedTransaction) return;

      const reason = voidForm.reason.trim();
      if (!reason) {
        showToast('Void reason is required.', 'error');
        return;
      }
      if (selectedTransaction.voided) {
        showToast('This transaction is already voided.', 'error');
        return;
      }

      const voided: VoidRecord = {
        voided_at: isoNow(),
        voided_by: voidForm.voidedBy,
        reason,
      };

      // Backend integration: API call here
      // await api.voidTransaction(selectedTransaction.id, voided);

      onSuccess(voided);
      setVoidOpen(false);
    },
    [selectedTransaction, showToast, voidForm]
  );

  return {
    voidOpen,
    voidForm,
    openVoidModal,
    closeVoidModal,
    updateVoidField,
    submitVoid,
  };
};