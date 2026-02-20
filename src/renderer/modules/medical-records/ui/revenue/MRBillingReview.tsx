// components/billing-review/MRBillingReview.tsx
import React, { useMemo, useState, useCallback, useRef, } from 'react';
import { PaymentStatus } from '../../api/billing-review/BillingReviewTypes';
import { TransactionList } from './billing-review/components/TransactionList';
import { ReceiptView } from './billing-review/components/ReceiptView';
import { EmailModal, RefundModal, Toast, VoidModal } from './billing-review/components/Modals';
import { useGetBillingReview } from '../../api/billing-review/BillingReviewQueries';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { AlertCircle, LayoutGrid, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterState {
  searchTerm: string;
  statusFilter: PaymentStatus | 'all';
  dateRange: { start: string; end: string };
  sortBy: 'date' | 'amount' | 'patient';
  sortOrder: 'asc' | 'desc';
  showAdvancedFilters: boolean;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
}

interface MRBillingReviewProps {
  theme?: 'light' | 'dark';
}

export const MRBillingReview: React.FC<MRBillingReviewProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Backend Integration with refresh capability
  const { 
    data: billingResponse, 
    isLoading, 
    error,
    refetch,
    isFetching 
  } = useGetBillingReview({
    per_page: 50,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Transform transactions with derived date/time fields
  const transactions = useMemo(() => {
    if (!billingResponse?.data.items) return [];
    return billingResponse.data.items.map(item => ({
      ...item,
      date: item.created_at.split('T')[0],
      time: new Date(item.created_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    }));
  }, [billingResponse]);

  // Core state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    statusFilter: 'all',
    dateRange: { start: '', end: '' },
    sortBy: 'date',
    sortOrder: 'desc',
    showAdvancedFilters: false,
  });

  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  // Modal states
  const [refundOpen, setRefundOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  // Mobile view state
  const [mobileView, setMobileView] = useState<'list' | 'receipt'>('list');

  // Derived state
  const selectedTransaction = useMemo(
    () => transactions.find((t) => t.visit_uuid === selectedId) ?? null,
    [transactions, selectedId]
  );

  // Auto-switch to receipt view on mobile when a transaction is selected
  const handleSelectTransaction = useCallback((id: string) => {
    setSelectedId(id);
    // On mobile, automatically switch to receipt view when selecting
    if (window.innerWidth < 1024) {
      setMobileView('receipt');
    }
  }, []);

  // Filter transactions based on current filters
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
      filtered = filtered.filter((t) => t.payment_status === filters.statusFilter);
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

  // Toast management with cleanup
  const showToastMessage = useCallback((message: string, type: ToastState['type']) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ message, type, visible: true });
    
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      showToastMessage('Data refreshed successfully', 'success');
    } catch (error) {
      console.log(error);
      showToastMessage('Failed to refresh data', 'error');
    }
  }, [refetch, showToastMessage]);

  // Action handlers
  const handlePrint = useCallback(() => {
    showToastMessage('Print Request sent to the printing queue.', 'info');
  }, [showToastMessage]);

  const handleEmail = useCallback(() => {
    setEmailOpen(true);
  }, []);

  const handleRefund = useCallback(() => {
    setRefundOpen(true);
  }, []);

  const handleVoid = useCallback(() => {
    setVoidOpen(true);
  }, []);

  const handleEmailSubmit = useCallback(() => {
    showToastMessage('Email functionality - backend integration pending', 'info');
    setEmailOpen(false);
  }, [showToastMessage]);

  const handleRefundSubmit = useCallback(() => {
    showToastMessage('Refund functionality - backend integration pending', 'info');
    setRefundOpen(false);
  }, [showToastMessage]);

  const handleVoidSubmit = useCallback(() => {
    showToastMessage('Void functionality - backend integration pending', 'info');
    setVoidOpen(false);
  }, [showToastMessage]);

  // Filter management
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

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

  // Theme colors
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
      primary: isDark ? 'bg-blue-600' : 'bg-blue-600',
      hover: isDark ? 'hover:bg-blue-700' : 'hover:bg-blue-700',
      text: 'text-white',
    },
  };

  const pillBg = isDark ? 'bg-gray-700' : 'bg-gray-100';

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton variant="detail" theme={theme} message="Loading billing records..." />;
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${colors.bg.primary} p-8`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className={`p-4 rounded-xl mb-4 inline-block ${isDark ? 'bg-red-900/20' : 'bg-red-100'}`}>
            <AlertCircle className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${colors.text.primary}`}>
            Error Loading Billing Records
          </h3>
          <p className={`text-sm ${colors.text.secondary}`}>
            {error.message || 'An unexpected error occurred. Please try again later.'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(prev => ({ ...prev, visible: false }))}
          />
        )}
      </AnimatePresence>

      {/* Print Styles */}
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

      {/* Mobile View Toggle */}
      <div className="no-print lg:hidden mb-4">
        <div className={`flex items-center gap-2 p-1 rounded-xl border ${colors.border.primary} ${colors.bg.elevated}`}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setMobileView('list')}
            className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              mobileView === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark
                ? 'text-gray-200 hover:bg-gray-700'
                : 'text-gray-900 hover:bg-gray-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Records ({filteredTransactions.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setMobileView('receipt')}
            disabled={!selectedId}
            className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              mobileView === 'receipt'
                ? 'bg-blue-600 text-white shadow-sm'
                : !selectedId
                ? isDark
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 cursor-not-allowed'
                : isDark
                ? 'text-gray-200 hover:bg-gray-700'
                : 'text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Receipt
          </motion.button>
        </div>
      </div>

      {/* Main Grid - Both panels sticky */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-[calc(100%-4rem)]">
        {/* Transaction List - Sticky with internal scrolling */}
        <motion.div 
          className={`
            ${mobileView === 'receipt' ? 'hidden lg:block' : 'block'}
            lg:block h-full
          `}
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

        {/* Receipt View - Sticky, never scrolls */}
        <motion.div 
          className={`
            ${mobileView === 'list' ? 'hidden lg:block' : 'block'}
            lg:block
          `}
          layout
          transition={{ duration: 0.2 }}
        >
          <div className="sticky top-0 h-[calc(100vh-10rem)]">
            <ReceiptView
              selectedTransaction={selectedTransaction}
              theme={theme}
              colors={colors}
              onPrint={handlePrint}
              onEmail={handleEmail}
              onRefund={handleRefund}
              onVoid={handleVoid}
            />
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <RefundModal
        open={refundOpen}
        selectedTransaction={selectedTransaction}
        theme={theme}
        colors={colors}
        onClose={() => setRefundOpen(false)}
        onSubmit={handleRefundSubmit}
      />

      <EmailModal
        open={emailOpen}
        selectedTransaction={selectedTransaction}
        theme={theme}
        colors={colors}
        onClose={() => setEmailOpen(false)}
        onSubmit={handleEmailSubmit}
      />

      <VoidModal
        open={voidOpen}
        selectedTransaction={selectedTransaction}
        theme={theme}
        colors={colors}
        onClose={() => setVoidOpen(false)}
        onSubmit={handleVoidSubmit}
      />
    </div>
  );
};

export default MRBillingReview;