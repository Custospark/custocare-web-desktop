// components/BillingControlsSection.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PaymentMethodItem } from './PaymentMethodItem';
import { ActionButtons } from './ActionButtons';
import { DiscountControl } from './DiscountControl ';

interface BillingControlsSectionProps {
  colors: any;
  isReadOnly: boolean;
  paymentMethods: any[];
  focusedAmountInputs: Record<number, boolean>;
  cashChangeByIndex: Record<number, { dueBefore: number; change: number }>;
  discount: any;
  billingData: any;
  isProcessing: boolean;
  isSubmitting: boolean;
  canFinalize: boolean;
  canPrint: boolean;
  hasRequiredIds: boolean;
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
  onDiscountChange: (type: 'percentage' | 'fixed', rawValue: string) => void;
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
  billingData,
  isProcessing,
  isSubmitting,
  canFinalize,
  canPrint,
  hasRequiredIds,
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
  onDiscountChange,
  onDiscountFocus,
  onFinalizePayment,
  onPrintReceipt,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className={`flex flex-col h-full border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm overflow-hidden ${
          isReadOnly ? 'opacity-90' : ''
        }`}
      >
        {/* Fixed header */}
        <div className={`shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
          <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>
            {isReadOnly ? 'Payment Details (Read-only)' : 'Billing Controls'}
          </h3>
          <p className={`text-xs ${colors.text.secondary} mt-0.5`}>
            {isReadOnly
              ? 'Payment has been finalized. Only receipt printing is available.'
              : 'Enter cash tendered amount → system automatically calculates change'}
          </p>
        </div>

        {/* Scrollable controls content */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0 space-y-4"
          style={{ scrollbarGutter: 'stable' }}
        >
          {/* Payment methods section */}
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

                  {/* Discount section - only show on last payment method */}
                  {index === paymentMethods.length - 1 && (
                    <>
                      <DiscountControl
                        discount={discount}
                        billingData={billingData}
                        isReadOnly={isReadOnly}
                        colors={colors}
                        onDiscountChange={onDiscountChange}
                        onDiscountFocus={onDiscountFocus}
                      />

                      <ActionButtons
                        isReadOnly={isReadOnly}
                        canFinalize={canFinalize}
                        canPrint={canPrint}
                        isProcessing={isProcessing}
                        isSubmitting={isSubmitting}
                        hasRequiredIds={hasRequiredIds}
                        colors={colors}
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

        {/* Fixed footer info */}
        <div className={`shrink-0 px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} shrink-0 mt-0.5`} />
            <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
              {isReadOnly
                ? 'Payment completed. You can still print the receipt.'
                : 'Receipt preview updates in real-time. Finalize when balance is fully covered.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
