import React from 'react';
import { RefreshCw, AlertCircle, Banknote, CreditCard, Wallet, Receipt, User } from 'lucide-react';
import type { ReceiptTransactionShape, RefundedItem } from './ReceiptTypes';
import { formatCurrency } from '../../../../../visit-action-center/billing-space';

interface ReceiptRefundsProps {
  selectedTransaction: ReceiptTransactionShape;
}

export const ReceiptRefunds: React.FC<ReceiptRefundsProps> = ({ selectedTransaction }) => {
  const refundedItems = selectedTransaction?.refunded_items ?? [];

  if (refundedItems.length === 0) {
    return null;
  }

  // Group refunds by adjustment
  const groupedByAdjustment = refundedItems.reduce((acc, item) => {
    const key = item.adjustment_id || item.adjustment_reference || 'unknown';
    if (!acc[key]) {
      acc[key] = {
        adjustment_id: item.adjustment_id,
        adjustment_reference: item.adjustment_reference,
        adjustment_type: item.adjustment_type,
        adjustment_created_at: item.adjustment_created_at,
        refund_info: item.refund_info,
        refunded_by_staff_name: item.refund_info?.refunded_by_staff_name,
        refunded_by_staff_id: item.refund_info?.refunded_by_staff_id,
        items: [],
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, any>);

  const getRefundMethodIcon = (methodType: string) => {
    switch (methodType?.toLowerCase()) {
      case 'cash': return <Banknote className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
      case 'credit_card':
      case 'card': return <CreditCard className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
      default: return <Wallet className="w-2.5 h-2.5 sm:w-3 sm:h-3" />;
    }
  };

  // Calculate totals (once per adjustment)
  const totals = Object.values(groupedByAdjustment).reduce((sums, group: any) => ({
    refundAmount: sums.refundAmount + (group.refund_info?.refund_amount || 0),
    patientRefund: sums.patientRefund + (group.refund_info?.patient_refund || 0),
    insuranceRefund: sums.insuranceRefund + (group.refund_info?.insurance_refund || 0),
  }), { refundAmount: 0, patientRefund: 0, insuranceRefund: 0 });

  // Refund Header Component
  const RefundHeader = ({ group }: { group: any }) => (
    <div className="bg-red-50 rounded-lg p-2 sm:p-3 mb-2 border border-red-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-[10px] sm:text-xs font-bold text-red-700">
            {group.adjustment_type === 'full_refund' ? 'FULL REFUND' : 'PARTIAL REFUND'}
          </p>
          {group.adjustment_reference && (
            <p className="text-[8px] sm:text-[9px] text-gray-500 mt-0.5">
              Ref #: {group.adjustment_reference}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] sm:text-xs font-black text-red-700">
            {formatCurrency(group.refund_info?.refund_amount || 0)}
          </p>
          {group.adjustment_created_at && (
            <p className="text-[8px] sm:text-[9px] text-gray-500">
              {new Date(group.adjustment_created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Refunded By Staff Info */}
      {(group.refunded_by_staff_name || group.refunded_by_staff_id) && (
        <div className="mb-2 p-1.5 bg-white rounded border border-red-100">
          <p className="text-[8px] sm:text-[9px] font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <User className="w-2.5 h-2.5" /> PROCESSED BY
          </p>
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-gray-700">
            {group.refunded_by_staff_name && (
              <span className="font-medium">{group.refunded_by_staff_name}</span>
            )}
            {group.refunded_by_staff_id && (
              <span className="text-gray-400">(Staff Number: {group.refunded_by_staff_id})</span>
            )}
          </div>
        </div>
      )}

      {/* Refund Methods */}
      {group.refund_info?.refund_methods?.length > 0 && (
        <div className="mb-2 p-1.5 bg-white rounded border border-red-100">
          <p className="text-[8px] sm:text-[9px] font-semibold text-gray-600 mb-1">
            REFUND METHOD{group.refund_info.refund_methods.length > 1 ? 'S' : ''}
          </p>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {group.refund_info.refund_methods.map((method: any, idx: number) => (
              <span key={idx} className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-600">
                {getRefundMethodIcon(method.type)}
                <span>{method.type?.replace('_', ' ').toUpperCase()}</span>
                <span className="font-semibold">{formatCurrency(method.amount)}</span>
                {method.reference && <span className="text-gray-400">({method.reference})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Refund Reason */}
      {group.refund_info?.refund_reason && (
        <div className="flex items-start gap-1 text-[8px] sm:text-[9px] text-amber-700 bg-amber-50 p-1.5 rounded">
          <AlertCircle className="w-2.5 h-2.5 mt-0.5 shrink-0" />
          <span className="italic">{group.refund_info.refund_reason}</span>
        </div>
      )}
    </div>
  );

  // Refund Item Row Component
  const RefundItemRow = ({ item }: { item: RefundedItem }) => {
    const refundPortion = Number(item.totalAmount) || 0;
    
    return (
      <div className="flex justify-between text-[10px] sm:text-xs border-b border-red-100 pb-1 sm:pb-2 p-0.5 sm:p-1 rounded gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-bold truncate text-gray-700">{item.service?.name}</p>
            <span className="text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">Refunded</span>
          </div>
          <div className="mt-0.5">
            <p className="text-[9px] sm:text-[11px] text-gray-600">
              Qty: {item.quantity?.original ?? item.quantity} → {item.quantity?.refunded ?? (refundPortion / (item.service?.unitPrice || 1)).toFixed(2)}
            </p>
            <p className="text-[9px] sm:text-[11px] text-gray-500">
              @ {formatCurrency(Number(item.service?.unitPrice || 0))} = {formatCurrency(refundPortion)}
            </p>
            {item.service?.code && (
              <p className="text-[8px] sm:text-[10px] text-gray-500 mt-0.5">Code: {item.service.code}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="font-black text-red-600">{formatCurrency(refundPortion)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-3 sm:mb-4 relative border-t-2 border-red-200 pt-2 sm:pt-3 mt-2">
      <h3 className="text-xs sm:text-sm font-black mb-2 sm:mb-3 text-red-600 flex items-center gap-2">
        <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" /> REFUNDED ITEMS
      </h3>

      {Object.values(groupedByAdjustment).map((group: any) => (
        <div key={group.adjustment_id || group.adjustment_reference} className="mb-3">
          <RefundHeader group={group} />
          <div className="space-y-1.5 sm:space-y-2">
            {group.items.map((item: RefundedItem) => (
              <RefundItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}

      {/* Total Refund Summary */}
      <div className="mt-3 pt-2 border-t border-red-200">
        <div className="flex justify-between items-center text-[11px] sm:text-xs">
          <span className="font-bold text-red-700 flex items-center gap-1">
            <Receipt className="w-3 h-3" /> TOTAL REFUNDED
          </span>
          <span className="font-black text-red-700 text-sm sm:text-base">
            {formatCurrency(totals.refundAmount)}
          </span>
        </div>
        
        {totals.patientRefund > 0 && (
          <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-600 mt-1">
            <span>Patient Refund:</span>
            <span>{formatCurrency(totals.patientRefund)}</span>
          </div>
        )}
        
        {totals.insuranceRefund > 0 && (
          <div className="flex justify-between text-[9px] sm:text-[10px] text-gray-600 mt-0.5">
            <span>Insurance Refund:</span>
            <span>{formatCurrency(totals.insuranceRefund)}</span>
          </div>
        )}
      </div>
    </div>
  );
};