// ReceiptFinancials.tsx
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
      />

      {/* Attending Staff */}
      <AttendingStaffDisplay selectedTransaction={selectedTransaction} />
    </>
  );
};