// ReceiptMetaInfo.tsx
import React from 'react';
import { Hash, User, Tag, Calendar, Clock } from 'lucide-react';
import type { ReceiptTransactionShape } from './ReceiptTypes';
import { formatDisplayDate, formatDisplayTime } from './ReceiptTypes';

interface ReceiptMetaInfoProps {
  selectedTransaction: ReceiptTransactionShape;
}

export const ReceiptMetaInfo: React.FC<ReceiptMetaInfoProps> = ({ selectedTransaction }) => {
  return (
    <div className="border-t-2 border-b-2 border-gray-300 py-2 sm:py-3 my-3 sm:my-4 text-[10px] sm:text-xs space-y-1 sm:space-y-1.5 relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Hash className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Receipt Number:
        </span>
        <span className="font-black break-all">{selectedTransaction.receipt_number || 'DRAFT'}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Patient Name:
        </span>
        <span className="font-bold wrap-break-word">{selectedTransaction.patient_name}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Patient Number:
        </span>
        <span className="break-all">{selectedTransaction.patient_number}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Date:
        </span>
        <span>{formatDisplayDate(selectedTransaction.created_at)}</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-0">
        <span className="text-gray-600 font-semibold flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Time:
        </span>
        <span>{formatDisplayTime(selectedTransaction.created_at)}</span>
      </div>
    </div>
  );
};
