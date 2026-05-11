import React, { useRef, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { BillingReviewItem } from '../../../medical-records/api/billing-review/BillingReviewTypes';
import { PrintableReceipt } from '../../../medical-records/ui/revenue/billing-review/components/receipt-view/PrintableReceipt';
import {
  getCashBreakdownForTransaction,
  getDerivedFinancialsFromReceiptTransaction,
} from '../../../medical-records/ui/revenue/billing-review/deriveReceiptPrintModel';
import { billingReviewItemToReceiptTransaction, invoiceNumberFromBillingItem } from './billingInvoiceFromReceiptUtils';

export interface BillingInvoicePreviewModalProps {
  item: BillingReviewItem | null;
  theme: 'light' | 'dark';
  onClose: () => void;
}

export const BillingInvoicePreviewModal: React.FC<BillingInvoicePreviewModalProps> = ({
  item,
  theme,
  onClose,
}) => {
  const isDark = theme === 'dark';
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const receiptShape = item ? billingReviewItemToReceiptTransaction(item) : null;
  const derived = receiptShape ? getDerivedFinancialsFromReceiptTransaction(receiptShape) : null;
  const cashBreakdown =
    derived?.hasCashPayment && derived.cashTendered > 0 && receiptShape
      ? getCashBreakdownForTransaction(receiptShape, derived.cashTendered)
      : null;
  const changeAmount = cashBreakdown?.change ?? 0;
  const invoiceNo = item ? invoiceNumberFromBillingItem(item) : '';

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoiceNo || 'invoice',
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: async () => {
      setIsPrinting(false);
    },
  });

  if (!item || !receiptShape || !derived) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close preview"
        onClick={onClose}
      />

      <div
        className={`relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        }`}
      >
        <div
          className={`no-print flex flex-shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-5 ${
            isDark ? 'border-gray-800 bg-gray-900/95' : 'border-gray-100 bg-white/95'
          }`}
        >
          <div className="min-w-0">
            <h2 className={`truncate text-base font-bold sm:text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Receipts, invoices & reconciliation
            </h2>
           
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrint()}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`rounded-xl p-2 transition-colors ${
                isDark ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <style>{`
            @media print {
              html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .no-print { display: none !important; }
              .receipt-print { margin: 0 !important; box-shadow: none !important; }
              @page { margin: 10mm; }
            }
          `}</style>

          <div ref={printRef} className="mx-auto max-w-3xl space-y-4">
            <PrintableReceipt
              selectedTransaction={receiptShape}
              derivedFinancials={derived}
              cashBreakdown={cashBreakdown}
              changeAmount={changeAmount}
              isPrinting={isPrinting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
