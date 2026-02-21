import React from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../billing-types';
interface BillingSummaryProps {
  subtotal: number;
  isReadOnly: boolean;
  isDisabledProceed: boolean;
  theme: 'light' | 'dark';
  colors: any;
  onProceedToBilling: () => void;
}

export const BillingSummary: React.FC<BillingSummaryProps> = ({
  subtotal,
  isReadOnly,
  isDisabledProceed,
  colors,
  onProceedToBilling,
}) => {
  return (
    <div className="lg:col-span-4 xl:col-span-3 min-h-0">
      <div className="lg:sticky lg:top-4 space-y-4">
        {/* Summary Card */}
        <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
          <h3 className={`text-base sm:text-lg font-bold mb-4 ${colors.text.primary}`}>Bill summary</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={colors.text.secondary}>Subtotal</span>
              <span className={`text-lg font-extrabold bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent`}>
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={colors.text.secondary}>Tax</span>
              <span className={colors.text.tertiary}>Handled next</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={colors.text.secondary}>Discount</span>
              <span className={colors.text.tertiary}>Handled next</span>
            </div>

            <div className={`pt-4 border-t ${colors.border.primary}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${colors.text.secondary}`}>Grand total</span>
                <span className="text-lg font-extrabold bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Proceed Button Card */}
        <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
          <button
            type="button"
            onClick={onProceedToBilling}
            disabled={isDisabledProceed}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold transition-all duration-200
            rounded-lg ${
              isDisabledProceed
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer 
                hover:shadow-lg active:scale-[0.98]`
            }`}
          >
            <span>{isReadOnly ? 'View Billing Summary' : 'Proceed to billing'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="mt-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className={`text-xs leading-relaxed ${colors.text.secondary}`}>
              {isReadOnly 
                ? 'This billing session is settled. You can view the items but cannot make changes.'
                : 'Taxes, discounts, payment methods, and receipt printing are handled in Billing Summary.'}
            </p>
          </div>
        </div>

        {/* Workflow Tip Card */}
        <div className={`p-4 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
          <p className={`text-xs ${colors.text.secondary}`}>
            <span className="font-semibold">Workflow tip:</span>{' '}
            {isReadOnly 
              ? 'Settled billing sessions are locked. Use the print option in Billing Summary to reprint receipts.'
              : 'keep the cursor in the search box and keep selecting items.'}
          </p>
        </div>
      </div>
    </div>
  );
};
