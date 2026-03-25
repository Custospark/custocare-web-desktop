import React from 'react';
import { ArrowRight, AlertCircle, CreditCard, Save, Send } from 'lucide-react';
import { formatCurrency } from '../billing-types';

interface BillingSummaryProps {
  subtotal: number;
  isReadOnly: boolean;
  isDisabledProceed: boolean;
  theme: 'light' | 'dark';
  colors: any;
  onProceedToBilling: () => void;
  activeOption?: 'payment' | 'save' | 'forward' | 'default';
}

export const BillingSummary: React.FC<BillingSummaryProps> = ({
  subtotal,
  isReadOnly,
  isDisabledProceed,
  colors,
  onProceedToBilling,
  activeOption = 'default',
}) => {

  // Finish & Exit (Pay Later)
  const handleSaveAndExit = () => {
    if (!isDisabledProceed) {
      console.log('Finish & Exit (bill pending)');
      // Persist bill + close encounter
    }
  };

  // Forward Patient (encounter remains open)
  const handleForwardPatient = () => {
    if (!isDisabledProceed) {
      console.log('Forward patient (encounter continues)');
      // Save current services + route to next department
    }
  };

  // Proceed to Payment (closes encounter)
  const handleProceedToPayment = () => {
    if (!isDisabledProceed) {
      onProceedToBilling();
    }
  };

  const showPaymentOption = activeOption === 'payment' || activeOption === 'default';
  const showSaveOption = activeOption === 'save' || activeOption === 'default';
  const showForwardOption = activeOption === 'forward' || activeOption === 'default';

  const getButtonStyle = (isDisabled: boolean) => {
    return isDisabled
      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
      : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text} cursor-pointer hover:shadow-lg active:scale-[0.98]`;
  };

  return (
    <div className="lg:col-span-4 xl:col-span-3 min-h-0">
      <div className="lg:sticky lg:top-4 space-y-4">

        {/* Summary */}
        <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
          <h3 className={`text-base sm:text-lg font-bold mb-4 ${colors.text.primary}`}>
            Billing Summary
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={colors.text.secondary}>Subtotal</span>
              <span className="text-lg font-extrabold bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className={colors.text.secondary}>Tax</span>
              <span className={colors.text.tertiary}>Applied at payment</span>
            </div>

            <div className="flex justify-between">
              <span className={colors.text.secondary}>Discount</span>
              <span className={colors.text.tertiary}>Applied at payment</span>
            </div>

            <div className={`pt-4 border-t ${colors.border.primary}`}>
              <div className="flex justify-between">
                <span className={`text-sm font-semibold ${colors.text.secondary}`}>
                  Estimated Total
                </span>
                <span className="text-lg font-extrabold bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`p-4 sm:p-5 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl space-y-3`}>

          {showPaymentOption && (
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isDisabledProceed}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all ${getButtonStyle(isDisabledProceed)}`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Send to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {showForwardOption && (
            <button
              type="button"
              onClick={handleForwardPatient}
              disabled={isDisabledProceed}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all ${getButtonStyle(isDisabledProceed)}`}
            >
              <Send className="w-4 h-4" />
              <span>Forward Patient</span>
            </button>
          )}

          {showSaveOption && (
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={isDisabledProceed}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all ${getButtonStyle(isDisabledProceed)}`}
            >
              <Save className="w-4 h-4" />
              <span>Finish & Exit (Pay Later)</span>
            </button>
          )}

          {/* Info */}
          <div className="mt-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
            <p className={`text-xs ${colors.text.secondary}`}>
              {isReadOnly
                ? 'This encounter is closed. Billing details are locked.'
                : getInfoMessage(activeOption)}
            </p>
          </div>
        </div>

        {/* Tip */}
        <div className={`p-4 border ${colors.border.primary} ${colors.bg.secondary} rounded-xl`}>
          <p className={`text-xs ${colors.text.secondary}`}>
            <span className="font-semibold">Workflow tip:</span>{' '}
            {getWorkflowTip(isReadOnly, activeOption)}
          </p>
        </div>

      </div>
    </div>
  );
};

// Info messaging aligned with real workflow
const getInfoMessage = (activeOption: string): string => {
  switch (activeOption) {
    case 'payment':
      return 'Bill is already created. Patient will proceed to payment and encounter will be closed.';
    case 'save':
      return 'Encounter will be closed. Bill remains pending and can be paid later.';
    case 'forward':
      return 'Patient continues care. Encounter remains open and more services can be added.';
    default:
      return 'A bill is automatically created from services. Choose the next step to continue.';
  }
};

// Workflow guidance
const getWorkflowTip = (isReadOnly: boolean, activeOption: string): string => {
  if (isReadOnly) {
    return 'Closed encounters cannot be modified. You may reprint receipts if needed.';
  }

  switch (activeOption) {
    case 'payment':
      return 'Use this when consultation is complete and no more services are expected.';
    case 'save':
      return 'Use for insurance or deferred payments. Patient can return later.';
    case 'forward':
      return 'Use when patient needs lab, pharmacy, or another clinician before final billing.';
    default:
      return 'Forward patients if more services are needed before final payment.';
  }
};