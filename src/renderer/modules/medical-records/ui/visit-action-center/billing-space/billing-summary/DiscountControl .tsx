import React from 'react';
import { formatCurrency } from '../billing-types';

interface DiscountControlProps {
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  billingData: {
    subtotal?: number;
    discountAmount?: number;
  };
  isReadOnly: boolean;
  colors: any;
  onDiscountChange: (type: 'percentage' | 'fixed', rawValue: string) => void;
  onDiscountFocus: () => void;
}

export const DiscountControl: React.FC<DiscountControlProps> = ({
  discount,
  billingData,
  isReadOnly,
  colors,
  onDiscountChange,
  onDiscountFocus,
}) => {
  const displayedSubtotal = Number(billingData?.subtotal || 0);
  const appliedDiscountAmount = Number(billingData?.discountAmount || 0);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDiscountChange(discount.type, e.target.value);
  };

  const handleTypeChange = (type: 'percentage' | 'fixed') => {
    onDiscountChange(type, String(discount.value || 0));
  };

  return (
    <div className={`mt-3 pt-3 border-t ${colors.border.primary}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`text-sm font-bold ${colors.text.primary}`}>Discount</div>
        <div className={`text-xs ${colors.text.secondary}`}>
          {discount.value > 0
            ? `Applied: ${formatCurrency(appliedDiscountAmount)}`
            : 'Not applied'}
        </div>
      </div>

      {!isReadOnly ? (
        <div className="flex items-stretch gap-2">
          <input
            type="number"
            value={discount.value === 0 ? '' : String(discount.value)}
            onFocus={onDiscountFocus}
            onChange={handleValueChange}
            placeholder="0"
            min={0}
            max={discount.type === 'percentage' ? 100 : displayedSubtotal}
            step="0.01"
            className={`flex-1 px-3.5 py-2.5 text-sm border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}
            focus:outline-none focus:ring-2 ${colors.accent.ring} rounded-lg transition-shadow`}
          />

          <div className={`flex border ${colors.border.primary} overflow-hidden rounded-lg`}>
            <button
              type="button"
              onClick={() => handleTypeChange('percentage')}
              className={`px-3 sm:px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer
                ${
                  discount.type === 'percentage'
                    ? `${colors.accent.primary} ${colors.accent.text}`
                    : `${colors.bg.hover} ${colors.text.secondary}`
                }`}
            >
              %
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('fixed')}
              className={`px-3 sm:px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer border-l ${colors.border.primary}
                ${
                  discount.type === 'fixed'
                    ? `${colors.accent.primary} ${colors.accent.text}`
                    : `${colors.bg.hover} ${colors.text.secondary}`
                }`}
            >
              Fixed
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-3 ${colors.bg.secondary} rounded-lg text-sm ${colors.text.secondary}`}>
          {discount.value > 0
            ? `${discount.type === 'percentage' ? `${discount.value}%` : formatCurrency(discount.value)} discount applied`
            : 'No discount applied'}
        </div>
      )}
    </div>
  );
};
