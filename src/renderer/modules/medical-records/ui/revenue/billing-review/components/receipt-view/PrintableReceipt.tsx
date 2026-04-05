import React from 'react';
import { motion } from 'framer-motion';
import type { DerivedFinancials, CashBreakdown, ReceiptTransactionShape } from './printable-receipt/ReceiptTypes';
import { cx, getWatermarkConfig, Z_INDEX } from './printable-receipt/ReceiptTypes';
import { ReceiptHeader } from './printable-receipt/ReceiptHeader';
import { ReceiptMetaInfo } from './printable-receipt/ReceiptMetaInfo';
import { ReceiptServices } from './printable-receipt/ReceiptServices';
import { ReceiptRefunds } from './printable-receipt/ReceiptRefunds';
import { ReceiptFinancials } from './printable-receipt/ReceiptFinancials';
import { PrintableReceiptFooter } from './printable-receipt/PrintableReceiptFooter';
import { Watermark } from './printable-receipt/Watermark';

/* -------------------------------------------------------------------------- */
/*                         PROPS INTERFACE                                    */
/* -------------------------------------------------------------------------- */

interface PrintableReceiptProps {
  selectedTransaction: ReceiptTransactionShape;
  derivedFinancials: DerivedFinancials;
  cashBreakdown: CashBreakdown | null;
  changeAmount: number;
  isPrinting: boolean;
}

/* -------------------------------------------------------------------------- */
/*                           MAIN RECEIPT COMPONENT                           */
/* -------------------------------------------------------------------------- */

export const PrintableReceipt = React.forwardRef<HTMLDivElement, PrintableReceiptProps>(({
  selectedTransaction,
  derivedFinancials,
  cashBreakdown,
  changeAmount,
  isPrinting,
}, ref) => {
  const watermarkConfig = getWatermarkConfig(
    derivedFinancials, 
    selectedTransaction?.billing_status,
    selectedTransaction?.payment_status
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className={`relative rounded-xl ${!isPrinting ? 'p-0.5' : ''} w-full`}>
        {/* Decorative gradient border - only visible in preview mode */}
        {!isPrinting && watermarkConfig && (
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #10b981, #6366f1, #3b82f6)',
              backgroundSize: '300% 100%',
              zIndex: Z_INDEX.BACKGROUND,
            }}
          />
        )}

        {/* Main receipt card */}
        <div 
          ref={ref} 
          className="receipt-print relative w-full @container"
        >
          <div className={cx(
            'bg-white text-black p-4 sm:p-6 rounded-[10px] shadow-lg relative',
            'print:shadow-none print:border print:border-gray-200',
            !isPrinting && 'border-0'
          )}>
            {/* ===== WATERMARK ===== */}
            {watermarkConfig && <Watermark config={watermarkConfig} />}

            {/* Content wrapper - sits above watermark */}
            <div className="relative" style={{ zIndex: Z_INDEX.CONTENT }}>
              <ReceiptHeader />
              <ReceiptMetaInfo selectedTransaction={selectedTransaction} />
              <ReceiptServices selectedTransaction={selectedTransaction} />

              {selectedTransaction?.refunded_items && selectedTransaction.refunded_items.length > 0 && (
                <ReceiptRefunds selectedTransaction={selectedTransaction} />
              )}

              <ReceiptFinancials
                selectedTransaction={selectedTransaction}
                derivedFinancials={derivedFinancials}
                cashBreakdown={cashBreakdown}
                changeAmount={changeAmount}
              />

              <PrintableReceiptFooter />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

PrintableReceipt.displayName = 'PrintableReceipt';