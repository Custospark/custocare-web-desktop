import React, { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { AlertCircle, FileText, Printer } from 'lucide-react';
import { cn } from '../utils/classNameUtils';
import { useGetBillingByVisit } from '../../modules/medical-records/api/billable-items/BillableItemsQueries';
import { selectActivePatient } from '../../app/store/slices/visitSlice';
import { PrintableReceipt } from '../../modules/medical-records/ui/revenue/billing-review/components/receipt-view/PrintableReceipt';
import type { ReceiptTransactionShape, DerivedFinancials } from '../../modules/medical-records/ui/revenue/billing-review/components/receipt-view/printable-receipt/ReceiptTypes';
import { PaymentStatus } from '../../modules/medical-records/api/billing-review/BillingReviewTypes';
import LoadingSkeleton from '../components/Loading/LoadingSkeletons';

interface PatientBillProps {
  visitId: number;
  theme?: 'light' | 'dark';
}

const roundCurrency = (v: number) => Math.round(v * 100) / 100;

export const PatientBill: React.FC<PatientBillProps> = ({ visitId, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const patient = useSelector(selectActivePatient);

  const { data: billingResponse, isLoading, error } = useGetBillingByVisit(visitId, {
    enabled: !!visitId,
  });

  const billingData = billingResponse?.data;

  const transaction: ReceiptTransactionShape | null = useMemo(() => {
    if (!billingData) return null;
    const items = (billingData.charge_items ?? []).map((item) => ({
      ...item,
      source: 'backend' as const,
      persisted: true,
    }));
    const subtotal = items.reduce((s, i) => s + (i.totalAmount ?? 0), 0);
    const discountAmount = billingData.discount?.type === 'percentage'
      ? subtotal * (billingData.discount.value / 100)
      : (billingData.discount?.value ?? 0);
    const taxableAmount = subtotal - discountAmount;
    const taxTotal = (billingData.taxes ?? []).reduce((s, t) => s + (t.amount ?? 0), 0);
    const grandTotal = taxableAmount + taxTotal;
    const totalPaid = (billingData.payment_methods ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);

    return {
      receipt_number: billingData.receipt_number ?? null,
      patient_name: billingData.patient_name || patient?.name || 'Unknown Patient',
      patient_number: billingData.patient_number || patient?.patient_number || 'N/A',
      created_at: new Date().toISOString(),
      charge_items: items,
      billing_data: billingData.billing_data ? {
        subtotal: billingData.billing_data.subtotal ?? subtotal,
        discountAmount: billingData.billing_data.discountAmount ?? discountAmount,
        taxableAmount: billingData.billing_data.taxableAmount ?? taxableAmount,
        taxTotal: billingData.billing_data.taxTotal ?? taxTotal,
        grandTotal: billingData.billing_data.grandTotal ?? grandTotal,
        totalPaid: billingData.billing_data.totalPaid ?? totalPaid,
        balance: billingData.billing_data.balance ?? (grandTotal - totalPaid),
      } : {
        subtotal,
        discountAmount,
        taxableAmount,
        taxTotal,
        grandTotal,
        totalPaid,
        balance: grandTotal - totalPaid,
      },
      payment_methods: (billingData.payment_methods ?? []).map((p) => ({
        type: p.type,
        amount: p.amount,
        reference: p.reference,
        details: p.details,
      })),
      additional_notes: billingData.additional_notes ?? undefined,
      payment_status: billingData.payment_status || PaymentStatus.PAID_IN_FULL,
      billing_status: billingData.billing_status || billingData.status || 'settled',
      attending_staff_display: billingData.attending_staff_display ?? null,
      attending_staff_name: billingData.attending_staff_name ?? null,
      attending_staff_role: billingData.attending_staff_role ?? null,
      facilityData: null,
      refunded_items: (billingData.refunded_items ?? []).map((r) => ({
        ...r,
        source: 'backend',
        persisted: true,
      })),
    } as ReceiptTransactionShape;
  }, [billingData, patient]);

  const derivedFinancials: DerivedFinancials | null = useMemo(() => {
    if (!transaction) return null;
    const subtotal = transaction.billing_data?.subtotal ?? 0;
    const discountAmount = transaction.billing_data?.discountAmount ?? 0;
    const taxTotal = transaction.billing_data?.taxTotal ?? 0;
    const grandTotal = transaction.billing_data?.grandTotal ?? 0;
    const totalPaid = transaction.billing_data?.totalPaid ?? 0;
    const balance = transaction.billing_data?.balance ?? 0;
    const cashPayment = (transaction.payment_methods ?? []).find((p) => p.type === 'cash');
    const cashTendered = cashPayment?.amount ?? 0;

    return {
      status: transaction.payment_status,
      refunded: 0,
      netPaid: totalPaid,
      balanceDue: Math.max(0, balance),
      grandTotal,
      subtotal,
      discountAmount,
      discountPercent: subtotal > 0 ? roundCurrency((discountAmount / subtotal) * 100) : 0,
      discountType: null,
      taxTotal,
      totalPaidFromMethods: totalPaid,
      cashTendered,
      changeAmount: cashTendered > 0 ? Math.max(0, cashTendered - balance) : 0,
      hasCashPayment: cashTendered > 0,
      nonCashTotal: totalPaid - cashTendered,
      paidStatus: totalPaid >= grandTotal ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID',
      isOverpaid: totalPaid > grandTotal,
      overageAmount: Math.max(0, totalPaid - grandTotal),
      underAmount: Math.max(0, grandTotal - totalPaid),
    } as DerivedFinancials;
  }, [transaction]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `bill-visit-${visitId}`,
    onBeforePrint: async () => setIsPrinting(true),
    onAfterPrint: async () => setIsPrinting(false),
  });

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

  if (!billingData.has_billing) {
    return (
      <div className={cn('p-8 text-center', isDark ? 'text-gray-400' : 'text-gray-500')}>
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">No billing records</p>
        <p className="text-xs mt-1">This visit has no billing information yet.</p>
      </div>
    );
  }

  const cashAmount = (billingData.payment_methods ?? []).find((p) => p.type === 'cash')?.amount ?? 0;
  const totalPaid = (billingData.payment_methods ?? []).reduce((s, p) => s + (p.amount ?? 0), 0);
  const subtotal = (billingData.charge_items ?? []).reduce((s, i) => s + (i.totalAmount ?? 0), 0);
  const discountAmount = billingData.discount?.type === 'percentage'
    ? subtotal * (billingData.discount.value / 100)
    : (billingData.discount?.value ?? 0);
  const grandTotal = (subtotal - discountAmount) + (billingData.taxes ?? []).reduce((s, t) => s + (t.amount ?? 0), 0);
  const changeAmount = cashAmount > 0 ? Math.max(0, cashAmount - (grandTotal - totalPaid + cashAmount)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={cn('font-bold text-lg', isDark ? 'text-white' : 'text-gray-900')}>Patient Bill</h3>
        <button
          type="button"
          onClick={() => handlePrint()}
          disabled={isPrinting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          {isPrinting ? 'Printing...' : 'Print Receipt'}
        </button>
      </div>

      {transaction && derivedFinancials && (
        <PrintableReceipt
          ref={printRef}
          selectedTransaction={transaction}
          derivedFinancials={derivedFinancials}
          cashBreakdown={cashAmount > 0 ? {
            tendered: cashAmount,
            change: changeAmount,
            netCash: cashAmount - changeAmount,
          } : null}
          changeAmount={changeAmount}
          isPrinting={isPrinting}
        />
      )}
    </div>
  );
};

export default PatientBill;
