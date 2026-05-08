import React, { useMemo } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { useGetBillingReview } from '../../../medical-records/api/billing-review/BillingReviewQueries';

interface BillingInvoicesFromReceiptsProps {
  theme: 'light' | 'dark';
}

const BillingInvoicesFromReceipts: React.FC<BillingInvoicesFromReceiptsProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const { data, isLoading, error } = useGetBillingReview({
    per_page: 50,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const invoiceRows = useMemo(
    () =>
      (data?.data.items ?? []).map((item) => ({
        id: item.visit_uuid,
        invoiceNumber: item.receipt_number ? `INV-${item.receipt_number}` : `INV-${item.visit_uuid.slice(0, 8)}`,
        receiptNumber: item.receipt_number || 'N/A',
        patient: item.patient_name || 'Unknown',
        patientNumber: item.patient_number || 'N/A',
        amount: item.billing_data?.grandTotal ?? 0,
        status: item.billing_status || 'pending',
      })),
    [data]
  );

  if (isLoading) {
    return <div className="p-6">Loading invoice-ready records...</div>;
  }

  if (error) {
    return (
      <div className={`m-6 rounded-xl border p-6 ${isDark ? 'border-red-800 bg-red-950/30' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`mt-0.5 h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <div>
            <h3 className="font-semibold">Failed to load invoices</h3>
            <p className="text-sm opacity-80">{error.message || 'Please try again.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-xl border p-4 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Invoices Derived From Receipts</h2>
        </div>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Generated invoice references from issued receipt transactions for quick follow-up.
        </p>
      </div>

      <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}>
              <tr>
                <th className="px-4 py-3 text-left">Invoice</th>
                <th className="px-4 py-3 text-left">Receipt</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.map((row) => (
                <tr key={row.id} className={isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'}>
                  <td className="px-4 py-3 font-medium">{row.invoiceNumber}</td>
                  <td className="px-4 py-3">{row.receiptNumber}</td>
                  <td className="px-4 py-3">
                    <div>{row.patient}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{row.patientNumber}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{row.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize">{row.status.replace(/_/g, ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingInvoicesFromReceipts;
