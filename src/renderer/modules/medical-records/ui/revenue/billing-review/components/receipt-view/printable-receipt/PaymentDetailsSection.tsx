import React from 'react';
import { Banknote, ArrowLeftRight, RefreshCw } from 'lucide-react';
import PaymentIcon from './PaymentIcon';
import type { PaymentMethod } from '../../../../../../api/billing-review/BillingReviewTypes';
import { type CashBreakdown } from './ReceiptTypes';
import { cx } from './ReceiptTypes';
import { formatCurrency } from '../../../../stats/billing-revenue-stats-component/revenueDashboardUtils';
interface PaymentDetailsSectionProps {
  paymentMethods: PaymentMethod[];
  cashBreakdown: CashBreakdown | null;
  totalPaidFromMethods: number;
  netPaid: number;
  balanceDue: number;
  changeAmount: number;
  hasRefunds?: boolean;
  totalRefunded?: number;
}

const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({ 
  paymentMethods, 
  cashBreakdown, 
  totalPaidFromMethods, 
  netPaid, 
  balanceDue, 
  changeAmount,
  hasRefunds = false,
  totalRefunded = 0
}) => {
  if (!paymentMethods || paymentMethods.length === 0) return null;

  // Ensure totalRefunded is properly rounded
  const roundedTotalRefunded = Math.round(totalRefunded * 100) / 100;

  return (
    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-gray-300 text-[10px] sm:text-xs relative">
      <h3 className="text-xs sm:text-sm font-black mb-2 sm:mb-3 text-gray-800">PAYMENT DETAILS</h3>
      
      <div className="space-y-1.5 sm:space-y-2">
        {paymentMethods.map((pm: PaymentMethod, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-50 p-1.5 sm:p-2 rounded gap-2"
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
              <PaymentIcon type={pm.type} className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
              <span className="capitalize font-bold truncate">{pm.type.replace('_', ' ')}</span>
              {pm.reference && (
                <span className="text-[8px] sm:text-[10px] text-gray-500 truncate hidden xs:inline">
                  Ref: {pm.reference}
                </span>
              )}
            </div>
            <span className="font-black shrink-0 tabular-nums bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(pm.amount)}
            </span>
          </div>
        ))}
      </div>

      {cashBreakdown && cashBreakdown.tendered > 0 && (
        <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 border-t border-gray-200 pt-2 sm:pt-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <Banknote className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" /> Cash Tendered:
            </span>
            <span className="font-black tabular-nums bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(cashBreakdown.tendered)}
            </span>
          </div>
          
          {cashBreakdown.change > 0 && (
            <>
              <div className="flex justify-between items-center text-blue-700">
                <span className="font-semibold flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" /> Change:
                </span>
                <span className="font-black tabular-nums bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(cashBreakdown.change)}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-1 text-[8px] sm:text-xs border-t border-dashed border-gray-200 mt-1">
                <span className="text-gray-600">Net Cash Payment:</span>
                <span className="font-bold text-gray-900 tabular-nums">
                  {formatCurrency(cashBreakdown.netCash)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
      
      {paymentMethods.length > 1 && (
        <div className="flex justify-between pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-gray-200 font-bold">
          <span>Total Payments</span>
          <span className="bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent tabular-nums">
            {formatCurrency(totalPaidFromMethods)}
          </span>
        </div>
      )}

      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
        <div className="flex justify-between">
          <span className="text-gray-600 font-semibold">
            {hasRefunds ? 'Amount After Refund' : 'Amount Paid'}
          </span>
          <span className="font-black bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent tabular-nums">
            {formatCurrency(netPaid)}
          </span>
        </div>

        {hasRefunds && roundedTotalRefunded > 0 && (
          <div className="flex justify-between mt-1 sm:mt-2">
            <span className="text-gray-600 font-semibold flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-red-500" /> Total Refunded:
            </span>
            <span className="font-black text-red-600 tabular-nums">
              -{formatCurrency(roundedTotalRefunded)}
            </span>
          </div>
        )}

        <div className="flex justify-between mt-1 sm:mt-2">
          <span className="text-gray-600 font-semibold">Balance Due</span>
          <span
            className={cx(
              'font-black text-sm sm:text-base',
              balanceDue === 0 
                ? 'bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' 
                : 'text-amber-700'
            )}
          >
            {balanceDue === 0
              ? 'PAID IN FULL'
              : formatCurrency(balanceDue)}
          </span>
        </div>

        {/* Refund message when refunds exist and balance is paid in full */}
        {hasRefunds && roundedTotalRefunded > 0 && balanceDue === 0 && (
          <div className="mt-1 sm:mt-2 text-[8px] sm:text-xs text-red-600 italic flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5" />
            * Refund of {formatCurrency(roundedTotalRefunded)} has been processed.
          </div>
        )}

        {/* Change message for non-refund transactions */}
        {!hasRefunds && changeAmount > 0 && (
          <div className="mt-1 sm:mt-2 text-[8px] sm:text-xs text-gray-500 italic">
            * Change of {formatCurrency(changeAmount)} returned to Patient.
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetailsSection;