// TotalsSection.tsx
import React from 'react';
import { Percent } from 'lucide-react';
import type { Tax } from '../../../../../../api/billing-review/BillingReviewTypes';
import { shouldShowDiscountPercentage } from './ReceiptTypes';
import { formatCurrency } from '../../../../stats/billing-revenue-stats-component/revenueDashboardUtils';
interface TotalsSectionProps {
  subtotal: number;
  discountAmount: number;
  taxes: Tax[];
  grandTotal: number;
}

const TotalsSection: React.FC<TotalsSectionProps> = ({ 
  subtotal, 
  discountAmount, 
  taxes, 
  grandTotal 
}) => {
  const discountPercentage = shouldShowDiscountPercentage(discountAmount, subtotal);

  return (
    <div className="border-t-2 border-gray-300 pt-2 sm:pt-3 text-[10px] sm:text-xs space-y-1 sm:space-y-2 relative">
      <div className="flex justify-between">
        <span className="font-semibold">Subtotal</span>
        <span className="font-bold tabular-nums bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
          {formatCurrency(subtotal)}
        </span>
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-green-700">
          <span className="font-semibold flex items-center gap-1">
            <Percent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {discountPercentage ? `Discount (${discountPercentage}%)` : 'Discount'}
          </span>
          <span className="font-bold tabular-nums bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            -{formatCurrency(discountAmount)}
          </span>
        </div>
      )}

      {taxes?.map((tax: Tax, index: number) => (
        <div key={index} className="flex justify-between">
          <span className="font-semibold">{tax.name} ({tax.rate}%)</span>
          <span className="font-bold tabular-nums bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {formatCurrency(tax.amount)}
          </span>
        </div>
      ))}

      <div className="flex justify-between font-black text-sm sm:text-base mt-2 sm:mt-3 pt-2 sm:pt-3 border-t-2 border-gray-300">
        <span className="text-gray-800">TOTAL</span>
        <span className="bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent tabular-nums">
          {formatCurrency(grandTotal)}
        </span>
      </div>
    </div>
  );
};

export default TotalsSection;