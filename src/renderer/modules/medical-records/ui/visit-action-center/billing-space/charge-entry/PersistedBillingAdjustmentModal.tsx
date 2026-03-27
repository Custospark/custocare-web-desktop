import React from 'react';
import { XCircle, Info } from 'lucide-react';
import type { BackendChargeItem } from '../billing-types';
import { formatCurrency } from '../billing-types';

interface PersistedBillingAdjustmentModalProps {
  open: boolean;
  theme: 'light' | 'dark';
  item: BackendChargeItem | null;
  quantity: number;
  reason: string;
  isSubmitting: boolean;
  onClose: () => void;
  onQuantityChange: (quantity: number) => void;
  onReasonChange: (reason: string) => void;
  onSubmit: () => void;
}

export const PersistedBillingAdjustmentModal: React.FC<PersistedBillingAdjustmentModalProps> = ({
  open,
  theme,
  item,
  quantity,
  reason,
  isSubmitting,
  onClose,
  onQuantityChange,
  onReasonChange,
  onSubmit,
}) => {
  const isDark = theme === 'dark';

  if (!open || !item) return null;

  const reasonRequired = item.permissions?.reason_required ?? true;
  const currentQuantity = item.quantity;
  const unitPrice = item.service.unitPrice;

  const isIncrease = quantity > currentQuantity;
  const isDecrease = quantity < currentQuantity;
  const isRemove = quantity === 0;
  const delta = Math.abs(quantity - currentQuantity);
  const deltaAmount = delta * unitPrice;

  const getActionLabel = () => {
    if (isRemove) return 'Remove item';
    if (isIncrease) return `Increase by ${delta} unit${delta !== 1 ? 's' : ''}`;
    if (isDecrease) return `Decrease by ${delta} unit${delta !== 1 ? 's' : ''}`;
    return 'No change';
  };

  const getActionColor = () => {
    if (isRemove) return isDark ? 'text-rose-400' : 'text-rose-600';
    if (isIncrease) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (isDecrease) return isDark ? 'text-amber-400' : 'text-amber-600';
    return isDark ? 'text-gray-400' : 'text-gray-500';
  };

  const handleQuantityChange = (newQuantity: number) => {
    const clamped = Math.min(9999, Math.max(0, newQuantity));
    onQuantityChange(clamped);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div
        className={`w-full max-w-lg rounded-xl border shadow-xl ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <h3 className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Adjust persisted item
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              Audit required
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md p-1 transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Item Summary */}
        <div className={`px-5 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {item.service.name}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {item.service.code}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Unit Cost: {formatCurrency(unitPrice)}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Current: {currentQuantity}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Entered by</p>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.enteredByStaffName?.split(' ')[0] || 'Staff'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="p-5 space-y-4">
          {/* New Quantity Input */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              New quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 0}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                  quantity <= 0
                    ? isDark ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                −
              </button>
              <input
                type="number"
                min={0}
                max={9999}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                className={`w-24 text-center py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-100'
                    : 'bg-white border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 9999}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                  quantity >= 9999
                    ? isDark ? 'border-gray-700 text-gray-600 cursor-not-allowed' : 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleQuantityChange(0)}
                className={`ml-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
                  isDark
                    ? 'border-rose-800/50 text-rose-400 hover:bg-rose-950/30'
                    : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                }`}
              >
                Remove all
              </button>
            </div>
          </div>

          {/* Action Summary */}
          {(isIncrease || isDecrease || isRemove) && (
            <div className={`rounded-lg p-3 ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className={`w-4 h-4 ${getActionColor()}`} />
                  <span className={`text-sm font-medium ${getActionColor()}`}>
                    {getActionLabel()}
                  </span>
                </div>
                {delta > 0 && (
                  <span className={`text-sm font-semibold ${getActionColor()}`}>
                    {isIncrease ? '+' : '-'}{formatCurrency(deltaAmount)}
                  </span>
                )}
              </div>
              {quantity > 0 && (
                <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-gray-600/20">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    New total
                  </span>
                  <span className={`text-sm font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent`}>
                    {formatCurrency(quantity * unitPrice)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reason Field */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Reason for adjustment
              {reasonRequired && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
              placeholder="Required for audit trail: e.g., duplicate correction, quantity error, medication reconciliation..."
              className={`w-full rounded-lg border px-3 py-2 text-sm resize-none ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 px-5 py-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || (reasonRequired && !reason.trim()) || quantity === currentQuantity}
            onClick={onSubmit}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors ${
              isSubmitting || (reasonRequired && !reason.trim()) || quantity === currentQuantity
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Applying...' : 'Apply adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersistedBillingAdjustmentModal;