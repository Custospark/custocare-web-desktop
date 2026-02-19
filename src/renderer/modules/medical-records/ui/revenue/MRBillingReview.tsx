// MRBillingReview.tsx
// Main component orchestrator - connects all sub-components and manages state

import React, { useEffect, useMemo, useState } from 'react';
import { MockTransaction, RefundRecord, VoidRecord } from './billing-review/types';
import {
  generateMockTransactions,
  getRefundedQtyMap,
  getThemeColors,
  formatCurrency,
} from './billing-review/utils';
import {
  useDerivedFinancials,
  useEmailForm,
  useFilteredTransactions,
  useFilters,
  useRefundForm,
  useToast,
  useVoidForm,
} from './billing-review/hooks';
import { TransactionList } from './billing-review/components/TransactionList';
import { ReceiptView } from './billing-review/components/ReceiptView';
import { EmailModal, RefundModal, Toast, VoidModal } from './billing-review/components/Modals';

/* -------------------------------- Component -------------------------------- */

interface MRBillingReviewProps {
  theme?: 'light' | 'dark';
}

export const MRBillingReview: React.FC<MRBillingReviewProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const pillBg = isDark ? 'bg-gray-700' : 'bg-gray-100';

  // ==================== STATE ====================

  /**
   * Handler: Load transactions from backend
   * Backend integration point: Replace with API call
   */
  const [transactions, setTransactions] = useState<MockTransaction[]>(() =>
    generateMockTransactions()
  );

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activePane, setActivePane] = useState<'list' | 'receipt'>('list');

  const selectedTransaction = useMemo(
    () => transactions.find((t) => t.id === selectedId) ?? null,
    [transactions, selectedId]
  );

  // ==================== HOOKS ====================

  const { toast, showToast, hideToast } = useToast();
  const { filters, deferredSearch, updateFilter, clearFilters } = useFilters();
  const filteredTransactions = useFilteredTransactions(transactions, deferredSearch, filters);
  const derivedFinancials = useDerivedFinancials(selectedTransaction);

  const selectedRefundedQtyMap = useMemo(() => {
    if (!selectedTransaction) return new Map<number, number>();
    return getRefundedQtyMap(selectedTransaction);
  }, [selectedTransaction]);

  // Refund form
  const {
    refundOpen,
    refundForm,
    refundComputed,
    selectedRefundedQtyMap: refundQtyMap,
    openRefundModal,
    closeRefundModal,
    updateRefundField,
    setRefundQtySafe,
    selectAllRefundable,
    clearRefundSelection,
    submitRefund,
  } = useRefundForm(selectedTransaction, derivedFinancials, showToast);

  // Email form
  const {
    emailOpen,
    emailForm,
    openEmailModal,
    closeEmailModal,
    updateEmailField,
    submitEmail,
  } = useEmailForm(selectedTransaction, showToast);

  // Void form
  const { voidOpen, voidForm, openVoidModal, closeVoidModal, updateVoidField, submitVoid } =
    useVoidForm(selectedTransaction, showToast);

  // ==================== EFFECTS ====================

  // Auto switch to receipt on mobile when selecting record
  useEffect(() => {
    if (selectedId != null) setActivePane('receipt');
  }, [selectedId]);

  // ==================== HANDLERS ====================

  /**
   * Handler: Process refund and update transaction
   * Backend integration point: This calls submitRefund which should call your API
   */
  const handleRefundSuccess = (record: RefundRecord) => {
    if (!selectedTransaction) return;

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === selectedTransaction.id ? { ...t, refunds: [...(t.refunds ?? []), record] } : t
      )
    );

    showToast(`Refund processed: ${formatCurrency(record.total_amount)}`, 'success');
  };

  /**
   * Handler: Void transaction and update state
   * Backend integration point: This calls submitVoid which should call your API
   */
  const handleVoidSuccess = (voided: VoidRecord) => {
    if (!selectedTransaction) return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === selectedTransaction.id ? { ...t, voided } : t))
    );

    showToast('Transaction voided.', 'success');
  };

  /**
   * Handler: Select transaction
   * Backend integration point: You might want to fetch full transaction details here
   */
  const handleSelectTransaction = (id: number) => {
    setSelectedId(id);
    // Optional: Fetch full transaction details from API
    // await api.getTransactionDetails(id);
  };

  /**
   * Handler: Print receipt (no backend call needed)
   */
  const handlePrint = () => {
    // Print happens in ReceiptView component
    // You might want to log this action
    // await api.logPrintAction(selectedId);
  };

  // ==================== RENDER ====================

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      {/* Toast */}
      <Toast toast={toast} onClose={hideToast} />

      {/* Print styles (scoped) */}
      <style>{`
        @media print {
          html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .receipt-print {
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page { margin: 10mm; }
        }
      `}</style>

      {/* Mobile Tabs */}
      <div className="no-print lg:hidden mb-4">
        <div className={`flex items-center gap-2 p-1 rounded-xl border ${colors.border.primary}`}>
          <button
            onClick={() => setActivePane('list')}
            className={`cursor-pointer flex-1 px-3 py-2 text-xs font-extrabold rounded-lg transition ${
              activePane === 'list'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'text-gray-200 hover:bg-gray-800'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            Records
          </button>
          <button
            onClick={() => setActivePane('receipt')}
            className={`cursor-pointer flex-1 px-3 py-2 text-xs font-extrabold rounded-lg transition ${
              activePane === 'receipt'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'text-gray-200 hover:bg-gray-800'
                : 'text-gray-900 hover:bg-gray-50'
            }`}
          >
            Receipt
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-full min-h-0">
        {/* Left Panel: Transaction List */}
        <div className={activePane === 'receipt' ? 'lg:flex hidden' : 'flex'}>
          <TransactionList
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            selectedId={selectedId}
            filters={filters}
            searchTerm={filters.searchTerm}
            theme={theme}
            colors={colors}
            pillBg={pillBg}
            onSelectTransaction={handleSelectTransaction}
            onUpdateFilter={updateFilter}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Right Panel: Receipt View */}
        <div className={activePane === 'list' ? 'lg:flex hidden' : 'flex'}>
          <ReceiptView
            selectedTransaction={selectedTransaction}
            derivedFinancials={derivedFinancials}
            refundedQtyMap={selectedRefundedQtyMap}
            theme={theme}
            colors={colors}
            onPrint={handlePrint}
            onEmail={openEmailModal}
            onRefund={openRefundModal}
            onVoid={openVoidModal}
          />
        </div>
      </div>

      {/* Modals */}
      <RefundModal
        open={refundOpen}
        selectedTransaction={selectedTransaction}
        derivedFinancials={derivedFinancials}
        refundForm={refundForm}
        refundComputed={refundComputed}
        selectedRefundedQtyMap={refundQtyMap}
        theme={theme}
        colors={colors}
        onClose={closeRefundModal}
        onUpdateField={updateRefundField}
        onSetQtySafe={setRefundQtySafe}
        onSelectAll={selectAllRefundable}
        onClearSelection={clearRefundSelection}
        onSubmit={() => submitRefund(handleRefundSuccess)}
      />

      <EmailModal
        open={emailOpen}
        selectedTransaction={selectedTransaction}
        emailForm={emailForm}
        theme={theme}
        colors={colors}
        onClose={closeEmailModal}
        onUpdateField={updateEmailField}
        onSubmit={submitEmail}
      />

      <VoidModal
        open={voidOpen}
        selectedTransaction={selectedTransaction}
        voidForm={voidForm}
        theme={theme}
        colors={colors}
        onClose={closeVoidModal}
        onUpdateField={updateVoidField}
        onSubmit={() => submitVoid(handleVoidSuccess)}
      />
    </div>
  );
};

export default MRBillingReview;