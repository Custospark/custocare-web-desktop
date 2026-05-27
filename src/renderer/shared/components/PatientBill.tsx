import React, { useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, AlertCircle, FileText } from 'lucide-react';
import { cn } from '../utils/classNameUtils';
import { useGetBillingByVisit } from '../../modules/medical-records/api/billable-items/BillableItemsQueries';
import { formatCurrency } from '../../modules/medical-records/ui/visit-action-center/billing-space/billing-types';
import type { BillingRetrievalData, BackendChargeItem } from '../../modules/medical-records/api/billable-items/BillingItemsTypes';
import LoadingSkeleton from '../components/Loading/LoadingSkeletons';

interface PatientBillProps {
  visitId: number;
  patientName?: string;
  patientNumber?: string;
  theme?: 'light' | 'dark';
}

const ReceiptView: React.FC<{ data: BillingRetrievalData; theme?: 'light' | 'dark' }> = ({ data, theme }) => {
  const isDark = theme === 'dark';
  const items = data.charge_items ?? [];
  const subtotal = items.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const discountAmount = data.discount?.type === 'percentage'
    ? subtotal * (data.discount.value / 100)
    : (data.discount?.value ?? 0);
  const taxableAmount = subtotal - discountAmount;
  const taxTotal = (data.taxes ?? []).reduce((s, t) => s + (t.amount ?? 0), 0);
  const grandTotal = taxableAmount + taxTotal;
  const totalPaid = (data.payment_methods ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const balance = grandTotal - totalPaid;
  const status = data.payment_status ?? data.status ?? 'unknown';

  return (
    <div className={cn('space-y-4', isDark ? 'text-gray-100' : 'text-gray-900')} data-receipt>
      {/* Header */}
      <div className="text-center border-b pb-3 mb-2">
        <h2 className="text-lg font-bold">Patient Bill</h2>
        <p className="text-xs">{data.patient_name}</p>
        {data.patient_number && <p className="text-xs opacity-70">#{data.patient_number}</p>}
        {data.receipt_number && <p className="text-xs mt-1 font-mono">Receipt: {data.receipt_number}</p>}
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-2">Charges</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className={cn('border-b', isDark ? 'border-gray-700' : 'border-gray-200')}>
                <th className="text-left py-1 font-medium">Item</th>
                <th className="text-right py-1 font-medium">Qty</th>
                <th className="text-right py-1 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.lineItemId ?? i} className={cn('border-b', isDark ? 'border-gray-800' : 'border-gray-100')}>
                  <td className="py-1">{item.service ?? item.service_key}</td>
                  <td className="text-right py-1">{item.quantity}</td>
                  <td className="text-right py-1">{formatCurrency(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <div className={cn('flex items-center gap-2 text-sm py-4', isDark ? 'text-gray-400' : 'text-gray-500')}>
          <AlertCircle className="w-4 h-4" />
          <span>No charges recorded for this visit.</span>
        </div>
      )}

      {/* Totals */}
      <div className="space-y-1 text-sm border-t pt-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span className="text-emerald-600">-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        {taxTotal > 0 && (
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatCurrency(taxTotal)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t pt-1">
          <span>Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
        {totalPaid > 0 && (
          <>
            <div className="flex justify-between">
              <span>Paid</span>
              <span className="text-emerald-600">{formatCurrency(totalPaid)}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between">
                <span className="text-amber-600">Balance</span>
                <span className="text-amber-600">{formatCurrency(balance)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status */}
      <div className="text-center text-xs border-t pt-2">
        <span className={cn(
          'inline-block px-2 py-0.5 rounded font-medium uppercase',
          status === 'settled' || status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
          status === 'draft' ? 'bg-gray-100 text-gray-600' :
          'bg-amber-100 text-amber-800',
        )}>{status}</span>
      </div>
    </div>
  );
};

export const PatientBill: React.FC<PatientBillProps> = ({ visitId, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const printRef = useRef<HTMLDivElement>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const { data: billingResponse, isLoading, error } = useGetBillingByVisit(visitId, {
    enabled: !!visitId,
  });

  const billingData = billingResponse?.data;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `bill-visit-${visitId}`,
  });

  const handlePrintReceipt = () => {
    if (!showReceipt) setShowReceipt(true);
    setTimeout(() => handlePrint(), 100);
  };

  if (isLoading) {
    return <LoadingSkeleton variant="card" theme={theme} message="Loading billing information..." />;
  }

  if (error || !billingData) {
    return (
      <div className={cn('p-4 rounded-xl border text-sm flex items-start gap-2', isDark ? 'bg-red-900/20 border-red-700/40 text-red-200' : 'bg-red-50 border-red-200 text-red-800')}>
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Could not load billing information for this visit.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bill Summary Card */}
      <div className={cn('rounded-xl border p-5', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
            <h3 className="font-bold">Patient Bill</h3>
          </div>
          <button
            type="button"
            onClick={handlePrintReceipt}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition',
              isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
            )}
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>

        <ReceiptView data={billingData} theme={theme} />
      </div>

      {/* Hidden printable receipt */}
      <div className="hidden">
        <div ref={printRef} className={cn('p-6', isDark ? 'bg-white text-black' : 'bg-white text-black')}>
          <ReceiptView data={billingData} />
        </div>
      </div>
    </div>
  );
};

export default PatientBill;
