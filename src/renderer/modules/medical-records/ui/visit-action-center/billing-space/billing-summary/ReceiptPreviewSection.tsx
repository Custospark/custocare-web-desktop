// ReceiptPreviewSection.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { DEFAULT_TAXES, formatCurrency } from '../billing-types';
import { type ReceiptTransactionShape } from '../../../revenue/billing-review/components/receipt-view/printable-receipt/ReceiptTypes';// Define the shape that matches what PrintableReceipt expects
import { PrintableReceipt } from '../../../revenue/billing-review/components/receipt-view/PrintableReceipt';
interface ReceiptPreviewSectionProps {
  colors: any;
  isReadOnly: boolean;
  status: string;
  receiptNumber: string;
  receiptRef: React.RefObject<HTMLDivElement | null>;
  selectedTransaction: ReceiptTransactionShape;
  derivedFinancials: any;
  cashBreakdown: any;
  isPrinting: boolean;
  additionalNotes: string;
  billingData: any;
  onAdditionalNotesChange: (notes: string) => void;
}

export const ReceiptPreviewSection: React.FC<ReceiptPreviewSectionProps> = ({
  colors,
  isReadOnly,
  status,
  receiptNumber,
  receiptRef,
  selectedTransaction,
  derivedFinancials,
  cashBreakdown,
  isPrinting,
  additionalNotes,
  billingData,
  onAdditionalNotesChange,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className={`flex flex-col h-full border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm overflow-hidden ${
          isReadOnly ? 'opacity-90' : ''
        }`}
      >
        {/* Fixed header */}
        <div className={`flex-shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary} no-print`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>
                Receipt Preview
              </h3>
              <p className={`text-xs ${colors.text.secondary} truncate`}>
                {isReadOnly
                  ? 'Payment completed - receipt finalized'
                  : 'Live updates as you adjust discount, taxes, and payment'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`px-2 py-1 rounded-md text-xs font-medium select-none whitespace-nowrap ${
                  status === 'draft'
                    ? colors.status.draft
                    : status === 'ready'
                    ? colors.status.ready
                    : colors.status.settled
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
              <div
                className={`text-xs font-semibold px-2.5 py-1 rounded border ${colors.border.primary} ${colors.bg.secondary} ${colors.text.primary}`}
              >
                {receiptNumber ? `# ${receiptNumber}` : '# Pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable receipt - Using PrintableReceipt component */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0"
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className="mx-auto w-full max-w-[360px] sm:max-w-[420px] space-y-4">
            <PrintableReceipt
              ref={receiptRef}
              selectedTransaction={selectedTransaction}
              derivedFinancials={derivedFinancials}
              cashBreakdown={cashBreakdown}
              changeAmount={derivedFinancials.changeAmount}
              isPrinting={isPrinting}
            />

            {/* Taxes and Additional Notes — flow naturally below receipt */}
            <div className={`border-t pt-4 ${colors.border.primary}`}>
              {/* Additional Notes */}
              <div className="mb-4">
                <label className={`block text-sm font-bold mb-1 ${colors.text.primary}`}>
                  Additional Notes{' '}
                  <span className={`text-xs font-normal ${colors.text.secondary}`}>(optional)</span>
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => onAdditionalNotesChange(e.target.value)}
                  placeholder="E.g. patient paid in two installments, waived consultation fee…"
                  rows={2}
                  readOnly={isReadOnly}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 text-sm border ${
                    isReadOnly
                      ? `${colors.border.disabled} ${colors.bg.disabled} ${colors.text.disabled} cursor-not-allowed`
                      : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 ${colors.accent.ring}`
                  } rounded-lg transition-shadow resize-none`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm font-bold ${colors.text.primary}`}>Taxes</div>
                  <div className={`text-xs ${colors.text.secondary}`}>Auto-calculated</div>
                </div>
                <div className="space-y-2">
                  {DEFAULT_TAXES.map((tax, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 border ${colors.border.primary} ${colors.bg.primary} rounded-lg ${
                        isReadOnly ? 'opacity-75' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${colors.text.primary}`}>{tax.name}</p>
                        <p className={`text-xs ${colors.text.secondary}`}>{tax.rate}% rate</p>
                      </div>
                      <p className={`text-sm font-extrabold ${colors.text.primary}`}>
                        {formatCurrency(billingData.taxes[idx]?.amount || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left footer info */}
        <div className={`flex-shrink-0 px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary} no-print`}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} flex-shrink-0 mt-0.5`} />
            <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
              {isReadOnly
                ? 'Payment completed. Receipt is finalized and ready for printing.'
                : 'Receipt preview updates in real-time. Final totals include taxes and discount.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};