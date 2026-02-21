// ReceiptServices.tsx
import React from 'react';
import { Package, X } from 'lucide-react';
import type { ReceiptTransactionShape } from './ReceiptTypes';
import { formatCurrency } from '../../../../../../api/billing-review/BillingReviewTypes';
import type { ChargeItem }  from '../../../../../../api/billing-review/BillingReviewTypes';

interface ReceiptServicesProps {
  selectedTransaction: ReceiptTransactionShape;
}

export const ReceiptServices: React.FC<ReceiptServicesProps> = ({ selectedTransaction }) => {
  return (
    <div className="mb-3 sm:mb-4 relative">
      <h3 className="text-xs sm:text-sm font-black mb-2 sm:mb-3 text-gray-800 flex items-center gap-2">
        <Package className="w-3 h-3 sm:w-4 sm:h-4" /> SERVICES RENDERED
      </h3>
      <div className="space-y-1.5 sm:space-y-2.5">
        {selectedTransaction.charge_items.map((item: ChargeItem) => (
          <div
            key={item.id}
            className="flex justify-between text-[10px] sm:text-xs border-b border-gray-200 pb-1 sm:pb-2 p-0.5 sm:p-1 rounded gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold truncate">{item.service.name}</p>
           <p className="text-[9px] sm:text-[11px] text-gray-600 mt-0.5 flex items-center gap-1 truncate">
            <span className="font-semibold">{item.quantity}</span>
            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
            <span className="font-bold text-black">{formatCurrency(item.service.unitPrice)}</span>
            </p>
            </div>
            <span className="font-black shrink-0 tabular-nums bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(item.totalAmount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};