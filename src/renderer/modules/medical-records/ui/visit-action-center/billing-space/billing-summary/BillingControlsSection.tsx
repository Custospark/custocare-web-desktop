import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { PaymentMethodItem } from './PaymentMethodItem';
import { ActionButtons } from './ActionButtons';
import { DiscountControl } from './DiscountControl';
import { formatCurrency } from '../../../revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';
interface BillingControlsSectionProps {
  colors: any;
  isReadOnly: boolean;
  paymentMethods: any[];
  focusedAmountInputs: Record<number, boolean>;
  cashChangeByIndex: Record<number, { dueBefore: number; change: number }>;
  discount: any;
  discountInputValue: string;
  billingData: any;
  isProcessing: boolean;
  isSubmitting: boolean;
  canFinalize: boolean;
  canPrint: boolean;
  hasRequiredIds: boolean;
  hideDiscountControl?: boolean;
  paymentIcon: (type: string) => React.ReactNode;
  getDisplayAmount: (index: number, amount: number) => string;
  onAddPaymentMethod: () => void;
  onPaymentTypeChange: (index: number, newType: string) => void;
  onRemovePaymentMethod: (index: number) => void;
  onMobilePhoneChange: (index: number, rawValue: string) => void;
  onInitiateMobilePayment: (index: number) => void;
  onPaymentAmountChange: (index: number, rawValue: string) => void;
  onAutoFillRemaining: (index: number) => void;
  onFocusAmountInput: (index: number) => void;
  onBlurAmountInput: (index: number) => void;
  onDiscountValueChange: (rawValue: string) => void;
  onDiscountTypeChange: (type: 'percentage' | 'fixed') => void;
  onDiscountFocus: () => void;
  onFinalizePayment: () => void;
  onPrintReceipt: () => void;
}


export const BillingControlsSection: React.FC<BillingControlsSectionProps> = ({
  colors,
  isReadOnly,
  paymentMethods,
  focusedAmountInputs,
  cashChangeByIndex,
  discount,
  discountInputValue,
  billingData,
  isProcessing,
  isSubmitting,
  canFinalize,
  canPrint,
  hasRequiredIds,
  hideDiscountControl,
  paymentIcon,
  getDisplayAmount,
  onAddPaymentMethod,
  onPaymentTypeChange,
  onRemovePaymentMethod,
  onMobilePhoneChange,
  onInitiateMobilePayment,
  onPaymentAmountChange,
  onAutoFillRemaining,
  onFocusAmountInput,
  onBlurAmountInput,
  onDiscountValueChange,
  onDiscountTypeChange,
  onDiscountFocus,
  onFinalizePayment,
  onPrintReceipt,
}) => {
  const financialSnapshot = useMemo(() => {
    const grandTotal = Number(billingData?.grandTotal || 0);
    const totalPaid = Number(billingData?.totalPaid || 0);
    const balance = Number(billingData?.balance || 0);
    const discountAmount = Number(billingData?.discountAmount || 0);

    const hasPositivePayment = totalPaid > 0;
    const isPartialPayment = hasPositivePayment && balance > 0;
    const isFullyCovered = hasPositivePayment && balance <= 0;

    return {
      grandTotal,
      totalPaid,
      balance,
      discountAmount,
      hasPositivePayment,
      isPartialPayment,
      isFullyCovered,
    };
  }, [billingData]);

  const helperMessage = useMemo(() => {
    if (isReadOnly) {
      return 'Payment has already been finalized. You can review the breakdown and print the receipt.';
    }

    if (!hasRequiredIds) {
      return 'Cannot finalize yet because visit or patient information is missing.';
    }

    if (!financialSnapshot.hasPositivePayment) {
      return 'Enter a payment amount greater than zero to finalize. Partial payments are allowed.';
    }

    if (financialSnapshot.isPartialPayment) {
      return 'Partial payment is allowed. Finalizing now will keep the remaining balance due on the visit.';
    }

    if (financialSnapshot.isFullyCovered) {
      return 'Payment fully covers the current amount due. You can finalize and then print the receipt.';
    }

    return 'Receipt preview updates in real-time. Cash entries calculate change automatically, and partial payments are supported.';
  }, [isReadOnly, hasRequiredIds, financialSnapshot]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className={`flex flex-col h-full border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm overflow-hidden ${
          isReadOnly ? 'opacity-90' : ''
        }`}
      >
        {/* Header */}
        <div className={`shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
          <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>
            {isReadOnly ? 'Payment Details' : 'Billing Controls'}
          </h3>
          <p className={`text-xs ${colors.text.secondary} mt-0.5`}>
            {isReadOnly
              ? 'Payment has been finalized. Only review and receipt printing are available.'
              : 'Enter payment amounts. Cash tendered calculates change automatically, and partial payments are allowed.'}
          </p>
        </div>

        {/* Financial snapshot */}
        <div className={`shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.primary}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`rounded-lg border ${colors.border.primary} ${colors.bg.secondary} p-3`}>
              <div className={`text-[11px] uppercase tracking-wide ${colors.text.tertiary}`}>
               Total
              </div>
              <div className={`mt-1 text-base font-bold ${colors.text.primary}`}>
                {formatCurrency(financialSnapshot.grandTotal)}
              </div>
            </div>

            <div className={`rounded-lg border ${colors.border.primary} ${colors.bg.secondary} p-3`}>
              <div className={`text-[11px] uppercase tracking-wide ${colors.text.tertiary}`}>
                Amount Received
              </div>
              <div className={`mt-1 text-base font-bold ${colors.text.primary}`}>
                {formatCurrency(financialSnapshot.totalPaid)}
              </div>
            </div>

            <div className={`rounded-lg border ${colors.border.primary} ${colors.bg.secondary} p-3`}>
              <div className={`text-[11px] uppercase tracking-wide ${colors.text.tertiary}`}>
                Balance Remaining
              </div>
              <div
                className={`mt-1 text-base font-bold ${
                  financialSnapshot.balance > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatCurrency(financialSnapshot.balance)}
              </div>
            </div>
          </div>

          {financialSnapshot.discountAmount > 0 && (
            <div className={`mt-3 text-xs ${colors.text.secondary}`}>
              Applied discount: <span className={`font-semibold ${colors.text.primary}`}>
                {formatCurrency(financialSnapshot.discountAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable controls */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 space-y-4"
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className={`border ${colors.border.primary} rounded-lg overflow-hidden shadow-sm`}>
            <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h4 className={`text-sm font-bold ${colors.text.primary}`}>Payment Methods</h4>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={onAddPaymentMethod}
                    disabled={paymentMethods.length >= 3}
                    className={`text-xs font-semibold px-3 py-1.5 border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}
                    transition-all duration-200 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm active:scale-95`}
                  >
                    + Add Method
                  </button>
                )}
              </div>
            </div>

            <div className={`p-4 space-y-3 ${colors.bg.secondary}`}>
              {paymentMethods.map((method, index) => (
                <div key={index}>
                  <PaymentMethodItem
                    method={method}
                    index={index}
                    paymentMethods={paymentMethods}
                    isReadOnly={isReadOnly}
                    colors={colors}
                    paymentIcon={paymentIcon}
                    focusedAmountInputs={focusedAmountInputs}
                    cashChangeByIndex={cashChangeByIndex}
                    getDisplayAmount={getDisplayAmount}
                    onPaymentTypeChange={onPaymentTypeChange}
                    onRemovePaymentMethod={onRemovePaymentMethod}
                    onMobilePhoneChange={onMobilePhoneChange}
                    onInitiateMobilePayment={onInitiateMobilePayment}
                    onPaymentAmountChange={onPaymentAmountChange}
                    onAutoFillRemaining={onAutoFillRemaining}
                    onFocusAmountInput={onFocusAmountInput}
                    onBlurAmountInput={onBlurAmountInput}
                    isProcessing={isProcessing}
                  />

                 {index === paymentMethods.length - 1 && (
              <>
                {!hideDiscountControl && (
                 <DiscountControl
                  discount={discount}
                  discountInputValue={discountInputValue}
                  billingData={billingData}
                  isReadOnly={isReadOnly}
                  colors={colors}
                  onDiscountValueChange={onDiscountValueChange}
                  onDiscountTypeChange={onDiscountTypeChange}
                  onDiscountFocus={onDiscountFocus}
/>
                )}

                <ActionButtons
                  isReadOnly={isReadOnly}
                  canFinalize={canFinalize}
                  canPrint={canPrint}
                  isProcessing={isProcessing}
                  isSubmitting={isSubmitting}
                  hasRequiredIds={hasRequiredIds}
                  colors={colors}
                  totalPaid={Number(billingData?.totalPaid || 0)}
                  balanceDue={Number(billingData?.balance || 0)}
                  grandTotal={Number(billingData?.grandTotal || 0)}
                  onFinalizePayment={onFinalizePayment}
                  onPrintReceipt={onPrintReceipt}
                />
              </>
            )}

                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer helper */}
        <div className={`shrink-0 px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} shrink-0 mt-0.5`} />
            <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
              {helperMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};