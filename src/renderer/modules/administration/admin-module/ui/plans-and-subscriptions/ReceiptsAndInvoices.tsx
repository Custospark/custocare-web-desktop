import React, { useMemo, useState } from 'react';
import {
  FileText,
  Search,
  Eye,
  RefreshCw,
  Receipt,
  Loader2,
} from 'lucide-react';

import {
  useGetFacilityBillingInvoices,
  useGetFacilityReceipts,
  useGetBillingInvoiceDocument,
  useGetBillingReceiptDocument,
} from '../../api/subscriptions/SubscriptionQueries';
import {
  type Invoice,
  type SubscriptionReceipt,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  InvoiceStatus,
} from '../../api/subscriptions/SubscriptionTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../shared/types/cn';
import { BillingDocumentPreviewModal } from './billing-documents/BillingDocumentPreviewModal';
import { useClientPagination } from '../../../../../shared/hooks/useClientPagination';

interface ReceiptsAndInvoicesProps {
  theme: 'light' | 'dark';
}

const ReceiptsAndInvoices: React.FC<ReceiptsAndInvoicesProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'invoices' | 'receipts'>('invoices');
  const [search, setSearch] = useState('');
  const [previewInvoiceId, setPreviewInvoiceId] = useState<number | null>(null);
  const [previewPaymentId, setPreviewPaymentId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: invoicesResp,
    isLoading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useGetFacilityBillingInvoices({ per_page: 100 });

  const {
    data: receiptsResp,
    isLoading: receiptsLoading,
    error: receiptsError,
    refetch: refetchReceipts,
  } = useGetFacilityReceipts({ per_page: 100 });

  const { data: invoiceDocResp, isLoading: invoiceDocLoading } =
    useGetBillingInvoiceDocument(previewInvoiceId);
  const { data: receiptDocResp, isLoading: receiptDocLoading } =
    useGetBillingReceiptDocument(previewPaymentId);

  const invoices = useMemo(() => invoicesResp?.data ?? [], [invoicesResp]);
  const receipts = useMemo(() => receiptsResp?.data ?? [], [receiptsResp]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv: Invoice) =>
      inv.invoice_number.toLowerCase().includes(q)
      || (inv.description || '').toLowerCase().includes(q)
      || INVOICE_TYPE_LABELS[inv.invoice_type as keyof typeof INVOICE_TYPE_LABELS]?.toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const filteredReceipts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter((r: SubscriptionReceipt) =>
      (r.receipt_number || '').toLowerCase().includes(q)
      || (r.transaction_reference || '').toLowerCase().includes(q)
      || (r.plan_name || '').toLowerCase().includes(q),
    );
  }, [receipts, search]);

  const invoicePagination = useClientPagination(filteredInvoices, { initialPageSize: 10 });
  const receiptPagination = useClientPagination(filteredReceipts, { initialPageSize: 10 });

  const previewDocument =
    previewInvoiceId != null
      ? invoiceDocResp?.data?.document ?? null
      : previewPaymentId != null
        ? receiptDocResp?.data?.document ?? null
        : null;

  const previewLoading =
    (previewInvoiceId != null && invoiceDocLoading)
    || (previewPaymentId != null && receiptDocLoading);

  const closePreview = () => {
    setPreviewInvoiceId(null);
    setPreviewPaymentId(null);
  };

  const isLoading = tab === 'invoices' ? invoicesLoading : receiptsLoading;
  const error = tab === 'invoices' ? invoicesError : receiptsError;

  if (isLoading) {
    return (
      <LoadingSkeleton variant="dashboard" theme={theme} message="Loading billing documents…" />
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-2xl p-10 text-center border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
        <h3 className="text-lg font-bold mb-2">Failed to load documents</h3>
        <p className={cn('mb-4', isDark ? 'text-gray-400' : 'text-gray-600')}>{error.message}</p>
        <button
          type="button"
          onClick={() => (tab === 'invoices' ? refetchInvoices() : refetchReceipts())}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Receipts &amp; Invoices</h1>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Invoices show amounts due for Custocare. Receipts are issued once your payment is approved.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setRefreshing(true);
            await Promise.all([refetchInvoices(), refetchReceipts()]);
            setRefreshing(false);
          }}
          disabled={refreshing}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border',
            isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50',
          )}
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className={cn('flex gap-1 p-1 rounded-xl w-fit', isDark ? 'bg-gray-800' : 'bg-gray-100')}>
        {(['invoices', 'receipts'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setSearch(''); }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors',
              tab === t
                ? 'bg-blue-600 text-white shadow'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900',
            )}
          >
            {t === 'invoices' ? 'Invoices' : 'Receipts'}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === 'invoices' ? 'Search invoices…' : 'Search receipts…'}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm',
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200',
          )}
        />
      </div>

      {tab === 'invoices' && (
        <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-gray-600' : 'text-gray-300')} />
              <p className="font-semibold">No invoices yet</p>
              <p className={cn('text-sm mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
                Invoices are created when you submit a payment. They show what is due to Custospark Company Ltd.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={cn('border-b', isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50')}>
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Invoice #</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Due</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoicePagination.pageItems.map((inv) => (
                      <tr key={inv.id} className={cn('border-b', isDark ? 'border-gray-800' : 'border-gray-100')}>
                        <td className="py-3 px-4 font-mono font-medium">{inv.invoice_number}</td>
                        <td className="py-3 px-4">{INVOICE_TYPE_LABELS[inv.invoice_type as keyof typeof INVOICE_TYPE_LABELS] || inv.invoice_type_label}</td>
                        <td className="py-3 px-4 font-semibold">{inv.currency} {Number(inv.amount).toFixed(2)}</td>
                        <td className="py-3 px-4">{INVOICE_STATUS_LABELS[inv.status as InvoiceStatus] || inv.status_label}</td>
                        <td className="py-3 px-4">{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => { setPreviewPaymentId(null); setPreviewInvoiceId(inv.id); }}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn('px-4 py-3 flex items-center justify-between text-xs border-t', isDark ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500')}>
                <span>
                  {(invoicePagination.page - 1) * invoicePagination.pageSize + 1}–
                  {Math.min(invoicePagination.page * invoicePagination.pageSize, invoicePagination.total)} of {invoicePagination.total}
                </span>
                <div className="flex gap-2">
                  <button type="button" disabled={invoicePagination.page <= 1} onClick={() => invoicePagination.setPage(invoicePagination.page - 1)} className="px-2 py-1 rounded border disabled:opacity-40">Prev</button>
                  <button type="button" disabled={invoicePagination.page >= invoicePagination.totalPages} onClick={() => invoicePagination.setPage(invoicePagination.page + 1)} className="px-2 py-1 rounded border disabled:opacity-40">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'receipts' && (
        <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          {filteredReceipts.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className={cn('w-12 h-12 mx-auto mb-3', isDark ? 'text-gray-600' : 'text-gray-300')} />
              <p className="font-semibold">No receipts yet</p>
              <p className={cn('text-sm mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
                Receipts appear after platform admin approves your payment proof.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className={cn('border-b', isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50')}>
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Receipt #</th>
                      <th className="text-left py-3 px-4 font-semibold">Plan</th>
                      <th className="text-left py-3 px-4 font-semibold">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold">Method</th>
                      <th className="text-left py-3 px-4 font-semibold">Approved</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptPagination.pageItems.map((r) => (
                      <tr key={r.id} className={cn('border-b', isDark ? 'border-gray-800' : 'border-gray-100')}>
                        <td className="py-3 px-4 font-mono font-medium">{r.receipt_number || '—'}</td>
                        <td className="py-3 px-4">{r.plan_name || '—'}</td>
                        <td className="py-3 px-4 font-semibold">{r.currency} {Number(r.amount).toFixed(2)}</td>
                        <td className="py-3 px-4">{r.method_label}</td>
                        <td className="py-3 px-4">{r.approved_at ? new Date(r.approved_at).toLocaleDateString() : '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => { setPreviewInvoiceId(null); setPreviewPaymentId(r.id); }}
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn('px-4 py-3 flex items-center justify-between text-xs border-t', isDark ? 'border-gray-800 text-gray-400' : 'border-gray-100 text-gray-500')}>
                <span>
                  {(receiptPagination.page - 1) * receiptPagination.pageSize + 1}–
                  {Math.min(receiptPagination.page * receiptPagination.pageSize, receiptPagination.total)} of {receiptPagination.total}
                </span>
                <div className="flex gap-2">
                  <button type="button" disabled={receiptPagination.page <= 1} onClick={() => receiptPagination.setPage(receiptPagination.page - 1)} className="px-2 py-1 rounded border disabled:opacity-40">Prev</button>
                  <button type="button" disabled={receiptPagination.page >= receiptPagination.totalPages} onClick={() => receiptPagination.setPage(receiptPagination.page + 1)} className="px-2 py-1 rounded border disabled:opacity-40">Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {(previewInvoiceId != null || previewPaymentId != null) && (
        <BillingDocumentPreviewModal
          theme={theme}
          document={previewDocument}
          isLoading={previewLoading}
          onClose={closePreview}
        />
      )}

      {previewLoading && !previewDocument && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm shadow-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading document…
        </div>
      )}
    </div>
  );
};

export default ReceiptsAndInvoices;
