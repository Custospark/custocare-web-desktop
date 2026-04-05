import React from 'react';
import type { DerivedFinancials, CashBreakdown, ReceiptTransactionShape } from './ReceiptTypes';
import TotalsSection from './TotalsSection';
import PaymentDetailsSection from './PaymentDetailsSection';
import AttendingStaffDisplay from './AttendingStaffDisplay';

interface ReceiptFinancialsProps {
  selectedTransaction: ReceiptTransactionShape;
  derivedFinancials: DerivedFinancials;
  cashBreakdown: CashBreakdown | null;
  changeAmount: number;
}

export const ReceiptFinancials: React.FC<ReceiptFinancialsProps> = ({
  selectedTransaction,
  derivedFinancials,
  cashBreakdown,
  changeAmount,
}) => {
  // Calculate refund total correctly - group by adjustment and sum once per adjustment
  const refundedItems = selectedTransaction?.refunded_items ?? [];
  
  const hasRefunds = refundedItems.length > 0;
  let totalRefunded = 0;
  
  if (hasRefunds) {
    // Group by adjustment to avoid double counting
    const uniqueAdjustments = new Map();
    
    refundedItems.forEach(item => {
      const adjustmentKey = item.adjustment_id || item.adjustment_reference;
      if (!uniqueAdjustments.has(adjustmentKey)) {
        uniqueAdjustments.set(adjustmentKey, true);
        totalRefunded += item.refund_info?.refund_amount || 0;
      }
    });
    
    // If no refund_amount in refund_info, fall back to summing totalAmount per adjustment
    if (totalRefunded === 0) {
      const adjustmentTotals = new Map();
      refundedItems.forEach(item => {
        const adjustmentKey = item.adjustment_id || item.adjustment_reference;
        if (!adjustmentTotals.has(adjustmentKey)) {
          adjustmentTotals.set(adjustmentKey, 0);
        }
        adjustmentTotals.set(adjustmentKey, adjustmentTotals.get(adjustmentKey) + (Number(item.totalAmount) || 0));
      });
      totalRefunded = Array.from(adjustmentTotals.values()).reduce((sum, val) => sum + val, 0);
    }
  }

  return (
    <>
      {/* Totals Section */}
      <TotalsSection
        subtotal={derivedFinancials.subtotal}
        discountAmount={derivedFinancials.discountAmount}
        taxes={selectedTransaction.billing_data.taxes || []}
        grandTotal={derivedFinancials.grandTotal}
      />

      {/* Payment Details Section */}
      <PaymentDetailsSection
        paymentMethods={selectedTransaction.payment_methods || []}
        cashBreakdown={cashBreakdown}
        totalPaidFromMethods={derivedFinancials.totalPaidFromMethods}
        netPaid={derivedFinancials.netPaid}
        balanceDue={derivedFinancials.balanceDue}
        changeAmount={changeAmount}
        hasRefunds={hasRefunds}
        totalRefunded={totalRefunded}
      />

      {/* Attending Staff */}
      <AttendingStaffDisplay selectedTransaction={selectedTransaction} />
    </>
  );
};