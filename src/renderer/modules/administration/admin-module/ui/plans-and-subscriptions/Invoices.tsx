import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  Ban,
  RotateCcw,
  DollarSign,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useGetFacilityInvoices } from '../../api/subscriptions/SubscriptionQueries';
import {
  type Invoice,
  InvoiceStatus,
  InvoiceType,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
} from '../../api/subscriptions/SubscriptionTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../shared/types/cn';
import PrintableInvoiceReceipt from './PrintableInvoiceReceipt';

interface InvoicesProps {
  theme: 'light' | 'dark';
}

interface InvoiceFilters {
  status: InvoiceStatus | 'all';
  invoice_type: InvoiceType | 'all';
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface BadgeConfig {
  icon: React.FC<{ className?: string }>;
  bg: string;
  text: string;
  border: string;
}

const InvoiceStatusBadge: React.FC<{ status: InvoiceStatus | string; theme: 'light' | 'dark'; size?: 'sm' | 'md' }> = ({
  status, theme, size = 'md',
}) => {
  const isDark = theme === 'dark';

  const getConfig = (): BadgeConfig => {
    switch (status) {
      case InvoiceStatus.PAID:
        return { icon: CheckCircle, bg: isDark ? 'bg-green-900/30' : 'bg-green-100', text: isDark ? 'text-green-300' : 'text-green-700', border: isDark ? 'border-green-800' : 'border-green-200' };
      case InvoiceStatus.UNPAID:
        return { icon: Clock, bg: isDark ? 'bg-yellow-900/30' : 'bg-yellow-100', text: isDark ? 'text-yellow-300' : 'text-yellow-700', border: isDark ? 'border-yellow-800' : 'border-yellow-200' };
      case InvoiceStatus.OVERDUE:
        return { icon: AlertTriangle, bg: isDark ? 'bg-red-900/30' : 'bg-red-100', text: isDark ? 'text-red-300' : 'text-red-700', border: isDark ? 'border-red-800' : 'border-red-200' };
      case InvoiceStatus.PARTIALLY_PAID:
        return { icon: DollarSign, bg: isDark ? 'bg-blue-900/30' : 'bg-blue-100', text: isDark ? 'text-blue-300' : 'text-blue-700', border: isDark ? 'border-blue-800' : 'border-blue-200' };
      case InvoiceStatus.CANCELLED:
        return { icon: Ban, bg: isDark ? 'bg-gray-800' : 'bg-gray-100', text: isDark ? 'text-gray-400' : 'text-gray-600', border: isDark ? 'border-gray-700' : 'border-gray-200' };
      case InvoiceStatus.REFUNDED:
        return { icon: RotateCcw, bg: isDark ? 'bg-purple-900/30' : 'bg-purple-100', text: isDark ? 'text-purple-300' : 'text-purple-700', border: isDark ? 'border-purple-800' : 'border-purple-200' };
      default:
        return { icon: AlertTriangle, bg: isDark ? 'bg-gray-800' : 'bg-gray-100', text: isDark ? 'text-gray-400' : 'text-gray-600', border: isDark ? 'border-gray-700' : 'border-gray-200' };
    }
  };

  const c = getConfig();
  const Icon = c.icon;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full font-medium border', sizeClass, c.bg, c.text, c.border)}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {INVOICE_STATUS_LABELS[status as InvoiceStatus] || String(status)}
    </span>
  );
};

interface InvoiceDetailModalProps {
  theme: 'light' | 'dark';
  invoice: Invoice;
  onClose: () => void;
  onViewReceipt: (invoice: Invoice) => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ theme, invoice, onClose, onViewReceipt }) => {
  const isDark = theme === 'dark';
  const isOverdue = invoice.status === InvoiceStatus.OVERDUE;
  const isUnpaid = invoice.status === InvoiceStatus.UNPAID || invoice.status === InvoiceStatus.OVERDUE;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn('relative rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}
      >
        <div className={cn('sticky top-0 z-10 p-6 border-b flex items-start justify-between', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-xl', isDark ? 'bg-blue-500/20' : 'bg-blue-100')}>
              <FileText className={cn('w-6 h-6', isDark ? 'text-blue-400' : 'text-blue-600')} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">{invoice.invoice_number}</h2>
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                {INVOICE_TYPE_LABELS[invoice.invoice_type as InvoiceType] || invoice.invoice_type_label}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isOverdue && (
            <div className={cn('p-4 rounded-xl border flex items-start gap-3', isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200')}>
              <AlertTriangle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-red-400' : 'text-red-600')} />
              <p className={cn('text-sm font-medium', isDark ? 'text-red-200' : 'text-red-800')}>
                This invoice is overdue. Please make payment immediately to avoid service interruption.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Amount', value: `${invoice.amount.toLocaleString()} ${invoice.currency}`, large: true, highlight: false },
              { label: 'Paid Amount', value: `${invoice.paid_amount.toLocaleString()} ${invoice.currency}`, large: false, highlight: false },
              ...(isUnpaid ? [{ label: 'Balance Due', value: `${invoice.balance_due.toLocaleString()} ${invoice.currency}`, large: false, highlight: true }] : []),
              { label: 'Status', value: <InvoiceStatusBadge status={invoice.status} theme={theme} size="sm" />, large: false, highlight: false },
              { label: 'Invoice Type', value: INVOICE_TYPE_LABELS[invoice.invoice_type as InvoiceType] || invoice.invoice_type_label, large: false, highlight: false },
              { label: 'Issued', value: invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : 'N/A', large: false, highlight: false },
              { label: 'Due Date', value: invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : 'N/A', large: false, highlight: false },
              ...(invoice.paid_at ? [{ label: 'Paid On', value: new Date(invoice.paid_at).toLocaleDateString(), large: false, highlight: false }] : []),
            ].map((item, i) => (
              <div key={i} className={cn('p-4 rounded-xl', item.highlight ? (isDark ? 'bg-amber-900/20 border border-amber-700/30' : 'bg-amber-50 border border-amber-200') : isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>{item.label}</p>
                <p className={cn('font-medium', item.large ? 'text-2xl font-bold' : '', item.highlight ? 'text-amber-600 dark:text-amber-400' : '')}>
                  {item.value as React.ReactNode}
                </p>
              </div>
            ))}
          </div>

          {invoice.description && (
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Description</p>
              <p className="text-sm">{invoice.description}</p>
            </div>
          )}

          {invoice.line_items && invoice.line_items.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Line Items</h3>
              <div className={cn('rounded-xl border overflow-hidden', isDark ? 'border-gray-800' : 'border-gray-200')}>
                <table className="w-full text-sm">
                  <thead className={cn(isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">Description</th>
                      <th className="text-right px-4 py-2.5 font-medium">Qty</th>
                      <th className="text-right px-4 py-2.5 font-medium">Unit Price</th>
                      <th className="text-right px-4 py-2.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className={cn('divide-y', isDark ? 'divide-gray-800' : 'divide-gray-100')}>
                    {invoice.line_items.map((item, idx) => (
                      <tr key={idx}>
                        <td className={cn('px-4 py-2.5', isDark ? 'text-gray-300' : 'text-gray-700')}>{item.description}</td>
                        <td className="text-right px-4 py-2.5">{item.quantity}</td>
                        <td className="text-right px-4 py-2.5">{item.unit_price.toLocaleString()}</td>
                        <td className="text-right px-4 py-2.5 font-medium">{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className={cn(isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                    <tr>
                      <td colSpan={3} className="text-right px-4 py-2.5 font-semibold">Total</td>
                      <td className="text-right px-4 py-2.5 font-bold">{invoice.amount.toLocaleString()} {invoice.currency}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {invoice.facility && (
            <div className={cn('flex items-center gap-3 p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <Building2 className={cn('w-5 h-5', isDark ? 'text-gray-400' : 'text-gray-500')} />
              <div>
                <p className="font-medium">{invoice.facility.facility_name || 'Facility'}</p>
                <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Code: {invoice.facility.facility_code || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>

        <div className={cn('sticky bottom-0 p-6 border-t flex justify-between gap-3', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <button
            onClick={onClose}
            className={cn('px-4 py-2 rounded-lg font-medium', isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
          >
            Close
          </button>
          <button
            onClick={() => onViewReceipt(invoice)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4" />
            View Receipt
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Invoices: React.FC<InvoicesProps> = ({ theme }) => {
  const isDark = theme === 'dark';

  const [filters, setFilters] = useState<InvoiceFilters>({
    status: 'all', invoice_type: 'all', dateFrom: '', dateTo: '', search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const {
    data: invoicesResponse, isLoading, error, refetch,
  } = useGetFacilityInvoices({ per_page: 100 });

  const invoices = useMemo(() => invoicesResponse?.data || [], [invoicesResponse]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv: Invoice) => {
      if (filters.status !== 'all' && inv.status !== filters.status) return false;
      if (filters.invoice_type !== 'all' && inv.invoice_type !== filters.invoice_type) return false;
      if (filters.dateFrom && inv.issued_at && new Date(inv.issued_at) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && inv.issued_at && new Date(inv.issued_at) > new Date(filters.dateTo)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          inv.invoice_number.toLowerCase().includes(q) ||
          inv.description?.toLowerCase().includes(q) ||
          inv.amount.toString().includes(q)
        );
      }
      return true;
    });
  }, [invoices, filters]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const handleClearFilters = () => {
    setFilters({ status: 'all', invoice_type: 'all', dateFrom: '', dateTo: '', search: '' });
    setCurrentPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== 'all' && v !== '').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading invoices…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-2xl p-10 text-center border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
        <div className={cn('w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center', isDark ? 'bg-red-900/30' : 'bg-red-100')}>
          <X className={cn('w-8 h-8', isDark ? 'text-red-400' : 'text-red-600')} />
        </div>
        <h3 className="text-lg font-bold mb-2">Failed to Load Invoices</h3>
        <p className={cn('mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {error.message || 'Unable to fetch invoices. Please try again.'}
        </p>
        <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Invoices</h1>
          <p className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}>
            View and download invoices for your subscription and payments
          </p>
        </div>
      </div>

      <div className={cn('rounded-xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
            <input
              type="text"
              placeholder="Search by invoice number or description…"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className={cn('w-full pl-10 pr-4 py-2.5 rounded-lg border', isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400', 'focus:outline-none focus:ring-2 focus:ring-blue-500')}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn('px-4 py-2.5 rounded-lg font-medium inline-flex items-center gap-2 border transition-all', showFilters ? isDark ? 'bg-blue-900/30 border-blue-700 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700' : isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100')}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">{activeFilterCount}</span>}
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className={cn('px-3 py-2.5 rounded-lg border appearance-none', isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900', 'focus:outline-none focus:ring-2 focus:ring-blue-500')}
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className={cn('p-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', isDark ? 'border-gray-800' : 'border-gray-200')}>
                <div>
                  <label className={cn('block text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Status</label>
                  <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as InvoiceStatus | 'all' }))}
                    className={cn('w-full px-3 py-2 rounded-lg border', isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900', 'focus:outline-none focus:ring-2 focus:ring-blue-500')}>
                    <option value="all">All Statuses</option>
                    {Object.values(InvoiceStatus).map(s => (
                      <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cn('block text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Type</label>
                  <select value={filters.invoice_type} onChange={(e) => setFilters(prev => ({ ...prev, invoice_type: e.target.value as InvoiceType | 'all' }))}
                    className={cn('w-full px-3 py-2 rounded-lg border', isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900', 'focus:outline-none focus:ring-2 focus:ring-blue-500')}>
                    <option value="all">All Types</option>
                    {Object.values(InvoiceType).map(t => (
                      <option key={t} value={t}>{INVOICE_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={cn('block text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>From Date</label>
                  <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className={cn('w-full px-3 py-2 rounded-lg border', isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900', 'focus:outline-none focus:ring-2 focus:ring-blue-500')} />
                </div>
                <div>
                  <label className={cn('block text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>To Date</label>
                  <input type="date" value={filters.dateTo} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className={cn('w-full px-3 py-2 rounded-lg border', isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900', 'focus:outline-none focus:ring-2 focus:ring-blue-500')} />
                </div>
              </div>
              <div className={cn('px-4 pb-4 flex justify-end', isDark ? 'text-gray-400' : 'text-gray-500')}>
                <button onClick={handleClearFilters} className="text-sm hover:underline">
                  Clear all filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className={cn('rounded-2xl p-16 text-center border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <FileText className={cn('w-16 h-16 mx-auto mb-4', isDark ? 'text-gray-600' : 'text-gray-300')} />
          <h3 className="text-lg font-bold mb-2">No Invoices Found</h3>
          <p className={cn('mb-6', isDark ? 'text-gray-400' : 'text-gray-500')}>
            {activeFilterCount > 0
              ? 'No invoices match your current filters. Try adjusting them.'
              : 'You have no invoices yet. Invoices will appear here once your subscription is active and billing cycles begin.'}
          </p>
          {activeFilterCount > 0 && (
            <button onClick={handleClearFilters} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={cn('rounded-xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={cn('border-b', isDark ? 'bg-gray-800/50 border-gray-800' : 'bg-gray-50 border-gray-200')}>
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Invoice</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Type</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold">Amount</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold">Paid</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Issued</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold">Due</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', isDark ? 'divide-gray-800' : 'divide-gray-100')}>
                  {paginatedInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className={cn(
                        'transition-colors cursor-pointer',
                        isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
                        inv.status === InvoiceStatus.OVERDUE ? (isDark ? 'bg-red-900/5' : 'bg-red-50/50') : '',
                      )}
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn('p-1.5 rounded-lg', isDark ? 'bg-gray-800' : 'bg-gray-100')}>
                            <FileText className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{inv.invoice_number}</p>
                            {inv.description && (
                              <p className={cn('text-xs truncate max-w-[200px]', isDark ? 'text-gray-500' : 'text-gray-400')}>{inv.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                          {INVOICE_TYPE_LABELS[inv.invoice_type as InvoiceType] || inv.invoice_type_label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <InvoiceStatusBadge status={inv.status} theme={theme} size="sm" />
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-sm">
                        {inv.amount.toLocaleString()} {inv.currency}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={cn(
                          'text-sm font-medium',
                          inv.status === InvoiceStatus.PAID ? 'text-green-600 dark:text-green-400' : '',
                          inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.OVERDUE ? (isDark ? 'text-gray-500' : 'text-gray-400') : '',
                        )}>
                          {inv.paid_amount > 0 ? `${inv.paid_amount.toLocaleString()} ${inv.currency}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-600')}>
                          {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('text-sm inline-flex items-center gap-1', inv.status === InvoiceStatus.OVERDUE ? 'text-red-600 dark:text-red-400 font-medium' : isDark ? 'text-gray-300' : 'text-gray-600')}>
                          {inv.status === InvoiceStatus.OVERDUE && <AlertTriangle className="w-3 h-3" />}
                          {inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}
                            className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setReceiptInvoice(inv); }}
                            className={cn('p-1.5 rounded-lg transition-colors', isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}
                            title="Download receipt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className={cn('flex items-center justify-between px-2', isDark ? 'text-gray-400' : 'text-gray-500')}>
              <p className="text-sm">
                Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', currentPage === 1 ? 'opacity-50 cursor-not-allowed' : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, currentPage - 2);
                  const page = start + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors', currentPage === page ? 'bg-blue-600 text-white' : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailModal
            theme={theme}
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onViewReceipt={(inv) => { setSelectedInvoice(null); setReceiptInvoice(inv); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receiptInvoice && (
          <PrintableInvoiceReceipt
            invoice={receiptInvoice}
            theme={theme}
            onClose={() => setReceiptInvoice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invoices;
