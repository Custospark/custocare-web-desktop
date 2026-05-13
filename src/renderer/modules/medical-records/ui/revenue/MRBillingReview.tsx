// MRBillingReview.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { TransactionList } from './billing-review/components/TransactionList';
import { ReceiptView } from './billing-review/components/ReceiptView';
import { EmailModal, RefundModal, VoidModal } from './billing-review/components/Modals';
import LineItemHistoryModal from './billing-review/components/receipt-action-modals/LineItemHistoryModal';
import BillingHistoryModal from './billing-review/components/receipt-action-modals/BillingHistoryModal';
import { useGetBillingReview } from '../../api/billing-review/BillingReviewQueries';
import type { BillingReviewItem, BillingCycleStatus, ChargeItem } from '../../api/billing-review/BillingReviewTypes';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { AlertCircle, LayoutGrid, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../../../app/store/contexts/toast/useToast';

interface FilterState {
  searchTerm: string;
  statusFilter: BillingCycleStatus | 'all';
  dateRange: { start: string; end: string };
  sortBy: 'date' | 'amount' | 'patient';
  sortOrder: 'asc' | 'desc';
  showAdvancedFilters: boolean;
}

interface MRBillingReviewProps {
  theme?: 'light' | 'dark';
}

type ActiveModal = 'email' | 'refund' | 'void' | null;

type EnrichedBillingReviewItem = BillingReviewItem & {
  date: string;
  time: string;
};

const INITIAL_FILTERS: FilterState = {
  searchTerm: '',
  statusFilter: 'all',
  dateRange: { start: '', end: '' },
  sortBy: 'date',
  sortOrder: 'desc',
  showAdvancedFilters: false,
};

export const MRBillingReview: React.FC<MRBillingReviewProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();

  const {
    data: billingResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetBillingReview({
    per_page: 50,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

    const transactions = useMemo<EnrichedBillingReviewItem[]>(() => {
      if (!billingResponse?.data.items) return [];

      return billingResponse.data.items.map((item) => ({
        ...item,
        date: item.created_at?.split('T')[0] || '',
        time: new Date(item.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        charge_items: item.charge_items?.map((chargeItem: any) => ({
          ...chargeItem,
          service_key: chargeItem.service_key || chargeItem.code || chargeItem.id || '',
        })) || [],
        // Transform refunded_items if needed
        refunded_items: item.refunded_items?.map((refundedItem: any) => ({
          ...refundedItem,
          refunded: true, // Ensure refunded is always true as per type requirement
        })) || [],
      }));
    }, [billingResponse]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [mobileView, setMobileView] = useState<'list' | 'receipt'>('list');

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [modalTransaction, setModalTransaction] = useState<EnrichedBillingReviewItem | null>(null);

  // New states for history modals
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lineItemHistoryOpen, setLineItemHistoryOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ChargeItem | null>(null);

  const selectedTransaction = useMemo(
    () => transactions.find((t) => t.visit_uuid === selectedId) || null,
    [transactions, selectedId]
  );

  useEffect(() => {
    if (!selectedId && transactions.length > 0) {
      setSelectedId(transactions[0].visit_uuid);
    }
  }, [selectedId, transactions]);

  const handleSelectTransaction = useCallback((id: string) => {
    setSelectedId(id);

    if (window.innerWidth < 1024) {
      setMobileView('receipt');
    }
  }, []);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.patient_name.toLowerCase().includes(searchLower) ||
          t.patient_number.toLowerCase().includes(searchLower) ||
          t.receipt_number?.toLowerCase().includes(searchLower) ||
          t.visit_uuid.toLowerCase().includes(searchLower)
      );
    }

    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.billing_status === filters.statusFilter);
    }

    if (filters.dateRange.start) {
      filtered = filtered.filter((t) => t.date >= filters.dateRange.start);
    }

    if (filters.dateRange.end) {
      filtered = filtered.filter((t) => t.date <= filters.dateRange.end);
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'amount':
          comparison = a.billing_data.grandTotal - b.billing_data.grandTotal;
          break;
        case 'patient':
          comparison = a.patient_name.localeCompare(b.patient_name);
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, filters]);

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      showToast('success', 'Billing records refreshed successfully.', 2500);
    } catch {
      showToast('error', 'Failed to refresh billing records.', 4000);
    }
  }, [refetch, showToast]);

  const handleModalSuccess = useCallback(async () => {
    setActiveModal(null);
    await handleRefresh();
  }, [handleRefresh]);

  const openModal = useCallback(
    (type: Exclude<ActiveModal, null>) => {
      if (!selectedTransaction) {
        showToast('error', 'Select a transaction first.', 2500);
        return;
      }

      setModalTransaction(selectedTransaction);
      setActiveModal(type);
    },
    [selectedTransaction, showToast]
  );

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  // New handlers for history modals
  const openBillingHistory = useCallback(() => {
    if (!selectedTransaction) {
      showToast('error', 'Select a transaction first.', 2500);
      return;
    }

    setHistoryOpen(true);
  }, [selectedTransaction, showToast]);

  const closeBillingHistory = useCallback(() => {
    setHistoryOpen(false);
  }, []);

  const openLineItemHistory = useCallback((item: ChargeItem) => {
    setSelectedHistoryItem(item);
    setLineItemHistoryOpen(true);
  }, []);

  const closeLineItemHistory = useCallback(() => {
    setLineItemHistoryOpen(false);
    setTimeout(() => setSelectedHistoryItem(null), 180);
  }, []);

  useEffect(() => {
    if (!activeModal) {
      const timer = window.setTimeout(() => {
        setModalTransaction(null);
      }, 180);

      return () => window.clearTimeout(timer);
    }
  }, [activeModal]);

  const handlePrint = useCallback(() => {
    if (!selectedTransaction) {
      showToast('error', 'No transaction selected.', 2500);
      return;
    }

    showToast('info', 'Receipt sent to the print queue.', 2500);
  }, [selectedTransaction, showToast]);

  const handleEmailSubmit = useCallback(
    async (_payload: { email: string; message: string }) => {
      console.log(_payload)
      showToast('info', 'Email sending will be wired to backend next.', 4000);
      setActiveModal(null);
    },
    [showToast]
  );

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      secondary: isDark ? 'bg-gray-800' : 'bg-white',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
      selected: isDark ? 'bg-gray-700' : 'bg-blue-50',
      stripe: isDark ? 'bg-gray-800/30' : 'bg-gray-50/50',
      stripeAlt: isDark ? 'bg-gray-900/50' : 'bg-white/50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
      muted: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
      subtle: isDark ? 'border-gray-600' : 'border-gray-100',
    },
    ring: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
    },
  };

  const pillBg = isDark ? 'bg-gray-700' : 'bg-gray-100';

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="table" theme={theme} message="Loading billing records..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex h-full items-center justify-center ${colors.bg.primary} p-8`}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
          <div className={`mb-4 inline-block rounded-xl p-4 ${isDark ? 'bg-red-900/20' : 'bg-red-100'}`}>
            <AlertCircle className={`h-12 w-12 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>

          <h3 className={`mb-2 text-lg font-bold ${colors.text.primary}`}>
            Error Loading Billing Records
          </h3>

          <p className={`text-sm ${colors.text.secondary}`}>
            {error.message || 'An unexpected error occurred. Please try again later.'}
          </p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
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

      <div className="no-print mb-4 lg:hidden">
        <div className={`flex items-center gap-2 rounded-xl border p-1 ${colors.border.primary} ${colors.bg.elevated}`}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setMobileView('list')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              mobileView === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark
                ? 'text-gray-200 hover:bg-gray-700'
                : 'text-gray-900 hover:bg-gray-100'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            Records ({filteredTransactions.length})
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setMobileView('receipt')}
            disabled={!selectedId}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
              mobileView === 'receipt'
                ? 'bg-blue-600 text-white shadow-sm'
                : !selectedId
                ? isDark
                  ? 'cursor-not-allowed text-gray-600'
                  : 'cursor-not-allowed text-gray-400'
                : isDark
                ? 'text-gray-200 hover:bg-gray-700'
                : 'text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Receipt className="h-4 w-4" />
            Receipt
          </motion.button>
        </div>
      </div>

      <div className="grid h-[calc(100%-4rem)] grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
        <motion.div
          className={`${mobileView === 'list' ? 'hidden md:block' : 'block'} md:block`}
          layout
          transition={{ duration: 0.2 }}
        >
          <div>
            {selectedTransaction ? (
              <ReceiptView
                selectedTransaction={selectedTransaction}
                theme={theme}
                colors={colors}
                onPrint={handlePrint}
                onEmail={() => openModal('email')}
                onRefund={() => openModal('refund')}
                onVoid={() => openModal('void')}
                onHistory={openBillingHistory}
                onLineItemHistory={openLineItemHistory}
              />
            ) : (
              <div className={`flex min-h-[400px] h-full flex-col items-center justify-center rounded-xl border p-8 text-center ${colors.border.primary} ${colors.bg.secondary}`}>
                <Receipt className={`mb-4 h-16 w-16 ${colors.text.tertiary}`} />
                <h3 className={`mb-2 text-lg font-semibold ${colors.text.primary}`}>
                  No Transaction Selected
                </h3>
                <p className={`text-sm ${colors.text.secondary}`}>
                  Select a transaction from the list to view receipt details.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className={`${mobileView === 'receipt' ? 'hidden md:block' : 'block'} md:block h-full`}
          layout
          transition={{ duration: 0.2 }}
        >
          <div className="sticky top-0 h-[calc(100vh-10rem)] overflow-hidden rounded-xl">
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
              onRefresh={handleRefresh}
              isRefreshing={isFetching}
            />
          </div>
        </motion.div>
      </div>

      <RefundModal
        open={activeModal === 'refund'}
        selectedTransaction={modalTransaction}
        theme={theme}
        colors={colors}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
      />

      <EmailModal
        open={activeModal === 'email'}
        selectedTransaction={modalTransaction}
        theme={theme}
        colors={colors}
        onClose={closeModal}
        onSubmit={handleEmailSubmit}
      />

      <VoidModal
        open={activeModal === 'void'}
        selectedTransaction={modalTransaction}
        theme={theme}
        colors={colors}
        onClose={closeModal}
        onSuccess={handleModalSuccess}
      />

      <BillingHistoryModal
        open={historyOpen}
        onClose={closeBillingHistory}
        theme={theme}
        title={selectedTransaction ? `${selectedTransaction.receipt_number || 'Billing Cycle'} History` : 'Billing History'}
        logs={selectedTransaction?.audit_logs || []}
      />

      <LineItemHistoryModal
        open={lineItemHistoryOpen}
        onClose={closeLineItemHistory}
        theme={theme}
        itemName={selectedHistoryItem?.service?.name}
        logs={selectedHistoryItem?.audit_logs || []}
      />
    </div>
  );
};

export default MRBillingReview;