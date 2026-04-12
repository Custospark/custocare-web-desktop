import React from 'react';
import { Package, X } from 'lucide-react';
import type { ReceiptTransactionShape } from './ReceiptTypes';
import { formatCurrency } from '../../../../stats/billing-revenue-stats-component/revenueDashboardUtils';
interface ReceiptServicesProps {
  selectedTransaction: ReceiptTransactionShape;
}

export const ReceiptServices: React.FC<ReceiptServicesProps> = ({ selectedTransaction }) => {
  const items = selectedTransaction?.charge_items ?? [];

  if (items.length === 0) {
    return (
      <div className="mb-3 sm:mb-4 relative">
        <h3 className="text-xs sm:text-sm font-black mb-2 sm:mb-3 text-gray-800 flex items-center gap-2">
          <Package className="w-3 h-3 sm:w-4 sm:h-4" /> SERVICES RENDERED
        </h3>
        <div className="text-[10px] sm:text-xs text-gray-500 italic">
          No billable items recorded.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 sm:mb-4 relative">
      <h3 className="text-xs sm:text-sm font-black mb-2 sm:mb-3 text-gray-800 flex items-center gap-2">
        <Package className="w-3 h-3 sm:w-4 sm:h-4" /> SERVICES RENDERED
      </h3>

      <div className="space-y-1.5 sm:space-y-2.5">
        {items.map((item: any) => (
          <div
            key={item.id}
            className="flex justify-between text-[10px] sm:text-xs border-b border-gray-200 pb-1 sm:pb-2 p-0.5 sm:p-1 rounded gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold truncate">{item.service?.name}</p>
                {/* {item.source === 'backend' && (
                  <span className="text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                    Saved
                  </span>
                )} */}
                {item.source === 'slice' && (
                  <span className="text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                    New
                  </span>
                )}
              </div>

              <p className="text-[9px] sm:text-[11px] text-gray-600 mt-0.5 flex items-center gap-1 truncate">
                <span className="font-semibold">{item.quantity}</span>
                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
                <span className="font-bold text-black">{formatCurrency(Number(item.service?.unitPrice || 0))}</span>
              </p>

              {item.service?.code && (
                <p className="text-[8px] sm:text-[10px] text-gray-500 mt-0.5 truncate">
                  {item.service.code}
                </p>
              )}
            </div>

            <span className="font-black shrink-0 tabular-nums bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              {formatCurrency(Number(item.totalAmount || 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
