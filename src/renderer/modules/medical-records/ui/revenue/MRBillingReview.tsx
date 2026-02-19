// MRBillingReview.tsx
// Main component orchestrator - connects all sub-components and manages state
// Using BillingReviewTypes.ts as the single source of truth for backend contract

import React, { useEffect, useMemo, useState } from 'react';
import { PaymentStatus } from '../../api/billing-review/BillingReviewTypes';
import { TransactionList } from './billing-review/components/TransactionList';
import { ReceiptView } from './billing-review/components/ReceiptView';
import { EmailModal, RefundModal, Toast, VoidModal } from  './billing-review/components/Modals';
import { useGetBillingReview } from '../../api/billing-review/BillingReviewQueries';

// Local types for UI state (not part of backend contract)
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
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

/* -------------------------------- Component -------------------------------- */

interface MRBillingReviewProps {
  theme?: 'light' | 'dark';
}

export const MRBillingReview: React.FC<MRBillingReviewProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  
  // ==================== BACKEND INTEGRATION ====================
  // Using the query hook from BillingReviewQueries as the single source of truth
  const { 
    data: billingResponse, 
    isLoading, 
    error 
  } = useGetBillingReview({
    per_page: 50,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Transform backend data to match our UI needs while preserving backend types
  const transactions = useMemo(() => {
    if (!billingResponse?.data.items) return [];
    return billingResponse.data.items.map(item => ({
      ...item,
      // Add UI-specific computed fields without modifying backend types
      date: item.created_at.split('T')[0],
      time: new Date(item.created_at).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      patient: {
        name: item.patient_name,
        patient_number: item.patient_number,
        email: '', // This would come from a patient details endpoint
      },
      billing_data: {
        ...item.billing_data,
        // Ensure all required fields for UI
      },
      // Initialize empty arrays for refunds/voids (these would come from separate endpoints)
      refunds: [],
      voided: null,
      settled_by: '',
    }));
  }, [billingResponse]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePane, setActivePane] = useState<'list' | 'receipt'>('list');

  const selectedTransaction = useMemo(
    () => transactions.find((t) => t.visit_uuid === selectedId) ?? null,
    [transactions, selectedId]
  );

  // ==================== LOCAL STATE ====================
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

  // ==================== FILTERING ====================
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply search
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

    // Apply status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.payment_status === filters.statusFilter);
    }

    // Apply date range
    if (filters.dateRange.start) {
      filtered = filtered.filter((t) => t.date >= filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter((t) => t.date <= filters.dateRange.end);
    }

    // Apply sorting
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

  // ==================== HANDLERS ====================
  // Non-functional handlers as requested
  const handlePrint = () => {
    setToast({
      message: 'Print functionality - backend integration pending',
      type: 'info',
      visible: true,
    });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleEmail = () => {
    setEmailOpen(true);
  };

  const handleRefund = () => {
    setRefundOpen(true);
  };

  const handleVoid = () => {
    setVoidOpen(true);
  };

  const handleEmailSubmit = () => {
    setToast({
      message: 'Email functionality - backend integration pending',
      type: 'info',
      visible: true,
    });
    setEmailOpen(false);
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleRefundSubmit = () => {
    setToast({
      message: 'Refund functionality - backend integration pending',
      type: 'info',
      visible: true,
    });
    setRefundOpen(false);
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleVoidSubmit = () => {
    setToast({
      message: 'Void functionality - backend integration pending',
      type: 'info',
      visible: true,
    });
    setVoidOpen(false);
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      dateRange: { start: '', end: '' },
      sortBy: 'date',
      sortOrder: 'desc',
      showAdvancedFilters: false,
    });
  };

  // Auto switch to receipt on mobile when selecting record
  useEffect(() => {
    if (selectedId != null) setActivePane('receipt');
  }, [selectedId]);

  // Theme colors based on the backend types
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      secondary: isDark ? 'bg-gray-800' : 'bg-white',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
      selected: isDark ? 'bg-gray-700' : 'bg-blue-50',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-400',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-200',
    },
    ring: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none',
  };

  const pillBg = isDark ? 'bg-gray-700' : 'bg-gray-100';

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading billing records...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p>Error loading billing records</p>
          <p className="text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 ${colors.bg.primary}`}>
      {/* Toast */}
      {toast.visible && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        />
      )}

      {/* Print styles */}
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
            Records ({filteredTransactions.length})
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
            onSelectTransaction={(id) => setSelectedId(id)}
            onUpdateFilter={updateFilter}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Right Panel: Receipt View */}
        <div className={activePane === 'list' ? 'lg:flex hidden' : 'flex'}>
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
      </div>

      {/* Modals - Non-functional with placeholder handlers */}
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