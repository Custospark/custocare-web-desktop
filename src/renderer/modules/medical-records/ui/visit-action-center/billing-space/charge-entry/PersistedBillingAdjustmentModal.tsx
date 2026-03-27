import React from 'react';
import { X, Info, Minus, Plus, Trash2 } from 'lucide-react';
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

  const getActionBgColor = () => {
    if (isRemove) return isDark ? 'bg-rose-500/10' : 'bg-rose-50';
    if (isIncrease) return isDark ? 'bg-emerald-500/10' : 'bg-emerald-50';
    if (isDecrease) return isDark ? 'bg-amber-500/10' : 'bg-amber-50';
    return '';
  };

  const handleQuantityChange = (newQuantity: number) => {
    const clamped = Math.min(9999, Math.max(0, newQuantity));
    onQuantityChange(clamped);
  };

  const isSubmitDisabled = isSubmitting || (reasonRequired && !reason.trim()) || quantity === currentQuantity;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        } animate-in slide-in-from-bottom-4 duration-300`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <Info className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                Adjust saved item
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                Every change is recorded — so we always know who updated what.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl p-2 transition-all duration-200 cursor-pointer ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Summary */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`font-semibold text-base ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {item.service.name}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                  {item.service.code}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Unit: {formatCurrency(unitPrice)}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Current: {currentQuantity}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Added by</p>
              <p className={`text-sm font-medium mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.enteredByStaffName?.split(' ')[0] || 'Staff'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="p-6 space-y-5">
          {/* New Quantity Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              New quantity
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 0}
                className={`w-10 h-10 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  quantity <= 0
                    ? isDark ? 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50' : 'border-gray-200 text-gray-300 cursor-not-allowed opacity-50'
                    : isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300 hover:scale-105' : 'border-gray-200 hover:bg-gray-50 text-gray-600 hover:scale-105'
                }`}
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={0}
                max={9999}
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                className={`w-28 text-center py-2.5 rounded-xl border font-medium ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500'
                    : 'bg-white border-gray-200 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all`}
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= 9999}
                className={`w-10 h-10 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer ${
                  quantity >= 9999
                    ? isDark ? 'border-gray-700 text-gray-600 cursor-not-allowed opacity-50' : 'border-gray-200 text-gray-300 cursor-not-allowed opacity-50'
                    : isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-300 hover:scale-105' : 'border-gray-200 hover:bg-gray-50 text-gray-600 hover:scale-105'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleQuantityChange(0)}
                className={`ml-2 text-sm px-3 py-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isDark
                    ? 'border-rose-800/50 text-rose-400 hover:bg-rose-950/30 hover:scale-105'
                    : 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:scale-105'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Remove all
              </button>
            </div>
          </div>

          {/* Action Summary */}
          {(isIncrease || isDecrease || isRemove) && (
            <div className={`rounded-xl p-4 ${getActionBgColor()} border ${isDark ? 'border-gray-800' : 'border-gray-100'} transition-all`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className={`w-4 h-4 ${getActionColor()}`} />
                  <span className={`text-sm font-semibold ${getActionColor()}`}>
                    {getActionLabel()}
                  </span>
                </div>
                {delta > 0 && (
                  <span className={`text-sm font-bold ${getActionColor()}`}>
                    {isIncrease ? '+' : '-'}{formatCurrency(deltaAmount)}
                  </span>
                )}
              </div>
              {quantity > 0 && (
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-current border-opacity-20">
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    New total value
                  </span>
                  <span className={`text-base font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent`}>
                    {formatCurrency(quantity * unitPrice)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Reason Field */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Reason for adjustment
              {reasonRequired && <span className="text-rose-500 ml-1">*</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
              placeholder="Required for audit trail: e.g., duplicate correction, quantity error, medication reconciliation..."
              className={`w-full rounded-xl border px-4 py-2.5 text-sm resize-none transition-all ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
            />
            <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Add a reason — this will be saved with the change.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={onSubmit}
            className={`px-5 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 cursor-pointer ${
              isSubmitDisabled
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Applying...
              </div>
            ) : (
              'Apply adjustment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersistedBillingAdjustmentModal;